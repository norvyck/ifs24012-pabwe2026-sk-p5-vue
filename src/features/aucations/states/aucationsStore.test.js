import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { aucationApi } from '../api/aucationApi'
import { useAucationsStore } from './aucationsStore'

vi.mock('../api/aucationApi', () => ({
  aucationApi: {
    getAll: vi.fn(), getById: vi.fn(), add: vi.fn(), update: vi.fn(),
    uploadCover: vi.fn(), delete: vi.fn(), addBid: vi.fn(), deleteBid: vi.fn(), deleteAll: vi.fn(),
  },
}))

describe('aucationsStore', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
  })

  it('loads and stores the auction collection and selected detail', async () => {
    const list = [{ id: 1 }]
    const detail = { id: 1, title: 'Camera' }
    aucationApi.getAll.mockResolvedValue(list)
    aucationApi.getById.mockResolvedValue(detail)
    const store = useAucationsStore()
    const resultList = await store.fetchAucations({ is_closed: 1 })
    const resultDetail = await store.fetchAucation(1)
    expect(resultList.map((item) => item.id)).toEqual([1])
    expect(resultDetail.id).toBe(1)
    expect(aucationApi.getAll).toHaveBeenCalledWith({ is_closed: 1 })
    expect(store.aucations.map((item) => item.id)).toEqual([1])
    expect(store.aucation.id).toBe(detail.id)
    expect(store.isLoading).toBe(false)
  })

  it('resets loading state when reads fail', async () => {
    aucationApi.getAll.mockRejectedValueOnce(new Error('list failed'))
    aucationApi.getById.mockRejectedValueOnce(new Error('detail failed'))
    const store = useAucationsStore()
    await expect(store.fetchAucations()).rejects.toThrow('list failed')
    expect(store.isLoading).toBe(false)
    await expect(store.fetchAucation(3)).rejects.toThrow('detail failed')
    expect(store.isLoading).toBe(false)
  })

  it.each([
    ['addAucation', 'add', [{ title: 'Camera' }]],
    ['updateAucation', 'update', [8, { title: 'New camera' }]],
    ['uploadCover', 'uploadCover', [8, new File(['cover'], 'cover.png')]],
    ['deleteAucation', 'delete', [8]],
    ['addBid', 'addBid', [8, 5000]],
    ['deleteBid', 'deleteBid', [8]],
    ['deleteAllAucations', 'deleteAll', []],
  ])('runs %s and resets saving state on success', async (actionName, apiName, args) => {
    aucationApi[apiName].mockResolvedValue({ status: 'success' })
    const store = useAucationsStore()
    await expect(store[actionName](...args)).resolves.toEqual({ status: 'success' })
    expect(aucationApi[apiName]).toHaveBeenCalledWith(...args)
    expect(store.isSaving).toBe(false)
  })

  it('resets saving state after a mutation fails', async () => {
    aucationApi.add.mockRejectedValue(new Error('write failed'))
    const store = useAucationsStore()
    await expect(store.addAucation({})).rejects.toThrow('write failed')
    expect(store.isSaving).toBe(false)
  })
})
