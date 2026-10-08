import { apiRequest } from '../../../helpers/apiHelper'

export const aucationApi = {
  async getAll(filters = {}) {
    const response = await apiRequest('/aucations', { query: filters })
    return response.data.aucations || []
  },
  async getById(id) {
    const response = await apiRequest(`/aucations/${id}`)
    return response.data.aucation
  },
  add(data) {
    return apiRequest('/aucations', { method: 'POST', body: data })
  },
  update(id, data) {
    return apiRequest(`/aucations/${id}`, { method: 'PUT', body: data })
  },
  uploadCover(id, file) {
    const body = new FormData()
    body.append('cover', file)
    return apiRequest(`/aucations/${id}/cover`, { method: 'POST', body })
  },
  delete(id) {
    return apiRequest(`/aucations/${id}`, { method: 'DELETE' })
  },
  addBid(id, bid) {
    return apiRequest(`/aucations/${id}/bids`, { method: 'POST', body: { bid } })
  },
  deleteBid(id) {
    return apiRequest(`/aucations/${id}/bids`, { method: 'DELETE' })
  },
  deleteAll() {
    return apiRequest('/aucations', { method: 'DELETE' })
  },
}
