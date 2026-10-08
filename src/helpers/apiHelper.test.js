import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, getAccessToken, putAccessToken } from './apiHelper'

describe('apiHelper', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stores and removes the access token', () => {
    putAccessToken('sample-token')
    expect(getAccessToken()).toBe('sample-token')
    putAccessToken('')
    expect(getAccessToken()).toBe('')
  })

  it('adds authentication, query parameters, and JSON body to requests', async () => {
    putAccessToken('sample-token')
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ status: 'success' }) })

    await apiRequest('/aucations', { method: 'POST', query: { is_me: 1, ignored: '' }, body: { title: 'Lamp' } })

    const [url, options] = fetch.mock.calls[0]
    expect(url.searchParams.get('is_me')).toBe('1')
    expect(url.searchParams.has('ignored')).toBe(false)
    expect(options.headers.get('Authorization')).toBe('Bearer sample-token')
    expect(options.headers.get('Content-Type')).toBe('application/json')
    expect(options.body).toBe(JSON.stringify({ title: 'Lamp' }))
  })

  it('throws the API message for unsuccessful responses', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ status: 'fail', message: 'Data tidak valid', data: { title: ['wajib'] } }),
    })

    await expect(apiRequest('/aucations')).rejects.toMatchObject({
      message: 'Data tidak valid',
      status: 422,
      data: { title: ['wajib'] },
    })
  })

  it('returns null for an empty no-content response', async () => {
    fetch.mockResolvedValue({ ok: true, status: 204 })
    await expect(apiRequest('/auth/logout')).resolves.toBeNull()
  })

  it('omits the authorization header when no token exists and accepts relative paths', async () => {
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ status: 'success' }) })
    await apiRequest('users')
    const [url, options] = fetch.mock.calls[0]
    expect(url.pathname).toBe('/api/v1/users')
    expect(options.headers.has('Authorization')).toBe(false)
    expect(options.body).toBeUndefined()
    expect(options.headers.has('Content-Type')).toBe(false)
  })

  it('sends multipart requests without overriding the generated content type', async () => {
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ status: 'success' }) })
    const body = new FormData()
    body.append('cover', new File(['cover'], 'cover.png', { type: 'image/png' }))
    await apiRequest('/aucations/2/cover', { method: 'POST', body })
    const [, options] = fetch.mock.calls[0]
    expect(options.body).toBe(body)
    expect(options.headers.has('Content-Type')).toBe(false)
  })

  it('omits null query parameters and surfaces failure status without a message', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'fail' }),
    })
    await expect(apiRequest('/users', { query: { is_me: null, is_closed: 0 } }))
      .rejects.toMatchObject({ message: 'Permintaan gagal (200)', status: 200 })
    const [url] = fetch.mock.calls[0]
    expect(url.searchParams.has('is_me')).toBe(false)
    expect(url.searchParams.get('is_closed')).toBe('0')
  })

  it('surfaces malformed JSON rather than masking the server response', async () => {
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => { throw new SyntaxError('Invalid JSON') } })
    await expect(apiRequest('/aucations')).rejects.toThrow('Invalid JSON')
  })
})
