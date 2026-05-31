import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Equipment, FilterOptions, EquipmentCategory, BorrowRecord } from '~/types'
import { mockEquipment } from '~/data/equipment'
import { useCommonStore } from './common'
import { useUserStore } from './user'
import { useNotificationStore } from './notification'

export const useEquipmentStore = defineStore('equipment', () => {
  const equipment = ref<Equipment[]>([...mockEquipment])
  const currentEquipment = ref<Equipment | null>(null)
  const filter = ref<FilterOptions>({})
  const pagination = ref({ page: 1, pageSize: 10, total: 0 })

  const commonStore = useCommonStore()
  const userStore = useUserStore()
  const notificationStore = useNotificationStore()

  const categoryLabelMap: Record<EquipmentCategory, string> = {
    club: '球杆',
    bag: '球包',
    cart: '球车',
    range_finder: '测距仪',
    umbrella: '雨伞',
    other: '其他'
  }

  const conditionLabelMap: Record<string, string> = {
    new: '全新',
    good: '良好',
    fair: '一般',
    poor: '较差',
    damaged: '损坏'
  }

  const statusLabelMap: Record<string, string> = {
    available: '可租借',
    borrowed: '已借出',
    maintenance: '维修中',
    lost: '已遗失',
    damaged: '已损坏'
  }

  const filteredEquipment = computed(() => {
    let result = [...equipment.value]

    if (filter.value.status && filter.value.status.length > 0) {
      result = result.filter(e => filter.value.status!.includes(e.status as any))
    }

    if (filter.value.category && filter.value.category.length > 0) {
      result = result.filter(e => filter.value.category!.includes(e.category as string))
    }

    if (filter.value.keyword) {
      const keyword = filter.value.keyword.toLowerCase()
      result = result.filter(e =>
        e.equipmentNo.toLowerCase().includes(keyword) ||
        e.name.toLowerCase().includes(keyword) ||
        e.brand?.toLowerCase().includes(keyword)
      )
    }

    pagination.value.total = result.length

    const start = (pagination.value.page - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize

    return result
      .sort((a, b) => a.equipmentNo.localeCompare(b.equipmentNo))
      .slice(start, end)
  })

  const availableCount = computed(() => {
    return equipment.value.filter(e => e.status === 'available').length
  })

  const borrowedCount = computed(() => {
    return equipment.value.filter(e => e.status === 'borrowed').length
  })

  const maintenanceCount = computed(() => {
    return equipment.value.filter(e => e.status === 'maintenance').length
  })

  const overdueCount = computed(() => {
    const now = new Date()
    return equipment.value.filter(e => {
      if (e.status !== 'borrowed') return false
      const activeBorrow = e.borrowHistory.find(b => b.status === 'active')
      if (!activeBorrow) return false
      return new Date(activeBorrow.expectedReturnDate) < now
    }).length
  })

  function getCategoryLabel(category: EquipmentCategory): string {
    return categoryLabelMap[category] || category
  }

  function getConditionLabel(condition: string): string {
    return conditionLabelMap[condition] || condition
  }

  function getStatusLabel(status: string): string {
    return statusLabelMap[status] || status
  }

  function getById(id: string): Equipment | undefined {
    return equipment.value.find(e => e.id === id)
  }

  function setCurrentEquipment(id: string) {
    currentEquipment.value = getById(id) || null
  }

  function clearCurrentEquipment() {
    currentEquipment.value = null
  }

  function getAvailableEquipment(category?: EquipmentCategory): Equipment[] {
    return equipment.value.filter(e =>
      e.status === 'available' && (!category || e.category === category)
    )
  }

  function getOverdueEquipment(): Equipment[] {
    const now = new Date()
    return equipment.value.filter(e => {
      if (e.status !== 'borrowed') return false
      const activeBorrow = e.borrowHistory.find(b => b.status === 'active')
      if (!activeBorrow) return false
      return new Date(activeBorrow.expectedReturnDate) < now
    })
  }

  function lendEquipment(
    equipmentId: string,
    borrower: { id: string; name: string; phone: string },
    relatedBookingId?: string,
    relatedBookingNo?: string,
    expectedReturnDate?: string
  ): boolean {
    const equip = getById(equipmentId)
    if (!equip || equip.status !== 'available') return false

    const now = new Date()
    const returnDate = expectedReturnDate || now.toISOString().split('T')[0]

    equip.status = 'borrowed'
    equip.currentBorrowerId = borrower.id
    equip.currentBorrowerName = borrower.name
    equip.currentBookingId = relatedBookingId
    equip.updatedAt = now.toISOString()

    const borrowRecord: BorrowRecord = {
      id: `borrow-${Date.now()}`,
      equipmentId,
      equipmentName: equip.name,
      borrowerId: borrower.id,
      borrowerName: borrower.name,
      borrowerPhone: borrower.phone,
      relatedBookingId,
      relatedBookingNo,
      borrowDate: now.toISOString().split('T')[0],
      expectedReturnDate: returnDate,
      depositPaid: equip.deposit,
      depositReturned: false,
      conditionBefore: equip.condition,
      status: 'active'
    }

    equip.borrowHistory.unshift(borrowRecord)

    commonStore.addRemark(equipmentId, `借出给 ${borrower.name}，预计归还日期：${returnDate}`, true)

    return true
  }

  function returnEquipment(
    equipmentId: string,
    condition: 'new' | 'good' | 'fair' | 'poor' | 'damaged',
    notes?: string
  ): boolean {
    const equip = getById(equipmentId)
    if (!equip || equip.status !== 'borrowed') return false

    const now = new Date()
    const activeBorrow = equip.borrowHistory.find(b => b.status === 'active')

    if (activeBorrow) {
      activeBorrow.status = condition === 'damaged' ? 'overdue' : 'returned'
      activeBorrow.actualReturnDate = now.toISOString().split('T')[0]
      activeBorrow.conditionAfter = condition
      activeBorrow.returnedCheckById = userStore.currentUser!.id
      activeBorrow.returnedCheckByName = userStore.currentUser!.name
      activeBorrow.notes = notes
      activeBorrow.depositReturned = condition === 'good' || condition === 'fair'
    }

    equip.condition = condition
    equip.currentBorrowerId = undefined
    equip.currentBorrowerName = undefined
    equip.currentBookingId = undefined
    equip.updatedAt = now.toISOString()

    if (condition === 'damaged') {
      equip.status = 'maintenance'
      equip.maintenanceRecords.unshift({
        id: `maint-${Date.now()}`,
        equipmentId,
        type: 'repair',
        description: notes || '归还时发现损坏，需要维修',
        operatorId: userStore.currentUser!.id,
        operatorName: userStore.currentUser!.name,
        date: now.toISOString().split('T')[0],
        result: 'pending'
      })

      notificationStore.addNotification({
        type: 'warning',
        title: '器材损坏待维修',
        message: `器材 ${equip.name} (${equip.equipmentNo}) 归还时发现损坏，已安排维修。`,
        relatedId: equipmentId,
        relatedType: 'equipment',
        recipientRole: ['manager', 'coach_supervisor']
      })
    } else {
      equip.status = 'available'
    }

    commonStore.addRemark(equipmentId, `归还，状态：${getConditionLabel(condition)}。${notes || ''}`, true)

    return true
  }

  function updateStatus(equipmentId: string, status: any, remark?: string) {
    const equip = getById(equipmentId)
    if (!equip) return

    equip.status = status
    equip.updatedAt = new Date().toISOString()

    if (remark) {
      commonStore.addRemark(equipmentId, remark, true)
    }
  }

  function addMaintenance(equipmentId: string, type: any, description: string, cost?: number) {
    const equip = getById(equipmentId)
    if (!equip) return

    const maintenanceRecord = {
      id: `maint-${Date.now()}`,
      equipmentId,
      type,
      description,
      cost,
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      date: new Date().toISOString().split('T')[0],
      result: 'pending' as const
    }

    equip.maintenanceRecords.unshift(maintenanceRecord)
    equip.lastMaintenanceDate = new Date().toISOString().split('T')[0]
    equip.updatedAt = new Date().toISOString()

    if (equip.status === 'available') {
      equip.status = 'maintenance'
    }

    commonStore.addRemark(equipmentId, `安排${type === 'repair' ? '维修' : type === 'routine' ? '例行保养' : '检查'}：${description}`, true)
  }

  function completeMaintenance(equipmentId: string, maintenanceId: string, result: string) {
    const equip = getById(equipmentId)
    if (!equip) return

    const maintenance = equip.maintenanceRecords.find(m => m.id === maintenanceId)
    if (maintenance) {
      maintenance.result = 'completed'
      maintenance.description = `${maintenance.description} - 处理结果：${result}`
    }

    if (equip.status === 'maintenance' && equip.condition !== 'damaged' && equip.condition !== 'poor') {
      equip.status = 'available'
    }

    equip.updatedAt = new Date().toISOString()

    commonStore.addRemark(equipmentId, `维修完成：${result}`, true)
  }

  function getBorrowHistory(equipmentId: string): BorrowRecord[] {
    const equip = getById(equipmentId)
    if (!equip) return []

    return [...equip.borrowHistory]
      .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
  }

  function createEquipment(equip: Partial<Equipment>): Equipment {
    const now = new Date()
    const newEquipment: Equipment = {
      id: `equipment-${Date.now()}`,
      equipmentNo: commonStore.generateNo('EQP'),
      name: equip.name || '',
      category: equip.category || 'other',
      brand: equip.brand,
      model: equip.model,
      serialNumber: equip.serialNumber,
      purchaseDate: equip.purchaseDate || now.toISOString().split('T')[0],
      purchasePrice: equip.purchasePrice || 0,
      condition: equip.condition || 'good',
      status: 'available',
      location: equip.location || '器材室',
      rentalFee: equip.rentalFee || 50,
      deposit: equip.deposit || 200,
      notes: equip.notes,
      currentBorrowerId: undefined,
      currentBorrowerName: undefined,
      currentBookingId: undefined,
      lastMaintenanceDate: undefined,
      nextMaintenanceDate: undefined,
      borrowHistory: [],
      maintenanceRecords: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }

    equipment.value.unshift(newEquipment)

    commonStore.addRemark(newEquipment.id, '器材入库', true)

    return newEquipment
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
    equipment,
    currentEquipment,
    filter,
    pagination,
    filteredEquipment,
    availableCount,
    borrowedCount,
    maintenanceCount,
    overdueCount,
    getCategoryLabel,
    getConditionLabel,
    getStatusLabel,
    getById,
    setCurrentEquipment,
    clearCurrentEquipment,
    getAvailableEquipment,
    getOverdueEquipment,
    lendEquipment,
    returnEquipment,
    updateStatus,
    addMaintenance,
    completeMaintenance,
    getBorrowHistory,
    createEquipment,
    setFilter,
    clearFilter,
    setPage
  }
})
