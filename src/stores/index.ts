import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Member, Product, ExchangeOrder, PointsRecord, InventoryLog, InspectionIssue, ExchangeOrderStatus, UserRole } from '@/types'
import { UserRole as RoleEnum, ExchangeOrderStatus as OrderStatusEnum } from '@/types'
import { mockUsers, mockMembers, mockProducts, mockExchangeOrders, mockPointsRecords, mockInventoryLogs, mockInspectionIssues, generateOrderNo, generateVerifyCode } from '@/data/mock'
import dayjs from 'dayjs'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)

  const login = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId)
    if (user) {
      currentUser.value = user
      localStorage.setItem('currentUser', JSON.stringify(user))
    }
  }

  const logout = () => {
    currentUser.value = null
    localStorage.removeItem('currentUser')
  }

  const checkAuth = () => {
    const saved = localStorage.getItem('currentUser')
    if (saved) {
      currentUser.value = JSON.parse(saved)
    }
  }

  const isManager = computed(() => currentUser.value?.role === RoleEnum.STORE_MANAGER)
  const isPlanner = computed(() => currentUser.value?.role === RoleEnum.PLANNER)
  const isWarehouse = computed(() => currentUser.value?.role === RoleEnum.WAREHOUSE)

  return {
    currentUser,
    login,
    logout,
    checkAuth,
    isManager,
    isPlanner,
    isWarehouse
  }
})

