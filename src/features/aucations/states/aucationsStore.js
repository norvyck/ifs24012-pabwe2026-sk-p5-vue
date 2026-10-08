import { defineStore } from 'pinia'
import { aucationApi } from '../api/aucationApi'

const mutationFlags = [
  ['isAucationAdd', 'isAucationAdded'],
  ['isAucationChange', 'isAucationChanged'],
  ['isAucationChangeCover', 'isAucationChangedCover'],
  ['isAucationDelete', 'isAucationDeleted'],
  ['isBidAdd', 'isBidAdded'],
  ['isBidDelete', 'isBidDeleted'],
  ['isAucationDeleteAll', 'isAucationDeletedAll'],
]

async function trackMutation(store, loadingFlag, completedFlag, operation) {
  store[loadingFlag] = true
  store[completedFlag] = false
  try {
    const result = await operation()
    store[completedFlag] = true
    return result
  } finally {
    store[loadingFlag] = false
  }
}

export const useAucationsStore = defineStore('aucations', {
  state: () => ({
    aucations: [],
    aucation: null,
    isLoading: false,
    ...Object.fromEntries(mutationFlags.flatMap(([loading, completed]) => [[loading, false], [completed, false]])),
  }),
  getters: {
    isAucation: (state) => state.isLoading,
    isSaving: (state) => mutationFlags.some(([loading]) => state[loading]),
  },
  actions: {
    async fetchAucations(filters = {}) {
      this.isLoading = true
      try {
        this.aucations = await aucationApi.getAll(filters)
        return this.aucations
      } finally {
        this.isLoading = false
      }
    },
    async fetchAucation(id) {
      this.isLoading = true
      try {
        this.aucation = await aucationApi.getById(id)
        return this.aucation
      } finally {
        this.isLoading = false
      }
    },
    async addAucation(data) {
      return trackMutation(this, 'isAucationAdd', 'isAucationAdded', () => aucationApi.add(data))
    },
    async updateAucation(id, data) {
      return trackMutation(this, 'isAucationChange', 'isAucationChanged', () => aucationApi.update(id, data))
    },
    async uploadCover(id, file) {
      return trackMutation(this, 'isAucationChangeCover', 'isAucationChangedCover', () => aucationApi.uploadCover(id, file))
    },
    async deleteAucation(id) {
      return trackMutation(this, 'isAucationDelete', 'isAucationDeleted', () => aucationApi.delete(id))
    },
    async addBid(id, bid) {
      return trackMutation(this, 'isBidAdd', 'isBidAdded', () => aucationApi.addBid(id, bid))
    },
    async deleteBid(id) {
      return trackMutation(this, 'isBidDelete', 'isBidDeleted', () => aucationApi.deleteBid(id))
    },
    async deleteAllAucations() {
      return trackMutation(this, 'isAucationDeleteAll', 'isAucationDeletedAll', () => aucationApi.deleteAll())
    },
  },
})
