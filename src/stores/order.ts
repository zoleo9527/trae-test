import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, OrderStatus, OrderLog, ReturnInspection, RepairTask, DepositSettlement, DeductionItem, Instrument, Customer } from '@/types'
import { orders as mockOrders, instruments as mockInstruments, customers as mockCustomers } from '@/data/mock'

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>(JSON.parse(JSON.stringify(mockOrders)))
  const instruments = ref<Instrument[]>(JSON.parse(JSON.stringify(mockInstruments)))
  const customers = ref<Customer[]>(JSON.parse(JSON.stringify(mockCustomers)))

  const activeOrders = computed(() => orders.value.filter(o => o.status !== 'completed'))
  const overdueOrders = computed(() => orders.value.filter(o => o.status === 'overdue'))
  const disputedOrders = computed(() => orders.value.filter(o => o.status === 'disputed'))
  const repairingOrders = computed(() => orders.value.filter(o => o.status === 'repairing' || o.status === 'repair_reviewing'))
  const settlingOrders = computed(() => orders.value.filter(o => o.status === 'settling'))

  function getOrderById(id: string): Order | undefined {
    return orders.value.find(o => o.id === id)
  }

  function getOrderByNo(orderNo: string): Order | undefined {
    return orders.value.find(o => o.orderNo === orderNo)
  }

  function getInstrumentById(id: string): Instrument | undefined {
    return instruments.value.find(i => i.id === id)
  }

  function getCustomerById(id: string): Customer | undefined {
    return customers.value.find(c => c.id === id)
  }

  function getAvailableInstruments(): Instrument[] {
    return instruments.value.filter(i => i.status === 'available')
  }

  function addOrderLog(orderId: string, action: string, operator: string, operatorRole: string, note?: string) {
    const order = getOrderById(orderId)
    if (!order) return
    const log: OrderLog = {
      id: `LOG-${Date.now()}`,
      orderId,
      action,
      operator,
      operatorRole: operatorRole as OrderLog['operatorRole'],
      operatedAt: new Date().toISOString(),
      note,
    }
    order.logs.push(log)
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = getOrderById(orderId)
    if (!order) return
    order.status = status
  }

  function createOrder(data: {
    instrumentId: string
    customerId: string
    depositAmount: number
    rentalFee: number
    expectedReturnAt: string
    checkoutBy: string
    schoolCooperation: boolean
    schoolPaymentSchedule?: Order['schoolPaymentSchedule']
    checkoutPhotos: string[]
  }): Order {
    const orderNo = `ORD-2024-${String(38 + orders.value.length).padStart(4, '0')}`
    const order: Order = {
      id: `ORD-${String(orders.value.length + 1).padStart(3, '0')}`,
      orderNo,
      instrumentId: data.instrumentId,
      customerId: data.customerId,
      status: 'checked_out',
      checkoutBy: data.checkoutBy,
      checkoutAt: new Date().toISOString(),
      expectedReturnAt: data.expectedReturnAt,
      depositAmount: data.depositAmount,
      rentalFee: data.rentalFee,
      schoolCooperation: data.schoolCooperation,
      schoolPaymentSchedule: data.schoolPaymentSchedule,
      checkoutPhotos: data.checkoutPhotos,
      logs: [
        {
          id: `LOG-${Date.now()}`,
          orderId: `ORD-${String(orders.value.length + 1).padStart(3, '0')}`,
          action: '租出办理',
          operator: data.checkoutBy,
          operatorRole: 'consultant',
          operatedAt: new Date().toISOString(),
          note: '新订单租出',
        },
      ],
    }
    orders.value.push(order)
    const inst = getInstrumentById(data.instrumentId)
    if (inst) inst.status = 'rented'
    return order
  }

  function processReturn(orderId: string, data: {
    inspectedBy: string
    hasDamage: boolean
    damageLevel: ReturnInspection['damageLevel']
    damageDescription?: string
    damagePhotos: string[]
    liabilityParty: ReturnInspection['liabilityParty']
    isDisputed: boolean
  }) {
    const order = getOrderById(orderId)
    if (!order) return
    order.actualReturnAt = new Date().toISOString()
    order.returnInspection = {
      id: `RI-${Date.now()}`,
      orderId,
      inspectedBy: data.inspectedBy,
      inspectedAt: new Date().toISOString(),
      hasDamage: data.hasDamage,
      damageLevel: data.damageLevel,
      damageDescription: data.damageDescription,
      damagePhotos: data.damagePhotos,
      liabilityParty: data.liabilityParty,
      isDisputed: data.isDisputed,
    }
    if (data.isDisputed) {
      order.status = 'disputed'
      addOrderLog(orderId, '进入争议', data.inspectedBy, 'consultant', '客户对损坏判定有异议')
    } else if (data.hasDamage) {
      order.status = 'damage_assessing'
      addOrderLog(orderId, '损坏标记', data.inspectedBy, 'consultant', data.damageDescription)
    } else {
      order.status = 'settling'
      addOrderLog(orderId, '验收通过', data.inspectedBy, 'consultant', '无损坏，验收通过')
      const days = Math.round((new Date().getTime() - new Date(order.checkoutAt).getTime()) / (1000 * 60 * 60 * 24))
      const inst = getInstrumentById(order.instrumentId)
      const rentalAmount = days * (inst?.dailyRate || 0)
      order.depositSettlement = {
        id: `DS-${Date.now()}`,
        orderId,
        originalAmount: order.depositAmount,
        totalDeduction: rentalAmount,
        refundAmount: order.depositAmount - rentalAmount,
        status: 'pending',
        deductions: [
          { id: `DI-${Date.now()}`, settlementId: `DS-${Date.now()}`, type: 'rental', amount: rentalAmount, description: `${days}天租金`, isDisputed: false },
        ],
      }
    }
  }

  function createRepairTask(orderId: string, data: {
    assignedTo: string
    damageCause: string
    liabilityParty: RepairTask['liabilityParty']
    estimatedCost: number
  }) {
    const order = getOrderById(orderId)
    if (!order) return
    order.repairTask = {
      id: `RT-${Date.now()}`,
      orderId,
      assignedTo: data.assignedTo,
      status: 'pending',
      damageCause: data.damageCause,
      liabilityParty: data.liabilityParty,
      estimatedCost: data.estimatedCost,
      returnedForRework: false,
      logs: [],
    }
    order.status = 'repairing'
    addOrderLog(orderId, '创建维修任务', data.assignedTo, 'repair', data.damageCause)
  }

  function updateRepairTask(orderId: string, data: {
    status: RepairTask['status']
    actualCost?: number
    returnReason?: string
  }, operator: string) {
    const order = getOrderById(orderId)
    if (!order || !order.repairTask) return
    const task = order.repairTask
    task.status = data.status
    if (data.actualCost !== undefined) task.actualCost = data.actualCost
    if (data.status === 'in_progress') {
      if (!task.startedAt || task.returnedForRework) {
        task.startedAt = new Date().toISOString()
      }
      order.status = 'repairing'
      addOrderLog(orderId, task.returnedForRework ? '重新开始维修' : '维修开始', operator, 'repair', task.returnedForRework ? '退回后重新维修' : '开始维修')
    }
    if (data.status === 'review') {
      task.completedAt = new Date().toISOString()
      order.status = 'repair_reviewing'
      addOrderLog(orderId, '维修完成待复检', operator, 'repair', '维修完成，提交复检')
    }
    if (data.status === 'returned') {
      task.returnedForRework = true
      task.returnReason = data.returnReason
      order.status = 'repairing'
      addOrderLog(orderId, '维修退回', operator, 'consultant', data.returnReason || '复检不合格，退回重修')
    }
    if (data.status === 'completed') {
      order.status = 'settling'
      addOrderLog(orderId, '维修完成', operator, 'boss', '维修最终通过')
      if (!order.depositSettlement) {
        const totalDeduction = (task.actualCost || 0) + order.rentalFee
        order.depositSettlement = {
          id: `DS-${Date.now()}`,
          orderId,
          originalAmount: order.depositAmount,
          totalDeduction,
          refundAmount: order.depositAmount - totalDeduction,
          status: 'pending',
          deductions: [
            { id: `DI-${Date.now()}`, settlementId: `DS-${Date.now()}`, type: 'rental', amount: order.rentalFee, description: '租金', isDisputed: false },
            { id: `DI-${Date.now() + 1}`, settlementId: `DS-${Date.now()}`, type: 'repair', amount: task.actualCost || 0, description: '维修费', isDisputed: false },
          ],
        }
      }
      const inst = getInstrumentById(order.instrumentId)
      if (inst) inst.status = 'available'
    }
  }

  function settleDeposit(orderId: string, deductions: Omit<DeductionItem, 'id' | 'settlementId'>[], approvedBy: string) {
    const order = getOrderById(orderId)
    if (!order) return
    const totalDeduction = deductions.reduce((sum, d) => sum + d.amount, 0)
    order.depositSettlement = {
      id: `DS-${Date.now()}`,
      orderId,
      originalAmount: order.depositAmount,
      totalDeduction,
      refundAmount: order.depositAmount - totalDeduction,
      status: 'approved',
      approvedBy,
      settledAt: new Date().toISOString(),
      deductions: deductions.map((d, i) => ({
        ...d,
        id: `DI-${Date.now() + i}`,
        settlementId: `DS-${Date.now()}`,
      })),
    }
    order.status = 'completed'
    addOrderLog(orderId, '押金结算完成', approvedBy, 'boss', `扣款${totalDeduction}元，退还${order.depositAmount - totalDeduction}元`)
    const inst = getInstrumentById(order.instrumentId)
    if (inst && inst.status !== 'available') inst.status = 'available'
  }

  function resolveDispute(orderId: string, resolution: string, resolvedBy: string) {
    const order = getOrderById(orderId)
    if (!order) return
    order.status = 'settling'
    if (order.returnInspection) order.returnInspection.isDisputed = false
    addOrderLog(orderId, '争议解决', resolvedBy, 'boss', resolution)
  }

  function searchOrders(query: string): Order[] {
    const q = query.toLowerCase()
    return orders.value.filter(o => {
      const inst = getInstrumentById(o.instrumentId)
      const cust = getCustomerById(o.customerId)
      return o.orderNo.toLowerCase().includes(q)
        || inst?.name.toLowerCase().includes(q)
        || cust?.name.toLowerCase().includes(q)
    })
  }

  function filterOrdersByStatus(status: OrderStatus | 'all' | 'abnormal'): Order[] {
    if (status === 'all') return orders.value
    if (status === 'abnormal') return orders.value.filter(o =>
      o.status === 'overdue' || o.status === 'disputed' || o.status === 'damage_assessing'
    )
    return orders.value.filter(o => o.status === status)
  }

  return {
    orders, instruments, customers,
    activeOrders, overdueOrders, disputedOrders, repairingOrders, settlingOrders,
    getOrderById, getOrderByNo, getInstrumentById, getCustomerById, getAvailableInstruments,
    addOrderLog, updateOrderStatus, createOrder, processReturn,
    createRepairTask, updateRepairTask, settleDeposit, resolveDispute,
    searchOrders, filterOrdersByStatus,
  }
})
