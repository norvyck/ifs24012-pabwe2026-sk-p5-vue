import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { authApi } from '../api/authApi'
import { useAuthStore } from '../states/authStore'
import { showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'
import LoginPage from './LoginPage.vue'
import RegisterPage from './RegisterPage.vue'

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }))

vi.mock('vue-router', () => ({ useRouter: () => ({ replace }) }))
vi.mock('../api/authApi', () => ({
  authApi: { login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}))
vi.mock('../../../helpers/toolsHelper', () => ({
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}))

function mountPage(component) {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(component, {
    global: {
      plugins: [pinia],
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  })
}

describe('authentication pages', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
    localStorage.clear()
    showErrorDialog.mockResolvedValue({})
    showSuccessDialog.mockResolvedValue({})
  })

  afterEach(() => vi.restoreAllMocks())

  it('requires both login fields before calling the API', async () => {
    const page = mountPage(LoginPage)
    await page.get('form').trigger('submit')
    expect(page.get('[role="alert"]').text()).toContain('Masukkan email')
    expect(authApi.login).not.toHaveBeenCalled()
    page.unmount()
  })

  it('logs in, stores the session, and navigates home', async () => {
    authApi.login.mockResolvedValue({ token: 'test-token', user: { id: 2, name: 'Ayu' } })
    const page = mountPage(LoginPage)
    await page.get('input[autocomplete="email"]').setValue(' ayu@example.test ')
    await page.get('input[autocomplete="current-password"]').setValue('secret1')
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(authApi.login).toHaveBeenCalledWith({ email: 'ayu@example.test', password: 'secret1' })
    expect(useAuthStore().isAuthenticated).toBe(true)
    expect(JSON.parse(localStorage.getItem('bidly_user'))).toEqual({ id: 2, name: 'Ayu' })
    expect(showSuccessDialog).toHaveBeenCalledWith('Selamat datang di Bidly!')
    expect(replace).toHaveBeenCalledWith({ name: 'home' })
    page.unmount()
  })

  it('shows login errors and allows toggling password visibility', async () => {
    authApi.login.mockRejectedValue(new Error('Akun tidak ditemukan'))
    const page = mountPage(LoginPage)
    const password = page.get('input[autocomplete="current-password"]')
    await page.get('input[autocomplete="email"]').setValue('ayu@example.test')
    await password.setValue('secret1')
    await page.get('button[aria-label="Tampilkan kata sandi"]').trigger('click')
    expect(password.attributes('type')).toBe('text')
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(page.get('[role="alert"]').text()).toContain('Akun tidak ditemukan')
    expect(showErrorDialog).toHaveBeenCalledWith(expect.objectContaining({ message: 'Akun tidak ditemukan' }), 'Gagal masuk')
    page.unmount()
  })

  it('rejects short or mismatched registration passwords without an API call', async () => {
    const page = mountPage(RegisterPage)
    await page.get('input[autocomplete="new-password"]').setValue('short')
    await page.get('form').trigger('submit')
    expect(page.get('[role="alert"]').text()).toContain('minimal')
    expect(authApi.register).not.toHaveBeenCalled()

    await page.get('input[autocomplete="new-password"]').setValue('secret1')
    await page.get('input[autocomplete="new-password"]:last-of-type').setValue('different')
    await page.get('form').trigger('submit')
    expect(page.get('[role="alert"]').text()).toContain('belum cocok')
    expect(authApi.register).not.toHaveBeenCalled()
    page.unmount()
  })

  it('registers a new user and navigates to login', async () => {
    authApi.register.mockResolvedValue({ status: 'success' })
    const page = mountPage(RegisterPage)
    await page.get('input[autocomplete="name"]').setValue(' Ayu Buyer ')
    await page.get('input[autocomplete="email"]').setValue(' ayu@example.test ')
    const passwordFields = page.findAll('input[autocomplete="new-password"]')
    await passwordFields[0].setValue('secret1')
    await passwordFields[1].setValue('secret1')
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Ayu Buyer',
      email: 'ayu@example.test',
      password: 'secret1',
    })
    expect(showSuccessDialog).toHaveBeenCalledWith('Akun berhasil dibuat', 'Silakan masuk menggunakan akun barumu.')
    expect(replace).toHaveBeenCalledWith({ name: 'login' })
    page.unmount()
  })
})
