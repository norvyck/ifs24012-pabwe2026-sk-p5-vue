import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { aucationApi } from '../api/aucationApi'
import { useAuthStore } from '../../auth/states/authStore'
import {
  formatDate, formatRupiah, resolveAssetUrl, showConfirmDialog, showErrorDialog, showSuccessDialog,
} from '../../../helpers/toolsHelper'
import DetailPage from './DetailPage.vue'

const { route, push, replace } = vi.hoisted(() => ({
  route: { params: { aucationId: '17' } },
  push: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push, replace }),
}))
vi.mock('../api/aucationApi', () => ({
  aucationApi: {
    getAll: vi.fn(), getById: vi.fn(), add: vi.fn(), update: vi.fn(),
    uploadCover: vi.fn(), delete: vi.fn(), addBid: vi.fn(), deleteBid: vi.fn(), deleteAll: vi.fn(),
  },
}))
vi.mock('../../../helpers/toolsHelper', () => ({
  formatDate: vi.fn((value) => `date:${value}`),
  formatRupiah: vi.fn((value) => `Rp ${value}`),
  resolveAssetUrl: vi.fn((value) => `asset:${value}`),
  showConfirmDialog: vi.fn(),
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}))

function mountPage() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(DetailPage, {
    global: {
      plugins: [pinia],
      stubs: {
        MarkdownViewer: true,
        AucationFormModal: { props: ['open'], template: '<div v-if="open" data-test="edit-modal" />' },
        BidModal: { props: ['open'], template: '<div v-if="open" data-test="bid-modal" />' },
      },
    },
  })
}

describe('auction detail page', () => {
  const auction = {
    id: 17,
    user_id: 4,
    title: 'Kamera klasik',
    description: 'Deskripsi',
    start_bid: 500,
    cover: '/camera.png',
    closed_at: '2999-12-01 12:00:00',
    author: { name: 'Ayu' },
    bids: [
      { id: 2, bid: 900, author: { name: 'Bima' }, created_at: '2026-10-01' },
      { id: 1, bid: 700, user: { name: 'Citra' } },
    ],
  }

  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
    route.params.aucationId = '17'
    aucationApi.getById.mockResolvedValue(auction)
    aucationApi.delete.mockResolvedValue({ status: 'success' })
    showConfirmDialog.mockResolvedValue({ isConfirmed: true })
    showErrorDialog.mockResolvedValue({})
    showSuccessDialog.mockResolvedValue({})
  })

  afterEach(() => vi.restoreAllMocks())

  it('loads and displays the auction, seller, and highest-first bid history', async () => {
    const page = mountPage()
    await flushPromises()

    expect(aucationApi.getById).toHaveBeenCalledWith('17')
    expect(page.get('h1').text()).toBe('Kamera klasik')
    expect(page.get('.detail-image img').attributes('src')).toBe('asset:/camera.png')
    expect(page.text()).toContain('Rp 900')
    expect(page.text().indexOf('Bima')).toBeLessThan(page.text().indexOf('Citra'))
    expect(formatDate).toHaveBeenCalled()
    expect(formatRupiah).toHaveBeenCalledWith(900)
    expect(resolveAssetUrl).toHaveBeenCalledWith('/camera.png')
    await page.get('.button--primary').trigger('click')
    expect(page.find('[data-test="bid-modal"]').exists()).toBe(true)
    page.unmount()
  })

  it('shows an actionable retry state when an auction cannot be loaded', async () => {
    aucationApi.getById.mockRejectedValueOnce(new Error('Auction unavailable'))
    const page = mountPage()
    await flushPromises()
    expect(page.text()).toContain('Auction unavailable')
    await page.get('.state-card button').trigger('click')
    await flushPromises()
    expect(aucationApi.getById).toHaveBeenCalledTimes(2)
    expect(page.text()).toContain('Kamera klasik')
    page.unmount()
  })

  it('allows an owner to open edit actions and delete the auction', async () => {
    const page = mountPage()
    useAuthStore().user = { id: 4, name: 'Ayu' }
    await flushPromises()
    expect(page.find('.detail-owner-actions').exists()).toBe(true)
    await page.get('[title="Ubah lelang"]').trigger('click')
    expect(page.find('[data-test="edit-modal"]').exists()).toBe(true)
    await page.get('[title="Hapus lelang"]').trigger('click')
    await flushPromises()

    expect(showConfirmDialog).toHaveBeenCalled()
    expect(aucationApi.delete).toHaveBeenCalledWith(17)
    expect(showSuccessDialog).toHaveBeenCalledWith('Lelang berhasil dihapus.')
    expect(replace).toHaveBeenCalledWith({ name: 'home' })
    page.unmount()
  })
})