export const useMemberStore = defineStore('member', () => {
  const members = ref<Member[]>([...mockMembers])
  const pointsRecords = ref<PointsRecord[]>([...mockPointsRecords])

  const getMemberById = (id: string) => {
    return members.value.find(m => m.id === id)
  }

  const getMemberPointsRecords = (memberId: string) => {
    return pointsRecords.value.filter(r => r.memberId === memberId).sort((a, b) => 
      dayjs(b.createTime).valueOf() - dayjs(a.createTime).valueOf()
    )
  }

  const addPoints = (memberId: string, amount: number, source: string, remark: string, operator: User, orderNo?: string) => {
    const member = members.value.find(m => m.id === memberId)
    if (!member) return false

    member.totalPoints += amount
    member.availablePoints += amount

    const record: PointsRecord = {
      id: `PR${Date.now()}`,
      memberId,
      memberName: member.name,
      type: 'earn',
      amount,
      balance: member.availablePoints,
      source: source as any,
      orderNo,
      remark,
      operatorId: operator.id,
      operatorName: operator.name,
      storeId: operator.storeId || 'S001',
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    pointsRecords.value.unshift(record)
    return true
  }

  const freezePoints = (memberId: string, amount: number, remark: string, operator: User, orderNo?: string) => {
    const member = members.value.find(m => m.id === memberId)
    if (!member) return false
    if (member.availablePoints < amount) return false

    member.availablePoints -= amount
    member.frozenPoints += amount

    const record: PointsRecord = {
      id: `PR${Date.now()}`,
      memberId,
      memberName: member.name,
      type: 'adjust',
      amount: 0,
      balance: member.availablePoints,
      source: 'adjust',
      orderNo,
      remark: `${remark}，冻结${amount}积分`,
      operatorId: operator.id,
      operatorName: operator.name,
      storeId: operator.storeId || 'S001',
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    pointsRecords.value.unshift(record)
    return true
  }

  const deductFrozenPoints = (memberId: string, amount: number, remark: string, operator: User, orderNo?: string) => {
    const member = members.value.find(m => m.id === memberId)
    if (!member) return false
    if (member.frozenPoints < amount) return false

    member.totalPoints -= amount
    member.frozenPoints -= amount

    const record: PointsRecord = {
      id: `PR${Date.now()}`,
      memberId,
      memberName: member.name,
      type: 'spend',
      amount: -amount,
      balance: member.availablePoints,
      source: 'exchange',
      orderNo,
      remark,
      operatorId: operator.id,
      operatorName: operator.name,
      storeId: operator.storeId || 'S001',
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    pointsRecords.value.unshift(record)
    return true
  }

  const unfreezePoints = (memberId: string, amount: number, remark: string, operator: User, orderNo?: string) => {
    const member = members.value.find(m => m.id === memberId)
    if (!member) return false
    if (member.frozenPoints < amount) return false

    member.availablePoints += amount
    member.frozenPoints -= amount

    const record: PointsRecord = {
      id: `PR${Date.now()}`,
      memberId,
      memberName: member.name,
      type: 'adjust',
      amount: 0,
      balance: member.availablePoints,
      source: 'adjust',
      orderNo,
      remark: `${remark}，解冻${amount}积分`,
      operatorId: operator.id,
      operatorName: operator.name,
      storeId: operator.storeId || 'S001',
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    pointsRecords.value.unshift(record)
    return true
  }

  return {
    members,
    pointsRecords,
    getMemberById,
    getMemberPointsRecords,
    addPoints,
    freezePoints,
    deductFrozenPoints,
    unfreezePoints
  }
})

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([...mockProducts])
  const inventoryLogs = ref<InventoryLog[]>([...mockInventoryLogs])

  const getProductById = (id: string) => {
    return products.value.find(p => p.id === id)
  }

  const onShelfProducts = computed(() => 
    products.value.filter(p => p.status === 'on_shelf')
  )

  const coBrandedProducts = computed(() =>
    products.value.filter(p => p.isCoBranded)
  )

  const syncFailedProducts = computed(() =>
    products.value.filter(p => p.syncStatus === 'failed')
  )

  const updateProductStatus = (id: string, status: any) => {
    const product = products.value.find(p => p.id === id)
    if (product) {
      product.status = status
      product.updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
  }

  const lockStock = (productId: string, quantity: number, remark: string, operator: User, relatedOrderNo?: string) => {
    const product = products.value.find(p => p.id === productId)
    if (!product) return false
    if (product.availableStock < quantity) return false

    const beforeAvailable = product.availableStock
    product.availableStock -= quantity
    product.lockedStock += quantity

    const log: InventoryLog = {
      id: `IL${Date.now()}`,
      productId,
      productName: product.name,
      type: 'lock',
      quantity,
      beforeStock: beforeAvailable,
      afterStock: product.availableStock,
      relatedOrderNo,
      remark,
      operatorId: operator.id,
      operatorName: operator.name,
      storeId: operator.storeId || 'S001',
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    inventoryLogs.value.unshift(log)
    return true
  }

  const unlockStock = (productId: string, quantity: number, remark: string, operator: User, relatedOrderNo?: string) => {
    const product = products.value.find(p => p.id === productId)
    if (!product) return false
    if (product.lockedStock < quantity) return false

    const beforeAvailable = product.availableStock
    product.availableStock += quantity
    product.lockedStock -= quantity

    const log: InventoryLog = {
      id: `IL${Date.now()}`,
      productId,
      productName: product.name,
      type: 'unlock',
      quantity,
      beforeStock: beforeAvailable,
      afterStock: product.availableStock,
      relatedOrderNo,
      remark,
      operatorId: operator.id,
      operatorName: operator.name,
      storeId: operator.storeId || 'S001',
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    inventoryLogs.value.unshift(log)
    return true
  }

  const deductLockedStock = (productId: string, quantity: number, remark: string, operator: User, relatedOrderNo?: string) => {
    const product = products.value.find(p => p.id === productId)
    if (!product) return false
    if (product.lockedStock < quantity) return false

    const beforeStock = product.stock
    product.stock -= quantity
    product.lockedStock -= quantity

    const log: InventoryLog = {
      id: `IL${Date.now()}`,
      productId,
      productName: product.name,
      type: 'out',
      quantity,
      beforeStock,
      afterStock: product.stock,
      relatedOrderNo,
      remark,
      operatorId: operator.id,
      operatorName: operator.name,
      storeId: operator.storeId || 'S001',
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    inventoryLogs.value.unshift(log)
    return true
  }

  const adjustStock = (productId: string, quantity: number, type: string, remark: string, operator: User) => {
    const product = products.value.find(p => p.id === productId)
    if (!product) return false

    const beforeStock = product.stock
    if (type === 'in') {
      product.stock += quantity
      product.availableStock += quantity
    } else if (type === 'out') {
      product.stock -= quantity
      product.availableStock -= quantity
    } else if (type === 'adjust') {
      product.stock = quantity
      product.availableStock = quantity - product.lockedStock
    }

    const log: InventoryLog = {
      id: `IL${Date.now()}`,
      productId,
      productName: product.name,
      type: type as any,
      quantity,
      beforeStock,
      afterStock: product.stock,
      remark,
      operatorId: operator.id,
      operatorName: operator.name,
      storeId: operator.storeId || 'S001',
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    inventoryLogs.value.unshift(log)
    return true
  }

  const syncCoBrandedProduct = (productId: string, operator: User) => {
    const product = products.value.find(p => p.id === productId)
    if (!product || !product.isCoBranded) return false

    product.syncStatus = 'pending'
    product.lastSyncTime = dayjs().format('YYYY-MM-DD HH:mm:ss')

    setTimeout(() => {
      const success = Math.random() > 0.3
      if (success) {
        product.syncStatus = 'synced'
        const newStock = Math.floor(Math.random() * 50) + 20
        product.stock = newStock
        product.availableStock = newStock - product.lockedStock
        product.status = 'on_shelf'
      } else {
        product.syncStatus = 'failed'
      }
      product.lastSyncTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
      product.updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    }, 2000)

    return true
  }

  return {
    products,
    inventoryLogs,
    onShelfProducts,
    coBrandedProducts,
    syncFailedProducts,
    getProductById,
    updateProductStatus,
    lockStock,
    unlockStock,
    deductLockedStock,
    adjustStock,
    syncCoBrandedProduct
  }
})

export const useOrderStore = defineStore('order', () => {
  const memberStore = useMemberStore()
  const productStore = useProductStore()
  const orders = ref<ExchangeOrder[]>([...mockExchangeOrders])
  const inspectionIssues = ref<InspectionIssue[]>([...mockInspectionIssues])

  const pendingOrders = computed(() =>
    orders.value.filter(o => o.status === OrderStatusEnum.PENDING)
  )

  const confirmedOrders = computed(() =>
    orders.value.filter(o => o.status === OrderStatusEnum.CONFIRMED)
  )

  const shippedOrders = computed(() =>
    orders.value.filter(o => o.status === OrderStatusEnum.SHIPPED)
  )

  const abnormalOrders = computed(() =>
    orders.value.filter(o => o.isAbnormal)
  )

  const getOrderById = (id: string) => {
    return orders.value.find(o => o.id === id)
  }

  const getOrdersByStore = (storeId: string) => {
    return orders.value.filter(o => o.storeId === storeId)
  }

  const createOrder = (member: Member, product: Product, quantity: number, operator: User) => {
    const totalPoints = product.pointsRequired * quantity

    if (member.availablePoints < totalPoints) {
      return { success: false, message: '会员可用积分不足' }
    }

    if (product.availableStock < quantity) {
      return { success: false, message: '商品可用库存不足' }
    }

    const pointsFrozen = memberStore.freezePoints(
      member.id, 
      totalPoints, 
      `兑换${product.name}`, 
      operator
    )
    if (!pointsFrozen) {
      return { success: false, message: '积分冻结失败' }
    }

    const stockLocked = productStore.lockStock(
      product.id, 
      quantity, 
      `订单锁定库存`, 
      operator
    )
    if (!stockLocked) {
      memberStore.unfreezePoints(member.id, totalPoints, '库存锁定失败，回滚积分', operator)
      return { success: false, message: '库存锁定失败' }
    }

    const isAbnormal = product.isCoBranded && product.syncStatus === 'failed'
    const abnormalType = isAbnormal ? 'sync_failed' as const : undefined
    const abnormalRemark = isAbnormal ? '联名商品同步失败，需企划专员处理' : undefined

    const order: ExchangeOrder = {
      id: `O${Date.now()}`,
      orderNo: generateOrderNo(),
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl,
      pointsRequired: product.pointsRequired,
      quantity,
      totalPoints,
      status: OrderStatusEnum.PENDING,
      storeId: operator.storeId || 'S001',
      storeName: '文创旗舰店',
      applyTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      currentHandler: isAbnormal ? RoleEnum.PLANNER : RoleEnum.STORE_MANAGER,
      isAbnormal,
      abnormalType,
      abnormalRemark
    }
    
    orders.value.unshift(order)
    return { success: true, order }
  }

  const confirmOrder = (orderId: string, operator: User) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== OrderStatusEnum.PENDING) {
      return { success: false, message: '订单状态不正确' }
    }

    if (operator.storeId && order.storeId !== operator.storeId) {
      return { success: false, message: '无权处理其他门店的订单' }
    }

    if (order.isAbnormal) {
      return { success: false, message: '异常订单需先由企划专员解除异常' }
    }

    const product = productStore.getProductById(order.productId)
    if (product?.isCoBranded && product.syncStatus === 'failed') {
      order.isAbnormal = true
      order.abnormalType = 'sync_failed'
      order.abnormalRemark = '联名商品同步失败，需企划专员处理'
      order.currentHandler = RoleEnum.PLANNER
      return { success: false, message: '联名商品同步失败，已转企划专员处理' }
    }

    order.status = OrderStatusEnum.CONFIRMED
    order.confirmTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    order.confirmBy = operator.name
    order.currentHandler = RoleEnum.WAREHOUSE

    return { success: true }
  }

  const shipOrder = (orderId: string, operator: User) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== OrderStatusEnum.CONFIRMED) {
      return { success: false, message: '订单状态不正确' }
    }

    if (order.isAbnormal) {
      return { success: false, message: '异常订单需先解除异常' }
    }

    const stockDeducted = productStore.deductLockedStock(
      order.productId,
      order.quantity,
      `兑换发货出库`,
      operator,
      order.orderNo
    )
    if (!stockDeducted) {
      return { success: false, message: '库存扣减失败' }
    }

    order.status = OrderStatusEnum.SHIPPED
    order.shipTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    order.shipBy = operator.name
    order.currentHandler = RoleEnum.STORE_MANAGER

    return { success: true }
  }

  const deliverOrder = (orderId: string, operator: User) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== OrderStatusEnum.SHIPPED) {
      return { success: false, message: '订单状态不正确' }
    }

    if (operator.storeId && order.storeId !== operator.storeId) {
      return { success: false, message: '无权处理其他门店的订单' }
    }

    if (order.isAbnormal) {
      return { success: false, message: '异常订单需先由企划专员解除异常' }
    }

    order.status = OrderStatusEnum.DELIVERED
    order.deliverTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    order.currentHandler = RoleEnum.STORE_MANAGER
    order.verifyCode = generateVerifyCode()

    return { success: true }
  }

  const verifyOrder = (orderId: string, verifyCode: string, operator: User) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== OrderStatusEnum.DELIVERED) {
      return { success: false, message: '订单状态不正确' }
    }

    if (operator.storeId && order.storeId !== operator.storeId) {
      return { success: false, message: '无权核销其他门店的订单' }
    }

    if (order.isAbnormal) {
      return { success: false, message: '异常订单需先由企划专员解除异常' }
    }

    if (order.verifyCode !== verifyCode) {
      return { success: false, message: '核销码错误' }
    }

    const pointsDeducted = memberStore.deductFrozenPoints(
      order.memberId,
      order.totalPoints,
      `兑换${order.productName}`,
      operator,
      order.orderNo
    )
    if (!pointsDeducted) {
      return { success: false, message: '积分扣减失败' }
    }

    order.status = OrderStatusEnum.VERIFIED
    order.verifyTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    order.verifyBy = operator.name
    order.currentHandler = RoleEnum.STORE_MANAGER

    const member = memberStore.getMemberById(order.memberId)
    if (member) {
      member.lastConsumeDate = dayjs().format('YYYY-MM-DD')
    }

    return { success: true }
  }

  const cancelOrder = (orderId: string, reason: string, operator: User) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return { success: false, message: '订单不存在' }

    if (operator.storeId && order.storeId !== operator.storeId && operator.role === RoleEnum.STORE_MANAGER) {
      return { success: false, message: '无权取消其他门店的订单' }
    }

    if (order.status === OrderStatusEnum.PENDING || order.status === OrderStatusEnum.CONFIRMED) {
      memberStore.unfreezePoints(
        order.memberId,
        order.totalPoints,
        `订单取消：${reason}`,
        operator,
        order.orderNo
      )
      productStore.unlockStock(
        order.productId,
        order.quantity,
        `订单取消：${reason}`,
        operator,
        order.orderNo
      )
    }

    order.status = OrderStatusEnum.CANCELLED
    order.cancelTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    order.cancelBy = operator.name
    order.cancelReason = reason

    return { success: true }
  }

  const markAbnormal = (orderId: string, type: string, remark: string, handler?: UserRole) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return { success: false, message: '订单不存在' }

    order.isAbnormal = true
    order.abnormalType = type as any
    order.abnormalRemark = remark
    if (handler) {
      order.currentHandler = handler
    }

    return { success: true }
  }

  const resolveAbnormal = (orderId: string, remark: string, operator: User) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return { success: false, message: '订单不存在' }

    if (order.abnormalType === 'stock_mismatch') {
      const product = productStore.getProductById(order.productId)
      if (!product) return { success: false, message: '关联商品不存在' }
      if (product.availableStock < order.quantity) {
        return { success: false, message: `库存未补足，当前可用库存${product.availableStock}，订单需求${order.quantity}，请先在商品页调整库存` }
      }
    }

    if (order.abnormalType === 'sync_failed') {
      const product = productStore.getProductById(order.productId)
      if (!product) return { success: false, message: '关联商品不存在' }
      if (product.syncStatus !== 'synced') {
        return { success: false, message: '联名商品尚未同步成功，请先在商品页完成同步后再解除异常' }
      }
    }

    order.isAbnormal = false
    order.abnormalType = undefined
    order.abnormalRemark = undefined
    order.remark = `${order.remark || ''} 异常已解除：${remark}，处理人：${operator.name}`

    const statusMap: Record<string, UserRole> = {
      [OrderStatusEnum.PENDING]: RoleEnum.STORE_MANAGER,
      [OrderStatusEnum.CONFIRMED]: RoleEnum.WAREHOUSE,
      [OrderStatusEnum.SHIPPED]: RoleEnum.STORE_MANAGER,
      [OrderStatusEnum.DELIVERED]: RoleEnum.STORE_MANAGER
    }
    order.currentHandler = statusMap[order.status] || RoleEnum.PLANNER

    return { success: true }
  }

  const getIssuesByStore = (storeId?: string) => {
    if (!storeId) return inspectionIssues.value
    return inspectionIssues.value.filter(i => i.storeId === storeId)
  }

  const getMyPendingIssues = (role: UserRole, storeId?: string) => {
    let issues = inspectionIssues.value.filter(i => i.status === 'pending' || i.status === 'processing')
    if (role === RoleEnum.STORE_MANAGER && storeId) {
      issues = issues.filter(i => i.storeId === storeId)
    }
    return issues
  }

  return {
    orders,
    inspectionIssues,
    pendingOrders,
    confirmedOrders,
    shippedOrders,
    abnormalOrders,
    getOrderById,
    getOrdersByStore,
    createOrder,
    confirmOrder,
    shipOrder,
    deliverOrder,
    verifyOrder,
    cancelOrder,
    markAbnormal,
    resolveAbnormal,
    getIssuesByStore,
    getMyPendingIssues
  }
})

