import { defineStore } from 'pinia'
import { userApi } from '../api/userApi'

export const useUsersStore = defineStore('users', {
  state: () => ({ users: [], profile: null, isLoading: false, isSaving: false }),
  getters: {
    user: (state) => state.profile,
  },
  actions: {
    async fetchUsers() {
      this.isLoading = true
      try {
        this.users = await userApi.getUsers()
        return this.users
      } finally {
        this.isLoading = false
      }
    },
    async fetchProfile() {
      this.isLoading = true
      try {
        this.profile = await userApi.getProfile()
        return this.profile
      } finally {
        this.isLoading = false
      }
    },
    async updateProfile(profile) {
      this.isSaving = true
      try {
        this.profile = await userApi.updateProfile(profile)
        return this.profile
      } finally {
        this.isSaving = false
      }
    },
    async updatePhoto(file) {
      this.isSaving = true
      try {
        await userApi.updatePhoto(file)
        return await this.fetchProfile()
      } finally {
        this.isSaving = false
      }
    },
    changePassword(passwords) {
      return userApi.changePassword(passwords)
    },
  },
})
