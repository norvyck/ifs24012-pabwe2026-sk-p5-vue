import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { userApi } from '../api/userApi'
import { useAuthStore } from '../../auth/states/authStore'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'
import ProfilePage from './ProfilePage.vue'
import UsersPage from './UsersPage.vue'

vi.mock('../api/userApi', () => ({
  userApi: {
    getUsers: vi.fn(), getProfile: vi.fn(), updateProfile: vi.fn(),
    updatePhoto: vi.fn(), changePassword: vi.fn(),
  },
}))
vi.mock('../../../helpers/toolsHelper', () => ({
  formatDate: vi.fn((value) => `date:${value}`),
  resolveAssetUrl: vi.fn((value) => `asset:${value}`),
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}))

function mountPage(component) {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(component, {
    global: {
      plugins: [pinia],
    },
  })
}

describe('user pages', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
    localStorage.clear()
    useAuthStore().user = { id: 1, name: 'Ayu Buyer', email: 'ayu@example.test' }
    showErrorDialog.mockResolvedValue({})
    showSuccessDialog.mockResolvedValue({})
  })

  afterEach(() => vi.restoreAllMocks())

  it('loads, searches, and renders community profiles', async () => {
    userApi.getUsers.mockResolvedValue([
      { id: 1, name: 'Ayu Buyer', email: 'ayu@example.test', created_at: '2026-01-01' },
      { id: 2, name: 'Bima Seller', email: 'bima@example.test', photo: '/bima.png', created_at: '2026-02-01' },
    ])
    const page = mountPage(UsersPage)
    await flushPromises()

    expect(userApi.getUsers).toHaveBeenCalledOnce()
    expect(page.text()).toContain('Ayu Buyer')
    expect(page.get('img').attributes('src')).toBe('asset:/bima.png')
    await page.get('input[aria-label="Cari pengguna"]').setValue('BIMA@')
    expect(page.text()).toContain('Bima Seller')
    expect(page.text()).not.toContain('Ayu Buyer')
    await page.get('input[aria-label="Cari pengguna"]').setValue('missing')
    expect(page.text()).toContain('Belum menemukan pengguna.')
    page.unmount()
  })

  it('shows a community loading error with a retry action', async () => {
    userApi.getUsers.mockRejectedValueOnce(new Error('Server offline')).mockResolvedValueOnce([])
    const page = mountPage(UsersPage)
    await flushPromises()
    expect(page.text()).toContain('Server offline')
    await page.get('.state-card button').trigger('click')
    await flushPromises()
    expect(userApi.getUsers).toHaveBeenCalledTimes(2)
    expect(page.text()).toContain('Belum menemukan pengguna.')
    page.unmount()
  })

  it('loads profile details and saves normalized profile information', async () => {
    userApi.getProfile.mockResolvedValue({
      id: 1, name: 'Ayu Buyer', email: 'ayu@example.test', photo: '/ayu.png', created_at: '2026-01-01',
    })
    userApi.updateProfile.mockResolvedValue({ id: 1, name: 'Ayu Updated', email: 'updated@example.test' })
    const page = mountPage(ProfilePage)
    await flushPromises()

    expect(page.text()).toContain('Ayu Buyer')
    expect(page.get('.profile-avatar img').attributes('src')).toBe('asset:/ayu.png')
    const fields = page.findAll('.settings-card input')
    await fields[0].setValue(' Ayu Updated ')
    await fields[1].setValue(' updated@example.test ')
    await page.findAll('.settings-card')[0].trigger('submit')
    await flushPromises()

    expect(userApi.updateProfile).toHaveBeenCalledWith({ name: 'Ayu Updated', email: 'updated@example.test' })
    expect(useAuthStore().user).toMatchObject({ name: 'Ayu Updated', email: 'updated@example.test' })
    expect(showSuccessDialog).toHaveBeenCalledWith('Profil berhasil diperbarui.')
    page.unmount()
  })

  it('validates password confirmation and updates the password through the store', async () => {
    userApi.getProfile.mockResolvedValue({ id: 1, name: 'Ayu Buyer', email: 'ayu@example.test' })
    userApi.changePassword.mockResolvedValue({ status: 'success' })
    const page = mountPage(ProfilePage)
    await flushPromises()
    const passwordInputs = page.findAll('input[type="password"]')
    await passwordInputs[0].setValue('old-secret')
    await passwordInputs[1].setValue('new-secret')
    await passwordInputs[2].setValue('different')
    await page.findAll('.settings-card')[1].trigger('submit')
    await flushPromises()
    expect(showErrorDialog).toHaveBeenCalledWith(expect.stringContaining('konfirmasinya harus cocok'))
    expect(userApi.changePassword).not.toHaveBeenCalled()

    await passwordInputs[2].setValue('new-secret')
    await page.findAll('.settings-card')[1].trigger('submit')
    await flushPromises()
    expect(userApi.changePassword).toHaveBeenCalledWith({
      password: 'old-secret',
      new_password: 'new-secret',
      new_password_confirmation: 'new-secret',
    })
    expect(showSuccessDialog).toHaveBeenCalledWith('Kata sandi berhasil diperbarui.')
    page.unmount()
  })

  it('synchronizes an updated profile photo into the persisted auth user', async () => {
    userApi.getProfile.mockResolvedValue({ id: 1, name: 'Ayu Buyer', email: 'ayu@example.test' })
    userApi.updatePhoto.mockResolvedValue({ status: 'success' })
    userApi.getProfile.mockResolvedValueOnce({
      id: 1, name: 'Ayu Buyer', email: 'ayu@example.test',
    }).mockResolvedValueOnce({
      id: 1, name: 'Ayu Buyer', email: 'ayu@example.test', photo: '/users/1/photo.png',
    })
    const page = mountPage(ProfilePage)
    await flushPromises()
    const photo = new File(['avatar'], 'profile.png', { type: 'image/png' })
    const input = page.get('input[aria-label="Unggah foto profil"]')
    Object.defineProperty(input.element, 'files', { configurable: true, value: [photo] })
    await input.trigger('change')
    await flushPromises()

    expect(userApi.updatePhoto).toHaveBeenCalledWith(photo)
    expect(useAuthStore().user).toMatchObject({ photo: '/users/1/photo.png' })
    expect(page.get('.profile-avatar img').attributes('src')).toBe('asset:/users/1/photo.png')
    expect(showSuccessDialog).toHaveBeenCalledWith('Foto profil berhasil diperbarui.')
    page.unmount()
  })
})
