import { defineStore } from 'pinia'
import { authApi } from '../api/authApi'
import { getAccessToken, putAccessToken } from '../../../helpers/apiHelper'

const storedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('bidly_user') || 'null')
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getAccessToken(),
    user: storedUser(),
    isLoading: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },
  actions: {
    async login(credentials) {
      this.isLoading = true
      try {
        const result = await authApi.login(credentials)
        this.token = result.token
        this.user = result.user
        putAccessToken(result.token)
        localStorage.setItem('bidly_user', JSON.stringify(result.user))
        return result.user
      } finally {
        this.isLoading = false
      }
    },
    async register(details) {
      this.isLoading = true
      try {
        return await authApi.register(details)
      } finally {
        this.isLoading = false
      }
    },
    async logout() {
      try {
        if (this.token) await authApi.logout()
      } finally {
        this.token = ''
        this.user = null
        putAccessToken('')
        localStorage.removeItem('bidly_user')
      }
    },
    updateUser(user) {
      this.user = user
      localStorage.setItem('bidly_user', JSON.stringify(user))
    },
  },
})
