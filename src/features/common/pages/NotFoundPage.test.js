import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NotFoundPage from './NotFoundPage.vue'

describe('NotFoundPage', () => {
  it('explains the missing page and links back to the home route', () => {
    const page = mount(NotFoundPage, {
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :data-route="to.name"><slot /></a>',
          },
        },
      },
    })

    expect(page.get('h1').text()).toBe('Halaman ini tidak ditemukan.')
    expect(page.get('a[data-route="home"]').text()).toContain('Kembali ke beranda')
  })
})
