const API_BASE_URL = DELCOM_BASEURL.replace(/\/$/, '')

export function getAccessToken() {
  return localStorage.getItem('bidly_access_token') || ''
}

export function putAccessToken(token) {
  if (token) {
    localStorage.setItem('bidly_access_token', token)
  } else {
    localStorage.removeItem('bidly_access_token')
  }
}

export async function apiRequest(path, { method = 'GET', body, query, headers = {} } = {}) {
  const url = new URL(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`)
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  const requestHeaders = new Headers({ Accept: 'application/json', ...headers })
  const token = getAccessToken()
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`)

  let requestBody = body
  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json')
    requestBody = JSON.stringify(body)
  }

  const response = await fetch(url, { method, headers: requestHeaders, body: requestBody })
  const payload = response.status === 204 ? null : await response.json()

  if (!response.ok || payload?.status === 'fail') {
    const message = payload?.message || `Permintaan gagal (${response.status})`
    const error = new Error(message)
    error.status = response.status
    error.data = payload?.data
    throw error
  }

  return payload
}
