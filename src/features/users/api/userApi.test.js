import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../../helpers/apiHelper'
import { userApi } from './userApi'

vi.mock('../../../helpers/apiHelper', () => ({ apiRequest: vi.fn() }))

describe('userApi', () => {
  afterEach(() => vi.clearAllMocks())

  it('gets users and handles an absent users array', async () => {
    apiRequest.mockResolvedValueOnce({ data: { users: [{ id: 1 }] } }).mockResolvedValueOnce({ data: {} })
    await expect(userApi.getUsers()).resolves.toEqual([{ id: 1 }])
    await expect(userApi.getUsers()).resolves.toEqual([])
    expect(apiRequest).toHaveBeenNthCalledWith(1, '/users')
  })

  it('gets, updates and uploads the active profile', async () => {
    const profile = { id: 1, name: 'Buyer' }
    const updated = { ...profile, name: 'New Name' }
    const file = new File(['image'], 'avatar.png', { type: 'image/png' })
    apiRequest
      .mockResolvedValueOnce({ data: { user: profile } })
      .mockResolvedValueOnce({ data: { user: updated } })
      .mockResolvedValueOnce({ status: 'success' })

    await expect(userApi.getProfile()).resolves.toEqual(profile)
    await expect(userApi.updateProfile({ name: 'New Name' })).resolves.toEqual(updated)
    await userApi.updatePhoto(file)
    expect(apiRequest).toHaveBeenNthCalledWith(1, '/users/me')
    expect(apiRequest).toHaveBeenNthCalledWith(2, '/users/me', { method: 'PUT', body: { name: 'New Name' } })
    const [, options] = apiRequest.mock.calls[2]
    expect(apiRequest.mock.calls[2][0]).toBe('/users/me/photo')
    expect(options.method).toBe('POST')
    expect(options.body.get('photo')).toBe(file)
  })

  it('uses the documented password route and expected request shape', async () => {
    const passwords = {
      password: 'old-pass',
      new_password: 'new-pass',
      new_password_confirmation: 'new-pass',
    }
    apiRequest.mockResolvedValue({ status: 'success' })

    await userApi.changePassword(passwords)

    expect(apiRequest).toHaveBeenCalledWith('/users/password', { method: 'PUT', body: passwords })
    expect(apiRequest).not.toHaveBeenCalledWith('/users/me/password', expect.anything())
  })

  it('returns undefined when profile update has no user payload', async () => {
    apiRequest.mockResolvedValue({ data: null })
    await expect(userApi.updateProfile({ name: 'Buyer' })).resolves.toBeUndefined()
  })
})
