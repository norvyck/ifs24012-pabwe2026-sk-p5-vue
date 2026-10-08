import Swal from 'sweetalert2'

const dialog = Swal.mixin({
  customClass: {
    popup: 'bidly-alert',
    confirmButton: 'bidly-alert-confirm',
    cancelButton: 'bidly-alert-cancel',
  },
  buttonsStyling: false,
})

export function showSuccessDialog(title, text = '') {
  return dialog.fire({ icon: 'success', title, text, confirmButtonText: 'Mengerti' })
}

export function showErrorDialog(error, title = 'Terjadi kesalahan') {
  const message = typeof error === 'string' ? error : error?.message || 'Silakan coba lagi.'
  return dialog.fire({ icon: 'error', title, text: message, confirmButtonText: 'Tutup' })
}

export function showConfirmDialog(title, text, confirmButtonText = 'Ya, lanjutkan') {
  return dialog.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Batal',
    reverseButtons: true,
  })
}

export function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export function formatDate(value, options = {}) {
  if (!value) return '—'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date)
}

export function resolveAssetUrl(value) {
  if (!value) return ''
  const apiUrl = new URL(DELCOM_BASEURL)
  const normalized = String(value).replace(/^http:\/\/127\.0\.0\.1:8000/, apiUrl.origin)
  return /^https?:\/\//i.test(normalized)
    ? normalized
    : new URL(normalized.replace(/^\//, ''), `${apiUrl.origin}/`).toString()
}