export const useDashboardStore = defineStore('dashboard', () => {
  const memberStore = useMemberStore()
  const orderStore = useOrderStore()
  const productStore = useProductStore()

  const stats = computed(() => {
    return {
      totalMembers: memberStore.members.length,
      totalPoints: memberStore.members.reduce((sum, m) => sum + m.totalPoints, 0),
      todayExchanges: orderStore.orders.filter(o => 
        dayjs(o.applyTime).isSame(dayjs(), 'day')
      ).length,
      pendingOrders: orderStore.pendingOrders.length,
      abnormalOrders: orderStore.abnormalOrders.length,
      stockWarnings: productStore.products.filter(p => 
        p.availableStock < 10 || p.syncStatus === 'failed'
      ).length
    }
  })

  const getPointsTrend = () => {
    return [
      { date: '1月6日', earn: 12000, spend: 8000 },
      { date: '1月7日', earn: 15000, spend: 10000 },
      { date: '1月8日', earn: 18000, spend: 12000 },
      { date: '1月9日', earn: 14000, spend: 9000 },
      { date: '1月10日', earn: 20000, spend: 15000 },
      { date: '1月11日', earn: 16000, spend: 11000 },
      { date: '1月12日', earn: 22000, spend: 18000 }
    ]
  }

  const getExchangeByCategory = () => {
    return [
      { name: '文具', value: 45 },
      { name: '周边', value: 30 },
      { name: '茶具', value: 15 },
      { name: '玩具', value: 8 },
      { name: '服饰', value: 2 }
    ]
  }

  return {
    stats,
    getPointsTrend,
    getExchangeByCategory
  }
})

