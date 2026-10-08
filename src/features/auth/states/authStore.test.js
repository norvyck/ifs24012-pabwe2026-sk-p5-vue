import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { authApi } from '../api/authApi'
import { getAccessToken } from '../../../helpers/apiHelper'
import { useAuthStore } from './authStore'

vi.mock('../api/authApi', () => ({
  authApi: { login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}))

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('restores an existing session and updates the saved user', () => {
    localStorage.setItem('bidly_access_token', 'stored-token')
    localStorage.setItem('bidly_user', JSON.stringify({ id: 1, name: 'Saved' }))
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(true)
    expect(store.user.name).toBe('Saved')
    store.updateUser({ id: 1, name: 'Updated' })
    expect(JSON.parse(localStorage.getItem('bidly_user')).name).toBe('Updated')
  })

  it('recovers from a malformed cached user', async () => {
    localStorage.setItem('bidly_user', '{invalid')
    vi.resetModules()
    const { useAuthStore: createAuthStore } = await import('./authStore')
    const store = createAuthStore()
    expect(store.user).toBeNull()
  })

  it('logs in and persists the API session', async () => {
    const user = { id: 7, name: 'Buyer' }
    authApi.login.mockResolvedValue({ user, token: 'new-token' })
    const store = useAuthStore()
    await expect(store.login({ email: 'buyer@example.com', password: 'secret' })).resolves.toEqual(user)
    expect(store.isLoading).toBe(false)
    expect(store.isAuthenticated).toBe(true)
    expect(store.user).toEqual(user)
    expect(getAccessToken()).toBe('new-token')
  })

  it('exposes operation-specific auth loading state and keeps the compatibility loading getter', async () => {
    let finishLogin
    authApi.login.mockImplementationOnce(() => new Promise((resolve) => { finishLogin = resolve }))
    const store = useAuthStore()
    const loginPromise = store.login({ email: 'buyer@example.com', password: 'secret' })
    expect(store.isAuthLogin).toBe(true)
    expect(store.isAuthRegister).toBe(false)
    expect(store.isAuthLogout).toBe(false)
    expect(store.isLoading).toBe(true)

    finishLogin({ user: { id: 7 }, token: 'token' })
    await loginPromise
    expect(store.isAuthLogin).toBe(false)
    expect(store.isLoading).toBe(false)
  })

  it('clears the loading state when login fails', async () => {
    authApi.login.mockRejectedValue(new Error('Unauthorized'))
    const store = useAuthStore()
    await expect(store.login({ email: 'buyer@example.com', password: 'bad' })).rejects.toThrow('Unauthorized')
    expect(store.isLoading).toBe(false)
    expect(store.isAuthenticated).toBe(false)
  })

  it('registers and resets loading state on both outcomes', async () => {
    authApi.register.mockResolvedValueOnce({ status: 'success' }).mockRejectedValueOnce(new Error('Email exists'))
    const store = useAuthStore()
    await expect(store.register({ name: 'Buyer' })).resolves.toEqual({ status: 'success' })
    expect(store.isAuthRegister).toBe(false)
    expect(store.isLoading).toBe(false)
    await expect(store.register({ name: 'Buyer' })).rejects.toThrow('Email exists')
    expect(store.isLoading).toBe(false)
  })

  it('logs out, clearing local session even when the API request fails', async () => {
    authApi.logout.mockResolvedValueOnce({ status: 'success' })
    const store = useAuthStore()
    store.token = 'active-token'
    store.user = { id: 2 }
    const logoutPromise = store.logout()
    expect(store.isAuthLogout).toBe(true)
    await logoutPromise
    expect(authApi.logout).toHaveBeenCalledOnce()
    expect(store.isAuthLogout).toBe(false)
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('bidly_user')).toBeNull()

    authApi.logout.mockRejectedValueOnce(new Error('Network down'))
    store.token = 'second-token'
    store.user = { id: 3 }
    await expect(store.logout()).rejects.toThrow('Network down')
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
    expect(localStorage.getItem('bidly_access_token')).toBeNull()
  })

  it('does not call the API if there is no session token', async () => {
    const store = useAuthStore()
    await store.logout()
    expect(authApi.logout).not.toHaveBeenCalled()
    expect(store.user).toBeNull()
  })
})
