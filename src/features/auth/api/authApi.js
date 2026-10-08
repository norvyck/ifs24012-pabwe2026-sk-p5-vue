import { apiRequest } from '../../../helpers/apiHelper'

export const authApi = {
  async login(credentials) {
    const response = await apiRequest('/auth/login', { method: 'POST', body: credentials })
    return response.data
  },
  register(details) {
    return apiRequest('/auth/register', { method: 'POST', body: details })
  },
  logout() {
    return apiRequest('/auth/logout', { method: 'POST' })
  },
}
