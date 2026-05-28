import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockOrders, mockUsers } from '../data/mockData'

export const useAppStore = defineStore('app', () => {
  const currentRole = ref('business')
  const currentUser = ref(mockUsers[0])
  const orders = ref(mockOrders)
  const selectedOrder = ref(null)
  const searchKeyword = ref('')

  const roles = [
    { key: 'business', name: '项目商务', desc: '订单创建、售后发起、进度跟踪' },
    { key: 'sample', name: '打样跟单', desc: '打样确认、版本管理、异常处理' },
    { key: 'warehouse', name: '仓配协调', desc: '发货管理、拆单处理、补单执行' }
  ]

  const filteredOrders = computed(() => {
    if (!searchKeyword.value) return orders.value
    const keyword = searchKeyword.value.toLowerCase()
    return orders.value.filter(order =>
      order.orderNo.toLowerCase().includes(keyword) ||
      order.customer.toLowerCase().includes(keyword) ||
      order.productName.toLowerCase().includes(keyword)
    )
  })

  const pendingOrders = computed(() =>
    filteredOrders.value.filter(o => o.status !== 'completed' && o.status !== 'cancelled')
  )

  const afterSalesOrders = computed(() =>
    filteredOrders.value.filter(o => o.afterSales && o.afterSales.length > 0)
  )

  function setRole(roleKey) {
    currentRole.value = roleKey
    currentUser.value = mockUsers.find(u => u.role === roleKey) || mockUsers[0]
  }

  function selectOrder(order) {
    selectedOrder.value = order
  }

  function addOrderHistory(orderId, action, remark) {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.history.push({
        id: Date.now(),
        time: new Date().toISOString(),
        action,
        operator: currentUser.value.name,
        operatorRole: currentRole.value,
        remark
      })
    }
  }

  function createAfterSale(orderId, type, reason, amount, items) {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      const afterSale = {
        id: Date.now(),
        type,
        status: 'pending',
        reason,
        amount: parseFloat(amount) || 0,
        items: items || [],
        createdAt: new Date().toISOString(),
        createdBy: currentUser.value.name,
        logs: [{
          time: new Date().toISOString(),
          action: '发起售后申请',
          operator: currentUser.value.name,
          remark: reason
        }]
      }
      order.afterSales.push(afterSale)
      order.status = 'after_sale'
      addOrderHistory(orderId, '发起售后', `${type === 'refund' ? '退款' : '补单'}申请：${reason}`)
    }
  }

  function updateAfterSaleStatus(orderId, afterSaleId, status, remark) {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      const afterSale = order.afterSales.find(a => a.id === afterSaleId)
      if (afterSale) {
        afterSale.status = status
        afterSale.logs.push({
          time: new Date().toISOString(),
          action: `售后${status === 'approved' ? '审核通过' : status === 'processing' ? '开始处理' : status === 'completed' ? '处理完成' : '已拒绝'}`,
          operator: currentUser.value.name,
          remark
        })
        addOrderHistory(orderId, '售后更新', `售后单状态更新为${status}：${remark}`)

        if (status === 'completed' && order.afterSales.every(a => a.status === 'completed')) {
          order.status = 'completed'
        }
      }
    }
  }

  function updateShipment(orderId, shipmentData, forceUpdate = false) {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      const allTrackingNos = orders.value.flatMap(o =>
        o.shipments?.map(s => s.trackingNo.toLowerCase()) || []
      )
      if (allTrackingNos.includes(shipmentData.trackingNo.toLowerCase())) {
        throw new Error('该运单号已存在，无法重复使用')
      }

      if (!forceUpdate && order.status === 'after_sale') {
        throw new Error('订单处于售后中，如需发货请先处理售后或在补单流程中操作')
      }

      order.shipments.push({
        id: Date.now(),
        ...shipmentData,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.value.name
      })

      const totalShipped = order.shipments.reduce((sum, s) => sum + s.quantity, 0)
      if (!forceUpdate && order.status !== 'after_sale') {
        if (totalShipped >= order.quantity) {
          order.status = 'shipped'
        } else {
          order.status = 'partial_shipped'
        }
      }

      addOrderHistory(orderId, '发货登记', `发货 ${shipmentData.quantity} 件，快递：${shipmentData.courier} ${shipmentData.trackingNo}`)
    }
  }

  return {
    currentRole,
    currentUser,
    orders,
    selectedOrder,
    searchKeyword,
    roles,
    filteredOrders,
    pendingOrders,
    afterSalesOrders,
    setRole,
    selectOrder,
    addOrderHistory,
    createAfterSale,
    updateAfterSaleStatus,
    updateShipment
  }
})