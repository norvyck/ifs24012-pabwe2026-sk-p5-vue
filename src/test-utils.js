import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

export function createMockPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

export function renderWithProviders(component, options = {}) {
  const pinia = options.pinia || createMockPinia()
  const router = options.router || createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  })

  return mount(component, {
    ...options,
    global: {
      ...options.global,
      plugins: [pinia, router, ...(options.global?.plugins || [])],
    },
  })
}
