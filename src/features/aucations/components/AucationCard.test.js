import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AucationCard from './AucationCard.vue'

function mountCard(item) {
  return mount(AucationCard, {
    props: { item },
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="to.params.aucationId"><slot /></a>',
        },
      },
    },
  })
}

describe('AucationCard', () => {
  afterEach(() => vi.useRealTimers())

  it('shows cover, seller, highest bid, count, and remaining time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-08T00:00:00'))
    const page = mountCard({
      id: 17,
      title: 'Analog camera',
      cover: 'https://images.example.com/camera.jpg',
      closed_at: '2026-10-09 01:00:00',
      start_bid: 500000,
      author: { name: 'Ayu' },
      bids: [{ bid: 700000 }, { bid: 600000 }],
    })
    expect(page.attributes('href')).toBe('17')
    expect(page.find('img').attributes('src')).toBe('https://images.example.com/camera.jpg')
    expect(page.text()).toContain('Ayu')
    expect(page.text()).toContain('Rp 700.000')
    expect(page.text()).toContain('1 hari lagi')
    expect(page.text()).toContain('2')
    page.unmount()
  })

  it('uses the start price when listing data has bid IDs instead of bid amounts', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-08T00:00:00'))
    const page = mountCard({
      id: 8,
      title: 'Vintage chair',
      start_bid: 100000,
      closed_at: '2026-10-08 00:00:00',
      bids: [4, 5],
    })
    expect(page.text()).toContain('Rp 100.000')
    expect(page.text()).toContain('Berakhir')
    expect(page.text()).toContain('Lelang selesai')
    expect(page.text()).toContain('2')
    page.unmount()
  })

  it('shows placeholder content and advances the countdown timer', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-08T00:00:00'))
    const page = mountCard({ id: 1, title: 'Desk lamp', start_bid: 50, closed_at: '2026-10-08 00:01:00' })
    expect(page.find('.auction-card__placeholder').exists()).toBe(true)
    expect(page.text()).toContain('Komunitas Bidly')
    expect(page.text()).toContain('1 menit lagi')
    vi.advanceTimersByTime(60_000)
    await nextTick()
    expect(page.text()).toContain('Lelang selesai')
    page.unmount()

    const invalidDate = mountCard({ id: 2, title: 'No time', start_bid: 50, closed_at: 'invalid' })
    expect(invalidDate.text()).toContain('Waktu belum tersedia')
    expect(invalidDate.text()).toContain('Rp 50')
    invalidDate.unmount()
  })
})
