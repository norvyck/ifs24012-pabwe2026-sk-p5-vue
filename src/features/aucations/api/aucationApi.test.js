import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../../helpers/apiHelper'
import { aucationApi } from './aucationApi'

vi.mock('../../../helpers/apiHelper', () => ({ apiRequest: vi.fn() }))

describe('aucationApi', () => {
  afterEach(() => vi.clearAllMocks())

  it('loads all auctions with optional filters and an empty-result fallback', async () => {
    apiRequest.mockResolvedValueOnce({ data: { aucations: [{ id: 1 }] } }).mockResolvedValueOnce({ data: {} })
    await expect(aucationApi.getAll({ is_me: 1 })).resolves.toEqual([{ id: 1 }])
    await expect(aucationApi.getAll()).resolves.toEqual([])
    expect(apiRequest).toHaveBeenNthCalledWith(1, '/aucations', { query: { is_me: 1 } })
    expect(apiRequest).toHaveBeenNthCalledWith(2, '/aucations', { query: {} })
  })

  it('loads auction details and performs create, update and deletion', async () => {
    const auction = { id: 9, title: 'Film camera' }
    const payload = { title: 'Film camera', start_bid: 150000 }
    apiRequest
      .mockResolvedValueOnce({ data: { aucation: auction } })
      .mockResolvedValue({ status: 'success' })
    await expect(aucationApi.getById(9)).resolves.toEqual(auction)
    await aucationApi.add(payload)
    await aucationApi.update(9, payload)
    await aucationApi.delete(9)
    expect(apiRequest).toHaveBeenNthCalledWith(1, '/aucations/9')
    expect(apiRequest).toHaveBeenNthCalledWith(2, '/aucations', { method: 'POST', body: payload })
    expect(apiRequest).toHaveBeenNthCalledWith(3, '/aucations/9', { method: 'PUT', body: payload })
    expect(apiRequest).toHaveBeenNthCalledWith(4, '/aucations/9', { method: 'DELETE' })
  })

  it('uploads a cover, submits/cancels a bid, and deletes all auctions', async () => {
    apiRequest.mockResolvedValue({ status: 'success' })
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    await aucationApi.uploadCover(4, file)
    await aucationApi.addBid(4, 450000)
    await aucationApi.deleteBid(4)
    await aucationApi.deleteAll()
    expect(apiRequest.mock.calls[0][0]).toBe('/aucations/4/cover')
    expect(apiRequest.mock.calls[0][1].method).toBe('POST')
    expect(apiRequest.mock.calls[0][1].body.get('cover')).toBe(file)
    expect(apiRequest).toHaveBeenNthCalledWith(2, '/aucations/4/bids', { method: 'POST', body: { bid: 450000 } })
    expect(apiRequest).toHaveBeenNthCalledWith(3, '/aucations/4/bids', { method: 'DELETE' })
    expect(apiRequest).toHaveBeenNthCalledWith(4, '/aucations', { method: 'DELETE' })
  })
})
