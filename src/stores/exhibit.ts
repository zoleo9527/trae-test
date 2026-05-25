import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ExhibitBorrow } from '@/types'
import { mockBorrowOrders } from '@/mock/exhibit'

export const useExhibitStore = defineStore('exhibit', () => {
  const borrowOrders = ref<ExhibitBorrow[]>([...mockBorrowOrders])

  const pendingCount = computed(() => 
    borrowOrders.value.filter(o => o.status === 'pending').length
  )
  const transferringCount = computed(() => 
    borrowOrders.value.filter(o => o.status === 'transferring').length
  )
  const installingCount = computed(() => 
    borrowOrders.value.filter(o => o.status === 'installing').length
  )
  const completedCount = computed(() => 
    borrowOrders.value.filter(o => o.status === 'completed').length
  )
  const exceptionCount = computed(() => 
    borrowOrders.value.filter(o => o.status === 'exception').length
  )

  const getOrderById = (id: string) => {
    return borrowOrders.value.find(o => o.id === id)
  }

  const updateProgressNode = (orderId: string, nodeId: string, status: 'pending' | 'processing' | 'completed', operator: string) => {
    const order = getOrderById(orderId)
    if (order) {
      const node = order.progress.find(p => p.id === nodeId)
      if (node) {
        node.status = status
        node.operator = operator
        node.operateTime = new Date().toLocaleString('zh-CN')
      }
    }
  }

  return {
    borrowOrders,
    pendingCount,
    transferringCount,
    installingCount,
    completedCount,
    exceptionCount,
    getOrderById,
    updateProgressNode
  }
})
