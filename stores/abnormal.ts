import { defineStore } from 'pinia'
import type { AbnormalRecord, AbnormalStatus, AbnormalLevel } from '~/types'
import { mockAbnormalRecords } from '~/data/mock'

interface AbnormalState {
  records: AbnormalRecord[]
  currentRecord: AbnormalRecord | null
  loading: boolean
}

export const useAbnormalStore = defineStore('abnormal', {
  state: (): AbnormalState => ({
    records: [],
    currentRecord: null,
    loading: false,
  }),

  getters: {
    recordsByStatus: (state) => {
      return (status: AbnormalStatus) => state.records.filter(r => r.status === status)
    },

    recordsByLevel: (state) => {
      return (level: AbnormalLevel) => state.records.filter(r => r.level === level)
    },

    pendingRecords: (state): AbnormalRecord[] => {
      return state.records.filter(r => r.status === 'pending' || r.status === 'processing')
    },

    highPriorityCount: (state): number => {
      return state.records.filter(r => 
        (r.level === 'high' || r.level === 'critical') && 
        (r.status === 'pending' || r.status === 'processing')
      ).length
    },

    stats: (state) => ({
      total: state.records.length,
      pending: state.records.filter(r => r.status === 'pending').length,
      processing: state.records.filter(r => r.status === 'processing').length,
      resolved: state.records.filter(r => r.status === 'resolved').length,
      closed: state.records.filter(r => r.status === 'closed').length,
    }),
  },

  actions: {
    async fetchRecords() {
      this.loading = true
      await new Promise(resolve => setTimeout(resolve, 300))
      this.records = mockAbnormalRecords
      this.loading = false
    },

    selectRecord(record: AbnormalRecord | null) {
      this.currentRecord = record
    },

    updateStatus(recordId: string, status: AbnormalStatus) {
      const record = this.records.find(r => r.id === recordId)
      if (record) {
        record.status = status
      }
    },

    addHistory(recordId: string, action: string, content: string, operator: string) {
      const record = this.records.find(r => r.id === recordId)
      if (record) {
        record.history.push({
          id: Date.now().toString(),
          action,
          content,
          operator,
          timestamp: new Date(),
        })
      }
    },

    updateSolution(recordId: string, solution: string, compensation?: number) {
      const record = this.records.find(r => r.id === recordId)
      if (record) {
        record.solution = solution
        if (compensation !== undefined) record.compensation = compensation
      }
    },
  },
})
