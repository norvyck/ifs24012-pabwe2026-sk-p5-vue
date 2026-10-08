import { apiRequest } from '../../../helpers/apiHelper'

export const userApi = {
  async getUsers() {
    const response = await apiRequest('/users')
    return response.data.users || []
  },
  async getProfile() {
    const response = await apiRequest('/users/me')
    return response.data.user
  },
  async updateProfile(profile) {
    const response = await apiRequest('/users/me', { method: 'PUT', body: profile })
    return response.data?.user
  },
  updatePhoto(file) {
    const body = new FormData()
    body.append('photo', file)
    return apiRequest('/users/me/photo', { method: 'POST', body })
  },
  changePassword(passwords) {
    return apiRequest('/users/password', { method: 'PUT', body: passwords })
  },
}
