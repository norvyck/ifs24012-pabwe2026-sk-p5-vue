import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { aucationApi } from '../api/aucationApi'
import { showErrorDialog } from '../../../helpers/toolsHelper'
import AucationFormModal from './AucationFormModal.vue'
import BidModal from './BidModal.vue'

vi.mock('../api/aucationApi', () => ({
  aucationApi: {
    getAll: vi.fn(), getById: vi.fn(), add: vi.fn(), update: vi.fn(),
    uploadCover: vi.fn(), delete: vi.fn(), addBid: vi.fn(), deleteBid: vi.fn(), deleteAll: vi.fn(),
  },
}))
vi.mock('../../../helpers/toolsHelper', () => ({
  formatRupiah: vi.fn((value) => `Rp ${value}`),
  showErrorDialog: vi.fn(),
}))

function mountModal(component, props) {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(component, {
    props,
    global: {
      plugins: [pinia],
      stubs: {
        Teleport: { template: '<div><slot /></div>' },
        MarkdownEditor: {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: '<textarea aria-label="Deskripsi barang" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        },
      },
    },
  })
}

describe('auction modals', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    showErrorDialog.mockResolvedValue({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('validates auction details before sending a request', async () => {
    const page = mountModal(AucationFormModal, { open: true, item: null })
    const openingBid = page.get('input[type="number"]')
    expect(openingBid.attributes('min')).toBe('1000')
    expect(openingBid.attributes('step')).toBe('1000')
    await openingBid.setValue('211000000000')
    expect(openingBid.element.checkValidity()).toBe(true)
    await openingBid.setValue('211000000001')
    expect(openingBid.element.checkValidity()).toBe(false)
    await page.get('form').trigger('submit')
    await flushPromises()
    expect(showErrorDialog).toHaveBeenCalledWith(
      'Lengkapi judul, deskripsi, harga awal, dan waktu penutupan.',
    )
    expect(aucationApi.add).not.toHaveBeenCalled()
    page.unmount()
  })

  it('creates an auction with normalized fields and emits saved', async () => {
    aucationApi.add.mockResolvedValue({ data: { aucation: { id: 7 } } })
    aucationApi.uploadCover.mockResolvedValue({ status: 'success' })
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:cover-preview') })
    const page = mountModal(AucationFormModal, { open: true, item: null })
    await flushPromises()
    await page.get('input[placeholder^="Contoh"]').setValue('  Kamera analog  ')
    await page.get('textarea[aria-label="Deskripsi barang"]').setValue(' Deskripsi kamera ')
    await page.get('input[type="number"]').setValue('25000')
    await page.get('input[type="datetime-local"]').setValue('2026-12-01T12:30')
    const cover = new File(['cover'], 'cover.png', { type: 'image/png' })
    const fileInput = page.get('input[type="file"]')
    Object.defineProperty(fileInput.element, 'files', { configurable: true, value: [cover] })
    await fileInput.trigger('change')
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(aucationApi.add).toHaveBeenCalledWith({
      title: 'Kamera analog',
      description: ' Deskripsi kamera ',
      start_bid: 25000,
      closed_at: '2026-12-01 12:30:00',
    })
    expect(aucationApi.uploadCover).toHaveBeenCalledWith(7, cover)
    expect(page.emitted('saved')).toHaveLength(1)
    page.unmount()
  })

  it('does not silently skip the cover when create response has no auction ID', async () => {
    aucationApi.add.mockResolvedValue({ data: {} })
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:cover-preview') })
    const page = mountModal(AucationFormModal, { open: true, item: null })
    await flushPromises()
    await page.get('input[placeholder^="Contoh"]').setValue('Lampu meja')
    await page.get('textarea[aria-label="Deskripsi barang"]').setValue('Deskripsi')
    await page.get('input[type="number"]').setValue('1000')
    await page.get('input[type="datetime-local"]').setValue('2026-12-01T12:30')
    const fileInput = page.get('input[type="file"]')
    Object.defineProperty(fileInput.element, 'files', {
      configurable: true,
      value: [new File(['cover'], 'cover.png', { type: 'image/png' })],
    })
    await fileInput.trigger('change')
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(aucationApi.uploadCover).not.toHaveBeenCalled()
    expect(page.emitted('saved')).toBeUndefined()
    expect(showErrorDialog).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('foto sampul belum terunggah'),
    }))
    page.unmount()
  })

  it('updates existing auctions and uploads a valid cover image', async () => {
    aucationApi.update.mockResolvedValue({ status: 'success' })
    aucationApi.uploadCover.mockResolvedValue({ status: 'success' })
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:cover-preview') })
    const item = {
      id: 13, title: 'Kamera', description: 'Deskripsi', start_bid: 1000, closed_at: '2026-12-01 12:30:00',
    }
    const page = mountModal(AucationFormModal, { open: true, item })
    await flushPromises()
    expect(page.text()).toContain('Perbarui lelang')
    const cover = new File(['cover'], 'cover.png', { type: 'image/png' })
    const fileInput = page.get('input[type="file"]')
    Object.defineProperty(fileInput.element, 'files', { configurable: true, value: [cover] })
    await fileInput.trigger('change')
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(page.get('.upload-preview').attributes('src')).toBe('blob:cover-preview')
    expect(aucationApi.update).toHaveBeenCalledWith(13, expect.objectContaining({
      title: 'Kamera',
      start_bid: 1000,
      closed_at: '2026-12-01 12:30:00',
    }))
    expect(aucationApi.uploadCover).toHaveBeenCalledWith(13, cover)
    expect(page.emitted('saved')).toHaveLength(1)
    page.unmount()
  })

  it('rejects non-image covers and reports auction request errors', async () => {
    aucationApi.add.mockRejectedValue(new Error('API unavailable'))
    const page = mountModal(AucationFormModal, { open: true, item: null })
    await flushPromises()
    const fileInput = page.get('input[type="file"]')
    Object.defineProperty(fileInput.element, 'files', {
      configurable: true,
      value: [new File(['text'], 'notes.txt', { type: 'text/plain' })],
    })
    await fileInput.trigger('change')
    expect(showErrorDialog).toHaveBeenCalledWith('Pilih berkas gambar dengan format yang valid.')

    await page.get('input[placeholder^="Contoh"]').setValue('Lampu')
    await page.get('textarea[aria-label="Deskripsi barang"]').setValue('Deskripsi')
    await page.get('input[type="number"]').setValue('100')
    await page.get('input[type="datetime-local"]').setValue('2026-12-01T12:30')
    await page.get('form').trigger('submit')
    await flushPromises()
    expect(showErrorDialog).toHaveBeenLastCalledWith(expect.objectContaining({ message: 'API unavailable' }))
    page.unmount()
  })

  it('requires a bid higher than the current highest offer', async () => {
    const page = mountModal(BidModal, {
      open: true,
      item: { id: 8, title: 'Kursi', start_bid: 100, bids: [{ bid: 200 }, { bid: 150 }] },
    })
    expect(page.text()).toContain('Rp 200')
    await page.get('input[type="number"]').setValue('200')
    await page.get('form').trigger('submit')
    await flushPromises()
    expect(showErrorDialog).toHaveBeenCalledWith('Tawaran harus lebih tinggi dari Rp 200.')
    expect(aucationApi.addBid).not.toHaveBeenCalled()
    page.unmount()
  })

  it('submits a higher bid and reports failures', async () => {
    aucationApi.addBid.mockResolvedValueOnce({ status: 'success' }).mockRejectedValueOnce(new Error('Bid failed'))
    const page = mountModal(BidModal, {
      open: true,
      item: { id: 8, title: 'Kursi', start_bid: 100, bids: [{ bid: 200 }] },
    })
    await page.get('input[type="number"]').setValue('250')
    await page.get('form').trigger('submit')
    await flushPromises()
    expect(aucationApi.addBid).toHaveBeenCalledWith(8, 250)
    expect(page.emitted('saved')).toHaveLength(1)

    await page.get('input[type="number"]').setValue('300')
    await page.get('form').trigger('submit')
    await flushPromises()
    expect(showErrorDialog).toHaveBeenCalledWith(expect.objectContaining({ message: 'Bid failed' }))
    page.unmount()
  })
})
