import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { aucationApi } from '../api/aucationApi'
import { useAucationsStore } from '../states/aucationsStore'
import { useAuthStore } from '../../auth/states/authStore'
import { showConfirmDialog, showErrorDialog, showSuccessDialog } from '../../../helpers/toolsHelper'
import HomePage from './HomePage.vue'

vi.mock('../api/aucationApi', () => ({
  aucationApi: {
    getAll: vi.fn(), getById: vi.fn(), add: vi.fn(), update: vi.fn(),
    uploadCover: vi.fn(), delete: vi.fn(), addBid: vi.fn(), deleteBid: vi.fn(), deleteAll: vi.fn(),
  },
}))

vi.mock('../modals/AucationFormModal.vue', () => ({
  default: {
    name: 'AucationFormModal',
    props: ['open'],
    emits: ['close', 'saved'],
    template: '<div v-if="open" data-test="auction-modal"><button data-test="save" @click="$emit(\'saved\')">save</button><button data-test="close" @click="$emit(\'close\')">close</button></div>',
  },
}))

vi.mock('../../../helpers/toolsHelper', () => ({
  formatRupiah: vi.fn((value) => `Rp ${value}`),
  showConfirmDialog: vi.fn(),
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}))

const auctionList = [
  { id: 1, title: 'Kamera Analog', description: 'Film classic', start_bid: 100, closed_at: '2999-01-01 12:00:00', bids: [{ bid: 130 }] },
  { id: 2, title: 'Kursi Rotan', description: 'Natural handmade', start_bid: 200, closed_at: '2000-01-01 12:00:00' },
]

function mountPage() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(HomePage, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  })
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
    localStorage.clear()
    aucationApi.getAll.mockResolvedValue(auctionList)
    aucationApi.deleteAll.mockResolvedValue({ status: 'success' })
    showConfirmDialog.mockResolvedValue({ isConfirmed: true })
    showSuccessDialog.mockResolvedValue({})
    showErrorDialog.mockResolvedValue({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads and presents auction cards and calculated summary statistics', async () => {
    const page = mountPage()
    useAuthStore().user = { name: 'Ayu Buyer' }
    await flushPromises()

    expect(aucationApi.getAll).toHaveBeenCalledWith({})
    expect(page.text()).toContain('Temukan')
    expect(page.text()).toContain('Kamera Analog')
    expect(page.text()).toContain('Kursi Rotan')
    expect(page.text()).toContain('Lelang ditemukan')
    expect(page.text()).toContain('Ayu Buyer')
    expect(page.text()).toContain('Rp 2')
    page.unmount()
  })

  it.each([
    ['Lelang saya', { is_me: 1 }],
    ['Berlangsung', { is_closed: 1 }],
    ['Berakhir', { is_closed: 0 }],
    ['Semua lelang', {}],
  ])('applies the %s server filter', async (label, query) => {
    const page = mountPage()
    await flushPromises()
    await page.findAll('[role="tab"]').find((tab) => tab.text() === label).trigger('click')
    await flushPromises()
    expect(aucationApi.getAll).toHaveBeenLastCalledWith(query)
    page.unmount()
  })

  it('filters titles and descriptions locally and shows the no-match message', async () => {
    const page = mountPage()
    await flushPromises()
    await page.get('input[aria-label="Cari barang lelang"]').setValue('HANDMADE')
    expect(page.text()).toContain('Kursi Rotan')
    expect(page.text()).not.toContain('Kamera Analog')
    await page.get('input[aria-label="Cari barang lelang"]').setValue('unlisted item')
    expect(page.text()).toContain('Tidak ada hasil yang cocok.')
    page.unmount()
  })

  it('shows loading, empty, error, and retry states', async () => {
    let resolveRequest
    aucationApi.getAll.mockImplementationOnce(() => new Promise((resolve) => { resolveRequest = resolve }))
    const loadingPage = mountPage()
    await nextTick()
    expect(loadingPage.findAll('.auction-skeleton')).toHaveLength(6)
    resolveRequest([])
    await flushPromises()
    expect(loadingPage.text()).toContain('Belum ada lelang')
    expect(loadingPage.text()).toContain('Buat lelang pertama')
    loadingPage.unmount()

    aucationApi.getAll.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce([])
    const errorPage = mountPage()
    await flushPromises()
    expect(errorPage.text()).toContain('Offline')
    await errorPage.get('.state-card button').trigger('click')
    await flushPromises()
    expect(aucationApi.getAll).toHaveBeenLastCalledWith({})
    expect(errorPage.text()).toContain('Belum ada lelang')
    errorPage.unmount()
  })

  it('distinguishes an empty personal list and a filtered search with no results', async () => {
    aucationApi.getAll.mockResolvedValue([])
    const page = mountPage()
    await flushPromises()
    await page.findAll('[role="tab"]').find((tab) => tab.text() === 'Lelang saya').trigger('click')
    await flushPromises()
    expect(page.text()).toContain('Lelangmu dimulai di sini.')
    await page.get('input[aria-label="Cari barang lelang"]').setValue('none')
    expect(page.text()).toContain('Tidak ada hasil yang cocok.')
    page.unmount()
  })

  it('opens, closes and refreshes after creating an auction', async () => {
    const page = mountPage()
    await flushPromises()
    await page.findAll('button').find((button) => button.text().includes('Buat lelang')).trigger('click')
    expect(page.find('[data-test="auction-modal"]').exists()).toBe(true)
    await page.get('[data-test="close"]').trigger('click')
    expect(page.find('[data-test="auction-modal"]').exists()).toBe(false)

    await page.findAll('button').find((button) => button.text().includes('Mulai lelang')).trigger('click')
    await page.get('[data-test="save"]').trigger('click')
    await flushPromises()
    expect(aucationApi.getAll).toHaveBeenCalledTimes(2)
    expect(showSuccessDialog).toHaveBeenCalledWith('Lelangmu berhasil diterbitkan!')
    page.unmount()
  })

  it('deletes all personal auctions only after confirmation', async () => {
    const page = mountPage()
    await flushPromises()
    await page.findAll('[role="tab"]').find((tab) => tab.text() === 'Lelang saya').trigger('click')
    await flushPromises()
    await page.get('.button--danger-ghost').trigger('click')
    expect(showConfirmDialog).toHaveBeenCalled()
    expect(aucationApi.deleteAll).toHaveBeenCalledOnce()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await flushPromises()
    expect(showSuccessDialog).toHaveBeenCalledWith('Semua lelang berhasil dihapus.')
    page.unmount()
  })

  it('honors deletion cancellation and reports deletion failures', async () => {
    const page = mountPage()
    await flushPromises()
    await page.findAll('[role="tab"]').find((tab) => tab.text() === 'Lelang saya').trigger('click')
    await flushPromises()
    showConfirmDialog.mockResolvedValueOnce({ isConfirmed: false })
    await page.get('.button--danger-ghost').trigger('click')
    expect(aucationApi.deleteAll).not.toHaveBeenCalled()

    aucationApi.deleteAll.mockRejectedValueOnce(new Error('Delete failed'))
    await page.get('.button--danger-ghost').trigger('click')
    await flushPromises()
    expect(showErrorDialog).toHaveBeenCalledWith(expect.objectContaining({ message: 'Delete failed' }))
    page.unmount()
  })

  it('scrolls to the top from the result footer', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const page = mountPage()
    await flushPromises()
    await page.get('.section-footer button').trigger('click')
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    page.unmount()
  })
})
