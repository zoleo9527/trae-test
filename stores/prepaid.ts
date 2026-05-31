import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PrepaidAccount, FilterOptions } from '~/types'
import { mockPrepaidAccounts } from '~/data/prepaid'
import { demoCustomerPrepaid } from '~/data/demo-prepaid'
import { useCommonStore } from './common'
import { useUserStore } from './user'
import { useNotificationStore } from './notification'

export const usePrepaidStore = defineStore('prepaid', () => {
  const accounts = ref<PrepaidAccount[]>([...demoCustomerPrepaid, ...mockPrepaidAccounts])
  const currentAccount = ref<PrepaidAccount | null>(null)
  const filter = ref<FilterOptions>({})
  const pagination = ref({ page: 1, pageSize: 10, total: 0 })

  const commonStore = useCommonStore()
  const userStore = useUserStore()
  const notificationStore = useNotificationStore()

  const levelLabelMap: Record<string, string> = {
    normal: '普通',
    silver: '银卡',
    gold: '金卡',
    platinum: '铂金'
  }

  const transactionTypeLabelMap: Record<string, string> = {
    recharge: '充值',
    consume: '消费',
    refund: '退款',
    adjust: '调整',
    freeze: '冻结',
    unfreeze: '解冻'
  }

  const filteredAccounts = computed(() => {
    let result = [...accounts.value]

    if (filter.value.keyword) {
      const keyword = filter.value.keyword.toLowerCase()
      result = result.filter(a =>
        a.accountNo.toLowerCase().includes(keyword) ||
        a.customerName.toLowerCase().includes(keyword) ||
        a.customerPhone.includes(keyword)
      )
    }

    if (filter.value.category && filter.value.category.length > 0) {
      result = result.filter(a => filter.value.category!.includes(a.level))
    }

    pagination.value.total = result.length

    const start = (pagination.value.page - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize

    return result
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(start, end)
  })

  const totalBalance = computed(() => {
    return accounts.value.reduce((sum, a) => sum + a.balance, 0)
  })

  const activeCount = computed(() => {
    return accounts.value.filter(a => a.status === 'active').length
  })

  function getLevelLabel(level: string): string {
    return levelLabelMap[level] || level
  }

  function getTransactionTypeLabel(type: string): string {
    return transactionTypeLabelMap[type] || type
  }

  function getById(id: string): PrepaidAccount | undefined {
    return accounts.value.find(a => a.id === id)
  }

  function getByCustomerId(customerId: string): PrepaidAccount | undefined {
    return accounts.value.find(a => a.customerId === customerId)
  }

  function getByCustomerPhone(phone: string): PrepaidAccount | undefined {
    return accounts.value.find(a => a.customerPhone === phone)
  }

  function setCurrentAccount(id: string) {
    currentAccount.value = getById(id) || null
  }

  function clearCurrentAccount() {
    currentAccount.value = null
  }

  function consume(
    accountId: string,
    amount: number,
    relatedBookingId?: string,
    relatedBookingNo?: string,
    consumptionDetail?: string
  ): boolean {
    const account = getById(accountId)
    if (!account || account.balance < amount) return false

    const balanceBefore = account.balance
    account.balance -= amount
    account.totalConsumed += amount
    account.updatedAt = new Date().toISOString()

    const transaction = {
      id: `tx-${Date.now()}`,
      transactionNo: commonStore.generateNo('TX'),
      accountId,
      type: 'consume' as const,
      amount: -amount,
      balanceBefore,
      balanceAfter: account.balance,
      relatedBookingId,
      relatedBookingNo,
      consumptionDetail,
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      createdAt: new Date().toISOString()
    }

    account.transactions.unshift(transaction)

    commonStore.addRemark(accountId, `消费：${commonStore.formatMoney(amount)}，${consumptionDetail || ''}`, true)

    return true
  }

  function recharge(
    accountId: string,
    amount: number,
    remark?: string
  ): boolean {
    const account = getById(accountId)
    if (!account) return false

    const balanceBefore = account.balance
    account.balance += amount
    account.totalRecharged += amount
    account.updatedAt = new Date().toISOString()

    const bonusPoints = Math.floor(amount / 10)
    account.pointBalance += bonusPoints

    let newLevel = account.level
    let newDiscountRate = account.discountRate
    if (account.totalRecharged >= 100000) {
      newLevel = 'platinum'
      newDiscountRate = 0.85
    } else if (account.totalRecharged >= 50000) {
      newLevel = 'gold'
      newDiscountRate = 0.85
    } else if (account.totalRecharged >= 10000) {
      newLevel = 'silver'
      newDiscountRate = 0.9
    }

    if (newLevel !== account.level) {
      account.level = newLevel as any
      account.discountRate = newDiscountRate
      remark = `${remark || ''} 升级为${getLevelLabel(newLevel)}会员，享受${(newDiscountRate * 10).toFixed(0)}折优惠。`
    }

    const transaction = {
      id: `tx-${Date.now()}`,
      transactionNo: commonStore.generateNo('TX'),
      accountId,
      type: 'recharge' as const,
      amount,
      balanceBefore,
      balanceAfter: account.balance,
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      remark,
      createdAt: new Date().toISOString()
    }

    account.transactions.unshift(transaction)

    commonStore.addRemark(accountId, `充值：${commonStore.formatMoney(amount)}，赠送积分${bonusPoints}分。${remark || ''}`, true)

    if (amount >= 10000) {
      notificationStore.addNotification({
        type: 'info',
        title: '大额充值提醒',
        message: `客户${account.customerName}充值${commonStore.formatMoney(amount)}。`,
        relatedId: accountId,
        relatedType: 'prepaid',
        recipientRole: ['manager']
      })
    }

    return true
  }

  function refund(
    accountId: string,
    amount: number,
    relatedBookingId?: string,
    relatedBookingNo?: string,
    remark?: string
  ): boolean {
    const account = getById(accountId)
    if (!account) return false

    const balanceBefore = account.balance
    account.balance += amount
    account.totalConsumed -= amount
    account.updatedAt = new Date().toISOString()

    const transaction = {
      id: `tx-${Date.now()}`,
      transactionNo: commonStore.generateNo('TX'),
      accountId,
      type: 'refund' as const,
      amount,
      balanceBefore,
      balanceAfter: account.balance,
      relatedBookingId,
      relatedBookingNo,
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      remark,
      createdAt: new Date().toISOString()
    }

    account.transactions.unshift(transaction)

    commonStore.addRemark(accountId, `退款：${commonStore.formatMoney(amount)}，${remark || ''}`, true)

    return true
  }

  function adjust(
    accountId: string,
    amount: number,
    remark: string
  ): boolean {
    const account = getById(accountId)
    if (!account) return false

    const balanceBefore = account.balance
    account.balance += amount
    account.updatedAt = new Date().toISOString()

    if (amount > 0) {
      account.totalRecharged += amount
    } else {
      account.totalConsumed -= amount
    }

    const transaction = {
      id: `tx-${Date.now()}`,
      transactionNo: commonStore.generateNo('TX'),
      accountId,
      type: 'adjust' as const,
      amount,
      balanceBefore,
      balanceAfter: account.balance,
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      remark,
      createdAt: new Date().toISOString()
    }

    account.transactions.unshift(transaction)

    commonStore.addRemark(accountId, `余额调整：${amount > 0 ? '+' : ''}${commonStore.formatMoney(amount)}，原因：${remark}`, true)

    return true
  }

  function createAccount(
    customer: { id: string; name: string; phone: string },
    initialRecharge: number = 0,
    level: 'normal' | 'silver' | 'gold' | 'platinum' = 'normal'
  ): PrepaidAccount {
    const now = new Date()
    
    const discountRates: Record<string, number> = {
      normal: 1,
      silver: 0.9,
      gold: 0.85,
      platinum: 0.85
    }

    const newAccount: PrepaidAccount = {
      id: `prepaid-${Date.now()}`,
      accountNo: commonStore.generateNo('ACC'),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      balance: initialRecharge,
      totalRecharged: initialRecharge,
      totalConsumed: 0,
      frozenAmount: 0,
      status: 'active',
      level,
      discountRate: discountRates[level],
      pointBalance: initialRecharge > 0 ? Math.floor(initialRecharge / 10) : 0,
      transactions: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }

    accounts.value.unshift(newAccount)

    commonStore.addStatusHistory({
      recordId: newAccount.id,
      fromStatus: null,
      toStatus: 'approved',
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      remark: '账户创建成功'
    })

    if (initialRecharge > 0) {
      const transaction = {
        id: `tx-${Date.now()}`,
        transactionNo: commonStore.generateNo('TX'),
        accountId: newAccount.id,
        type: 'recharge' as const,
        amount: initialRecharge,
        balanceBefore: 0,
        balanceAfter: initialRecharge,
        operatorId: userStore.currentUser!.id,
        operatorName: userStore.currentUser!.name,
        remark: '开户初始充值',
        createdAt: new Date().toISOString()
      }
      newAccount.transactions.push(transaction)
    }

    return newAccount
  }

  function getTransactions(accountId: string, limit?: number) {
    const account = getById(accountId)
    if (!account) return []

    let transactions = [...account.transactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    if (limit) {
      transactions = transactions.slice(0, limit)
    }

    return transactions
  }

  function setFilter(newFilter: Partial<FilterOptions>) {
    filter.value = { ...filter.value, ...newFilter }
    pagination.value.page = 1
  }

  function clearFilter() {
    filter.value = {}
    pagination.value.page = 1
  }

  function setPage(page: number) {
    pagination.value.page = page
  }

  return {
    accounts,
    currentAccount,
    filter,
    pagination,
    filteredAccounts,
    totalBalance,
    activeCount,
    getLevelLabel,
    getTransactionTypeLabel,
    getById,
    getByCustomerId,
    getByCustomerPhone,
    setCurrentAccount,
    clearCurrentAccount,
    consume,
    recharge,
    refund,
    adjust,
    createAccount,
    getTransactions,
    setFilter,
    clearFilter,
    setPage
  }
})
