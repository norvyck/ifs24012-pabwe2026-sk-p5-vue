import { afterEach, describe, expect, it, vi } from 'vitest'

const { fireMock } = vi.hoisted(() => ({ fireMock: vi.fn().mockResolvedValue({ isConfirmed: true }) }))

vi.mock('sweetalert2', () => ({
  default: {
    mixin: vi.fn(() => ({ fire: fireMock })),
  },
}))

import Swal from 'sweetalert2'
import { formatDate, formatRupiah, resolveAssetUrl, showConfirmDialog, showErrorDialog, showSuccessDialog } from './toolsHelper'

describe('toolsHelper', () => {
  it('formats Indonesian Rupiah without fractional digits', () => {
    expect(formatRupiah(250000)).toContain('250.000')
    expect(formatRupiah('not-a-number')).toContain('0')
  })

  it('formats valid dates and handles empty or invalid values', () => {
    expect(formatDate('2026-12-31 23:59:59')).toContain('31')
    expect(formatDate('')).toBe('—')
    expect(formatDate('not-a-date')).toBe('—')
  })

  it('normalizes local and relative image paths and preserves absolute URLs', () => {
    expect(resolveAssetUrl('http://127.0.0.1:8000/img/photo.jpg')).toContain('https://open-api.delcom.org/img/photo.jpg')
    expect(resolveAssetUrl('/img/photo.jpg')).toContain('https://open-api.delcom.org/img/photo.jpg')
    expect(resolveAssetUrl('https://cdn.example.com/photo.jpg')).toBe('https://cdn.example.com/photo.jpg')
    expect(resolveAssetUrl('')).toBe('')
  })

  it('opens success, error, and confirmation dialogs with the supplied messages', async () => {
    await showSuccessDialog('Saved', 'It is ready')
    await showErrorDialog(new Error('Network down'), 'Unavailable')
    await showErrorDialog('Bad input')
    await showErrorDialog(null)
    await showConfirmDialog('Delete item', 'Cannot be undone', 'Delete')
    expect(fireMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
      icon: 'success', title: 'Saved', text: 'It is ready', confirmButtonText: 'Mengerti',
    }))
    expect(fireMock).toHaveBeenNthCalledWith(2, expect.objectContaining({
      icon: 'error', title: 'Unavailable', text: 'Network down',
    }))
    expect(fireMock).toHaveBeenNthCalledWith(3, expect.objectContaining({ text: 'Bad input' }))
    expect(fireMock).toHaveBeenNthCalledWith(4, expect.objectContaining({ text: 'Silakan coba lagi.' }))
    expect(fireMock).toHaveBeenNthCalledWith(5, expect.objectContaining({
      showCancelButton: true, confirmButtonText: 'Delete', cancelButtonText: 'Batal', reverseButtons: true,
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
    fireMock.mockResolvedValue({ isConfirmed: true })
  })
})
