import { defineStore } from 'pinia'
import { aucationApi } from '../api/aucationApi'

export const useAucationsStore = defineStore('aucations', {
  state: () => ({
    aucations: [],
    aucation: null,
    isLoading: false,
    isSaving: false,
  }),
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
      this.isSaving = true
      try {
        return await aucationApi.add(data)
      } finally {
        this.isSaving = false
      }
    },
    async updateAucation(id, data) {
      this.isSaving = true
      try {
        return await aucationApi.update(id, data)
      } finally {
        this.isSaving = false
      }
    },
    async uploadCover(id, file) {
      this.isSaving = true
      try {
        return await aucationApi.uploadCover(id, file)
      } finally {
        this.isSaving = false
      }
    },
    async deleteAucation(id) {
      this.isSaving = true
      try {
        return await aucationApi.delete(id)
      } finally {
        this.isSaving = false
      }
    },
    async addBid(id, bid) {
      this.isSaving = true
      try {
        return await aucationApi.addBid(id, bid)
      } finally {
        this.isSaving = false
      }
    },
    async deleteBid(id) {
      this.isSaving = true
      try {
        return await aucationApi.deleteBid(id)
      } finally {
        this.isSaving = false
      }
    },
    async deleteAllAucations() {
      this.isSaving = true
      try {
        return await aucationApi.deleteAll()
      } finally {
        this.isSaving = false
      }
    },
  },
})
