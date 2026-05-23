import { defineStore } from 'pinia'
import type { HandoverRecord, HandoverType } from '~/types'
import { mockHandoverRecords } from '~/data/mock'

interface HandoverState {
  records: HandoverRecord[]
  loading: boolean
}

export const useHandoverStore = defineStore('handover', {
  state: (): HandoverState => ({
    records: [],
    loading: false,
  }),

  getters: {
    recordsByType: (state) => {
      return (type: HandoverType) => state.records.filter(r => r.type === type)
    },

    recordsByOrder: (state) => {
      return (orderId: string) => state.records.filter(r => r.orderId === orderId)
    },

    recentRecords: (state): HandoverRecord[] => {
      return [...state.records]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
    },
  },

  actions: {
    async fetchRecords() {
      this.loading = true
      await new Promise(resolve => setTimeout(resolve, 300))
      this.records = mockHandoverRecords
      this.loading = false
    },

    addRecord(record: Omit<HandoverRecord, 'id'>) {
      this.records.push({
        ...record,
        id: Date.now().toString(),
      })
    },

    createRecord(record: Omit<HandoverRecord, 'id'>) {
      const newRecord: HandoverRecord = {
        ...record,
        id: Date.now().toString(),
      }
      this.records.unshift(newRecord)
      return newRecord
    },
  },
})
