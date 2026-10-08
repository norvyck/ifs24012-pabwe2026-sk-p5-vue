import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthLayout from './AuthLayout.vue'

describe('AuthLayout', () => {
  it('renders the authentication story and nested page content', () => {
    const page = mount(AuthLayout, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          RouterView: { template: '<form data-test="auth-page">Sign in</form>' },
        },
      },
    })

    expect(page.get('h1').text()).toContain('Temukan sesuatu yang istimewa')
    expect(page.get('[data-test="auth-page"]').exists()).toBe(true)
    expect(page.text()).toContain('BIDLY MARKETPLACE')
    expect(page.findAll('.auth-story__stats > div')).toHaveLength(3)
  })
})
