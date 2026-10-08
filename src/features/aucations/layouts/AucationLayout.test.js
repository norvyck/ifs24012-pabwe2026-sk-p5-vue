import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { authApi } from '../../auth/api/authApi'
import { useAuthStore } from '../../auth/states/authStore'
import { showConfirmDialog, showErrorDialog } from '../../../helpers/toolsHelper'
import AucationLayout from './AucationLayout.vue'

const { route, replace } = vi.hoisted(() => ({
  route: { name: 'users' },
  replace: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ replace }),
}))
vi.mock('../../auth/api/authApi', () => ({
  authApi: { login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}))
vi.mock('../../../helpers/toolsHelper', () => ({
  showConfirmDialog: vi.fn(),
  showErrorDialog: vi.fn(),
}))

describe('AucationLayout', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    route.name = 'users'
    setActivePinia(createPinia())
    showConfirmDialog.mockResolvedValue({ isConfirmed: true })
  })

  afterEach(() => vi.restoreAllMocks())

  function mountLayout() {
    const pinia = createPinia()
    setActivePinia(pinia)
    return mount(AucationLayout, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterView: { template: '<div data-test="route-content">Page content</div>' },
          RouterLink: {
            props: ['to'],
            template: '<a :data-route="to.name"><slot /></a>',
          },
          SidebarComponent: {
            emits: ['logout'],
            template: '<button data-test="sidebar-logout" @click="$emit(\'logout\')">Logout</button>',
          },
          NavbarComponent: {
            emits: ['logout'],
            template: '<button data-test="navbar-logout" @click="$emit(\'logout\')">Logout</button>',
          },
        },
      },
    })
  }

  it('renders navigation, active route state, and page content', () => {
    const page = mountLayout()
    expect(page.get('[data-test="route-content"]').text()).toBe('Page content')
    expect(page.get('[aria-label="Navigasi mobile"] [data-route="users"]').classes()).toContain('is-active')
    expect(page.findAll('[aria-label="Navigasi mobile"] a')).toHaveLength(3)
    page.unmount()
  })

  it('keeps the session when logout is cancelled', async () => {
    showConfirmDialog.mockResolvedValueOnce({ isConfirmed: false })
    const page = mountLayout()
    useAuthStore().token = 'session-token'
    await page.get('[data-test="sidebar-logout"]').trigger('click')
    await flushPromises()

    expect(authApi.logout).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
    page.unmount()
  })

  it('logs out and navigates to the login route after confirmation', async () => {
    authApi.logout.mockResolvedValue({ status: 'success' })
    const page = mountLayout()
    const auth = useAuthStore()
    auth.token = 'session-token'
    auth.user = { id: 1, name: 'Ayu' }
    await page.get('[data-test="navbar-logout"]').trigger('click')
    await flushPromises()

    expect(authApi.logout).toHaveBeenCalledOnce()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
    expect(replace).toHaveBeenCalledWith({ name: 'login' })
    page.unmount()
  })

  it('shows logout API errors and preserves the session cleanup behavior', async () => {
    authApi.logout.mockRejectedValue(new Error('Logout unavailable'))
    const page = mountLayout()
    useAuthStore().token = 'session-token'
    await page.get('[data-test="sidebar-logout"]').trigger('click')
    await flushPromises()

    expect(showErrorDialog).toHaveBeenCalledWith(expect.objectContaining({ message: 'Logout unavailable' }))
    expect(replace).not.toHaveBeenCalled()
    expect(useAuthStore().isAuthenticated).toBe(false)
    page.unmount()
  })
})
