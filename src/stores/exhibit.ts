import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ExhibitBorrow } from '@/types'
import { mockBorrowOrders } from '@/mock/exhibit'
import { useTraceStore } from './trace'

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

  const updateProgressNode = (orderId: string, nodeId: string, status: 'pending' | 'processing' | 'completed', operator: string, remark?: string) => {
    const order = getOrderById(orderId)
    if (order) {
      const node = order.progress.find(p => p.id === nodeId)
      if (node) {
        const oldStatus = node.status
        node.status = status
        node.operator = operator
        node.operateTime = new Date().toLocaleString('zh-CN')
        if (remark) {
          node.remark = remark
        }
        
        const traceStore = useTraceStore()
        traceStore.addLog({
          operator,
          operateTime: new Date().toLocaleString('zh-CN'),
          module: '展品借调',
          action: `更新进度 - ${node.name}`,
          targetId: order.orderNo,
          targetType: 'borrow',
          beforeChange: `${node.name}: ${oldStatus}`,
          afterChange: `${node.name}: ${status}`,
          remark: remark || '进度节点更新'
        })
      }
    }
  }

  const getProgressNodeByName = (order: ExhibitBorrow, name: string) => {
    return order.progress.find(p => p.name === name)
  }

  const confirmReceipt = (orderId: string, operator: string, remark?: string) => {
    const order = getOrderById(orderId)
    if (!order) return
    if (order.status !== 'transferring' && order.status !== 'exception') return
    
    const oldStatus = order.status
    
    const transportNode = getProgressNodeByName(order, '运输中')
    if (transportNode && transportNode.status !== 'completed') {
      updateProgressNode(orderId, transportNode.id, 'completed', operator, '运输完成，展品到达')
    }
    
    const receiptNode = getProgressNodeByName(order, '本馆签收')
    if (receiptNode) {
      updateProgressNode(orderId, receiptNode.id, 'completed', operator, remark || '签收确认')
    }
    
    order.status = 'installing'
    
    order.items.forEach(item => {
      item.status = 'installing'
      item.location = order.destination
    })
    
    const traceStore = useTraceStore()
    traceStore.addLog({
      operator,
      operateTime: new Date().toLocaleString('zh-CN'),
      module: '展品借调',
      action: '展品签收',
      targetId: order.id,
      targetType: 'borrow',
      beforeChange: `状态: ${oldStatus}`,
      afterChange: `状态: installing`,
      remark: remark || '展品已签收，进入布展阶段'
    })
  }

  const completeInstall = (orderId: string, operator: string, remark?: string) => {
    const order = getOrderById(orderId)
    if (!order) return
    if (order.status !== 'installing' && order.status !== 'exception') return
    
    const oldStatus = order.status
    
    const installNode = getProgressNodeByName(order, '布展完成')
    if (installNode) {
      updateProgressNode(orderId, installNode.id, 'completed', operator, remark || '布展完成')
    }
    
    order.status = 'completed'
    order.actualCompleteTime = new Date().toLocaleString('zh-CN')
    
    order.items.forEach(item => {
      item.status = 'borrowed'
    })
    
    order.hasException = false
    
    const traceStore = useTraceStore()
    traceStore.addLog({
      operator,
      operateTime: new Date().toLocaleString('zh-CN'),
      module: '展品借调',
      action: '布展完成',
      targetId: order.id,
      targetType: 'borrow',
      beforeChange: `状态: ${oldStatus}`,
      afterChange: `状态: completed`,
      remark: remark || '布展完成，借调流程结束'
    })
  }

  return {
    borrowOrders,
    pendingCount,
    transferringCount,
    installingCount,
    completedCount,
    exceptionCount,
    getOrderById,
    updateProgressNode,
    confirmReceipt,
    completeInstall
  }
})
