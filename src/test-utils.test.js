import { describe, expect, it } from 'vitest'
import { createMockPinia, renderWithProviders } from './test-utils'

describe('test utilities', () => {
  it('creates and activates a Pinia instance', () => {
    const pinia = createMockPinia()
    expect(pinia).toBeDefined()
  })

  it('renders components with Pinia and a memory router by default', () => {
    const page = renderWithProviders({
      template: '<div>Ready</div>',
    })
    expect(page.text()).toBe('Ready')
  })

  it('accepts caller-provided Pinia, router, and mount options', () => {
    const pinia = createMockPinia()
    const router = {
      install() {},
    }
    const page = renderWithProviders({
      template: '<button class="custom">Custom</button>',
    }, {
      pinia,
      router,
      attrs: { 'data-test': 'provider-mounted' },
    })

    expect(page.get('button.custom').text()).toBe('Custom')
    expect(page.attributes('data-test')).toBe('provider-mounted')
  })
})
