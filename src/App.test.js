import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import App from './App.vue'

describe('App', () => {
  it('renders the active route through Vue Router', () => {
    const page = mount(App, {
      global: {
        stubs: {
          RouterView: { template: '<main data-test="active-route">Current page</main>' },
        },
      },
    })

    expect(page.get('[data-test="active-route"]').text()).toBe('Current page')
  })
})
