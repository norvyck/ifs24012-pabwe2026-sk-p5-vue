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
    isAuthLogin: false,
    isAuthRegister: false,
    isAuthLogout: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isLoading: (state) => state.isAuthLogin || state.isAuthRegister || state.isAuthLogout,
  },
  actions: {
    async login(credentials) {
      this.isAuthLogin = true
      try {
        const result = await authApi.login(credentials)
        this.token = result.token
        this.user = result.user
        putAccessToken(result.token)
        localStorage.setItem('bidly_user', JSON.stringify(result.user))
        return result.user
      } finally {
        this.isAuthLogin = false
      }
    },
    async register(details) {
      this.isAuthRegister = true
      try {
        return await authApi.register(details)
      } finally {
        this.isAuthRegister = false
      }
    },
    async logout() {
      this.isAuthLogout = true
      try {
        if (this.token) await authApi.logout()
      } finally {
        this.token = ''
        this.user = null
        putAccessToken('')
        localStorage.removeItem('bidly_user')
        this.isAuthLogout = false
      }
    },
    updateUser(user) {
      this.user = user
      localStorage.setItem('bidly_user', JSON.stringify(user))
    },
  },
})
