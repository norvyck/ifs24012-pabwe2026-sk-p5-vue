import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { userApi } from '../api/userApi'
import { useUsersStore } from './usersStore'

vi.mock('../api/userApi', () => ({
  userApi: {
    getUsers: vi.fn(), getProfile: vi.fn(), updateProfile: vi.fn(),
    updatePhoto: vi.fn(), changePassword: vi.fn(),
  },
}))

describe('usersStore', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
  })

  it('loads and caches the directory and active profile', async () => {
    const directory = [{ id: 1, name: 'Buyer' }]
    const profile = { id: 1, name: 'Buyer' }
    userApi.getUsers.mockResolvedValue(directory)
    userApi.getProfile.mockResolvedValue(profile)
    const store = useUsersStore()
    const resultUsers = await store.fetchUsers()
    const resultProfile = await store.fetchProfile()
    expect(resultUsers.map((user) => user.id)).toEqual([1])
    expect(resultProfile.id).toBe(1)
    expect(store.users.map((user) => user.id)).toEqual([1])
    expect(store.profile.id).toBe(profile.id)
    expect(store.user).toEqual(profile)
    expect(store.isLoading).toBe(false)
  })

  it('resets loading state on directory or profile failures', async () => {
    userApi.getUsers.mockRejectedValueOnce(new Error('directory failed'))
    userApi.getProfile.mockRejectedValueOnce(new Error('profile failed'))
    const store = useUsersStore()
    await expect(store.fetchUsers()).rejects.toThrow('directory failed')
    expect(store.isLoading).toBe(false)
    await expect(store.fetchProfile()).rejects.toThrow('profile failed')
    expect(store.isLoading).toBe(false)
  })

  it('updates the profile and resets saving state for success and failure', async () => {
    const profile = { id: 1, name: 'New name' }
    userApi.updateProfile.mockResolvedValueOnce(profile).mockRejectedValueOnce(new Error('update failed'))
    const store = useUsersStore()
    await expect(store.updateProfile({ name: 'New name' })).resolves.toEqual(profile)
    expect(store.profile).toEqual(profile)
    expect(store.isSaving).toBe(false)
    await expect(store.updateProfile({ name: 'Bad' })).rejects.toThrow('update failed')
    expect(store.isSaving).toBe(false)
  })

  it('uploads a photo then reloads the profile, and resets saving on upload errors', async () => {
    const file = new File(['photo'], 'profile.png', { type: 'image/png' })
    userApi.updatePhoto.mockResolvedValueOnce({ status: 'success' }).mockRejectedValueOnce(new Error('upload failed'))
    userApi.getProfile.mockResolvedValueOnce({ id: 1, photo: 'profile.png' })
    const store = useUsersStore()
    await expect(store.updatePhoto(file)).resolves.toEqual({ id: 1, photo: 'profile.png' })
    expect(store.profile.photo).toBe('profile.png')
    expect(store.isSaving).toBe(false)
    await expect(store.updatePhoto(file)).rejects.toThrow('upload failed')
    expect(store.isSaving).toBe(false)
  })

  it('also clears saving state when the post-upload profile refresh fails', async () => {
    userApi.updatePhoto.mockResolvedValue({ status: 'success' })
    userApi.getProfile.mockRejectedValue(new Error('refresh failed'))
    const store = useUsersStore()
    await expect(store.updatePhoto(new File(['photo'], 'profile.png'))).rejects.toThrow('refresh failed')
    expect(store.isSaving).toBe(false)
  })

  it('delegates password changes to the API', async () => {
    userApi.changePassword.mockResolvedValue({ status: 'success' })
    const store = useUsersStore()
    const values = { password: 'old', new_password: 'new', new_password_confirmation: 'new' }
    await expect(store.changePassword(values)).resolves.toEqual({ status: 'success' })
    expect(userApi.changePassword).toHaveBeenCalledWith(values)
  })
})
