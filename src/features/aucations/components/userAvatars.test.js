import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '../../auth/states/authStore'
import { resolveAssetUrl } from '../../../helpers/toolsHelper'
import NavbarComponent from './NavbarComponent.vue'
import SidebarComponent from './SidebarComponent.vue'

vi.mock('../../../helpers/toolsHelper', () => ({
  resolveAssetUrl: vi.fn((value) => `asset:${value}`),
}))

describe('shared user avatars', () => {
  it('updates the sidebar and topbar photo reactively from the auth store', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/home', name: 'home', component: { template: '<div />' } },
        { path: '/users', name: 'users', component: { template: '<div />' } },
        { path: '/profile', name: 'profile', component: { template: '<div />' } },
      ],
    })
    await router.push('/profile')
    await router.isReady()

    const page = mount({
      components: { NavbarComponent, SidebarComponent },
      template: '<><SidebarComponent /><NavbarComponent /></>',
    }, {
      global: { plugins: [pinia, router] },
    })
    const auth = useAuthStore()
    auth.updateUser({ name: 'Jose Simon H. Purba', email: 'jose@example.test' })
    await flushPromises()

    expect(page.get('.sidebar-bottom__avatar').text()).toBe('JS')
    expect(page.find('.topbar-avatar img').exists()).toBe(false)

    auth.updateUser({ ...auth.user, photo: '/users/jose/photo.png' })
    await flushPromises()
    expect(page.get('.sidebar-bottom__avatar img').attributes('src')).toBe('asset:/users/jose/photo.png')
    expect(page.get('.topbar-avatar img').attributes('src')).toBe('asset:/users/jose/photo.png')
    expect(resolveAssetUrl).toHaveBeenCalledWith('/users/jose/photo.png')

    auth.updateUser({ ...auth.user, photo: '' })
    await flushPromises()
    expect(page.find('.sidebar-bottom__avatar img').exists()).toBe(false)
    expect(page.get('.sidebar-bottom__avatar').text()).toBe('JS')
    page.unmount()
  })
})
