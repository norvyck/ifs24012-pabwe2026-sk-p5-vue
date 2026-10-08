import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../../helpers/apiHelper'
import { authApi } from './authApi'

vi.mock('../../../helpers/apiHelper', () => ({ apiRequest: vi.fn() }))

describe('authApi', () => {
  afterEach(() => vi.clearAllMocks())

  it('returns the login data from the documented endpoint', async () => {
    const data = { token: 'session-token', user: { id: 5 } }
    apiRequest.mockResolvedValue({ data })
    await expect(authApi.login({ email: 'buyer@example.com', password: 'secret' })).resolves.toBe(data)
    expect(apiRequest).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { email: 'buyer@example.com', password: 'secret' },
    })
  })

  it('registers and logs out through the Delcom auth endpoints', async () => {
    apiRequest.mockResolvedValue({ status: 'success' })
    const details = { name: 'Buyer', email: 'buyer@example.com', password: 'secret' }
    await authApi.register(details)
    await authApi.logout()
    expect(apiRequest).toHaveBeenNthCalledWith(1, '/auth/register', { method: 'POST', body: details })
    expect(apiRequest).toHaveBeenNthCalledWith(2, '/auth/logout', { method: 'POST' })
  })
})
