import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, putAccessToken } from '../helpers/apiHelper'
import { aucationApi } from './aucations/api/aucationApi'
import { authApi } from './auth/api/authApi'
import { userApi } from './users/api/userApi'

const apiOrigin = 'https://open-api.delcom.org/api/v1'
const email = import.meta.env.DELCOM_TEST_EMAIL || process.env.DELCOM_TEST_EMAIL
const password = import.meta.env.DELCOM_TEST_PASSWORD || process.env.DELCOM_TEST_PASSWORD

describe('Delcom API integration', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    putAccessToken('')
  })

  it('sends each application API call to the documented route and serializes request payloads', async () => {
    const requests = []
    vi.stubGlobal('fetch', vi.fn(async (url, options) => {
      requests.push({ url: new URL(url), options })
      return new Response(JSON.stringify({ status: 'success', data: { users: [], user: { id: 1 }, aucations: [], aucation: { id: 3 } } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }))

    await authApi.login({ email: 'buyer@example.com', password: 'secret' })
    await authApi.register({ name: 'Buyer', email: 'buyer@example.com', password: 'secret' })
    await authApi.logout()
    await userApi.getUsers()
    await userApi.getProfile()
    await userApi.updateProfile({ name: 'Buyer', email: 'buyer@example.com' })
    await userApi.updatePhoto(new File(['photo'], 'avatar.png', { type: 'image/png' }))
    await userApi.changePassword({ password: 'old', new_password: 'new', new_password_confirmation: 'new' })
    await aucationApi.getAll({ is_me: 1, is_closed: 0 })
    await aucationApi.getById(3)
    await aucationApi.add({ title: 'Camera', description: 'Film camera', start_bid: 10, closed_at: '2026-12-01 12:00:00' })
    await aucationApi.update(3, { title: 'Camera', description: 'Updated', start_bid: 10, closed_at: '2026-12-01 12:00:00' })
    await aucationApi.uploadCover(3, new File(['cover'], 'cover.png', { type: 'image/png' }))
    await aucationApi.addBid(3, 15)
    await aucationApi.deleteBid(3)
    await aucationApi.delete(3)
    await aucationApi.deleteAll()

    expect(requests.map(({ url }) => `${url.pathname}${url.search}`)).toEqual([
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/logout',
      '/api/v1/users',
      '/api/v1/users/me',
      '/api/v1/users/me',
      '/api/v1/users/me/photo',
      '/api/v1/users/password',
      '/api/v1/aucations?is_me=1&is_closed=0',
      '/api/v1/aucations/3',
      '/api/v1/aucations',
      '/api/v1/aucations/3',
      '/api/v1/aucations/3/cover',
      '/api/v1/aucations/3/bids',
      '/api/v1/aucations/3/bids',
      '/api/v1/aucations/3',
      '/api/v1/aucations',
    ])

    const passwordRequest = requests[7].options
    expect(passwordRequest.method).toBe('PUT')
    expect(JSON.parse(passwordRequest.body)).toEqual({
      password: 'old',
      new_password: 'new',
      new_password_confirmation: 'new',
    })
    expect(requests[8].url.searchParams.get('is_me')).toBe('1')
    expect(requests[8].url.searchParams.get('is_closed')).toBe('0')
    expect(requests[11].options.method).toBe('PUT')
    expect(requests[12].options.body.get('cover').name).toBe('cover.png')
  })

  it('integrates with the live Delcom API and validates current endpoint routes', async () => {
    const auctionsResponse = await fetch(`${apiOrigin}/aucations`, { headers: { Accept: 'application/json' } })
    expect(auctionsResponse.status).toBe(401)
    await expect(auctionsResponse.json()).resolves.toMatchObject({
      status: 'fail',
      message: 'Belum melakukan autentikasi',
    })

    const documentedPasswordResponse = await fetch(`${apiOrigin}/users/password`, {
      method: 'PUT',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(documentedPasswordResponse.status).toBe(401)
    await expect(documentedPasswordResponse.json()).resolves.toMatchObject({
      status: 'fail',
      message: 'Belum melakukan autentikasi',
    })

    const obsoletePasswordResponse = await fetch(`${apiOrigin}/users/me/password`, {
      method: 'PUT',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(obsoletePasswordResponse.status).toBe(404)
  }, 20_000)

  it.skipIf(!email || !password)(
    'live authenticated read-only integration covers login, profile, users, and auctions',
    async () => {
      const session = await authApi.login({ email, password })
      putAccessToken(session.token)
      try {
        expect(session.user).toMatchObject({ email })
        const [profile, users, auctions] = await Promise.all([
          userApi.getProfile(),
          userApi.getUsers(),
          aucationApi.getAll(),
        ])
        expect(profile).toMatchObject({ id: session.user.id })
        expect(users).toEqual(expect.arrayContaining([expect.objectContaining({ id: session.user.id })]))
        expect(Array.isArray(auctions)).toBe(true)
        if (auctions[0]?.id) {
          await expect(aucationApi.getById(auctions[0].id)).resolves.toMatchObject({ id: auctions[0].id })
        }
      } finally {
        try {
          await authApi.logout()
        } finally {
          putAccessToken('')
        }
      }
    },
    30_000,
  )

  it('preserves HTTP error context through the API boundary', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ status: 'fail', message: 'Unauthenticated.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )))
    await expect(apiRequest('/users')).rejects.toMatchObject({
      message: 'Unauthenticated.',
      status: 401,
    })
  })
})
