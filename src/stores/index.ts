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

  const addPoints = (memberId: string, amount: number, source: string, remark: string, operator: User) => {
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
      remark,
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
    addPoints
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

  return {
    products,
    inventoryLogs,
    onShelfProducts,
    coBrandedProducts,
    syncFailedProducts,
    getProductById,
    updateProductStatus,
    adjustStock
  }
})

export const useOrderStore = defineStore('order', () => {
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
      currentHandler: RoleEnum.STORE_MANAGER,
      isAbnormal: product.availableStock < quantity,
      abnormalType: product.availableStock < quantity ? 'stock_mismatch' : undefined,
      abnormalRemark: product.availableStock < quantity ? '库存不足，需确认' : undefined
    }
    
    orders.value.unshift(order)
    return order
  }

  const confirmOrder = (orderId: string, operator: User) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== OrderStatusEnum.PENDING) return false

    order.status = OrderStatusEnum.CONFIRMED
    order.confirmTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    order.confirmBy = operator.name
    order.currentHandler = RoleEnum.WAREHOUSE
    order.isAbnormal = false
    order.abnormalType = undefined
    order.abnormalRemark = undefined

    return true
  }

  const shipOrder = (orderId: string, operator: User) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== OrderStatusEnum.CONFIRMED) return false

    order.status = OrderStatusEnum.SHIPPED
    order.shipTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    order.shipBy = operator.name
    order.currentHandler = RoleEnum.STORE_MANAGER

    return true
  }

  const deliverOrder = (orderId: string, operator: User) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== OrderStatusEnum.SHIPPED) return false

    order.status = OrderStatusEnum.DELIVERED
    order.deliverTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    order.currentHandler = RoleEnum.STORE_MANAGER
    order.verifyCode = generateVerifyCode()

    return true
  }

  const verifyOrder = (orderId: string, verifyCode: string, operator: User) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status !== OrderStatusEnum.DELIVERED) return false
    if (order.verifyCode !== verifyCode) return false

    order.status = OrderStatusEnum.VERIFIED
    order.verifyTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    order.verifyBy = operator.name

    return true
  }

  const cancelOrder = (orderId: string, reason: string, operator: User) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return false

    order.status = OrderStatusEnum.CANCELLED
    order.cancelTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    order.cancelBy = operator.name
    order.cancelReason = reason

    return true
  }

  const markAbnormal = (orderId: string, type: string, remark: string) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return false

    order.isAbnormal = true
    order.abnormalType = type as any
    order.abnormalRemark = remark

    return true
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
    getIssuesByStore,
    getMyPendingIssues
  }
})

export const useDashboardStore = defineStore('dashboard', () => {
  const getStats = () => {
    const memberStore = useMemberStore()
    const orderStore = useOrderStore()
    const productStore = useProductStore()

    return {
      totalMembers: memberStore.members.length,
      totalPoints: memberStore.members.reduce((sum, m) => sum + m.totalPoints, 0),
      todayExchanges: orderStore.orders.filter(o => 
        dayjs(o.applyTime).isSame(dayjs(), 'day')
      ).length,
      pendingOrders: orderStore.pendingOrders.value.length,
      abnormalOrders: orderStore.abnormalOrders.value.length,
      stockWarnings: productStore.products.filter(p => 
        p.availableStock < 10 || p.syncStatus === 'failed'
      ).length
    }
  }

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
    getStats,
    getPointsTrend,
    getExchangeByCategory
  }
})
