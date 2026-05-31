import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Booking, RecordStatus, FilterOptions, BookingType } from '~/types'
import { mockBookings } from '~/data/bookings'
import { useCommonStore } from './common'
import { useUserStore } from './user'
import { useNotificationStore } from './notification'
import { usePrepaidStore } from './prepaid'

export const useBookingStore = defineStore('booking', () => {
  const bookings = ref<Booking[]>([...mockBookings])
  const currentBooking = ref<Booking | null>(null)
  const filter = ref<FilterOptions>({})
  const pagination = ref({ page: 1, pageSize: 10, total: 0 })

  const commonStore = useCommonStore()
  const userStore = useUserStore()
  const notificationStore = useNotificationStore()
  const prepaidStore = usePrepaidStore()

  const typeLabelMap: Record<BookingType, string> = {
    driving_range: '练习场',
    putting_green: '果岭练习',
    chipping_area: '切杆区',
    lesson: '教练课程'
  }

  const filteredBookings = computed(() => {
    let result = [...bookings.value]

    if (filter.value.status && filter.value.status.length > 0) {
      result = result.filter(b => filter.value.status!.includes(b.status))
    }

    if (filter.value.keyword) {
      const keyword = filter.value.keyword.toLowerCase()
      result = result.filter(b =>
        b.bookingNo.toLowerCase().includes(keyword) ||
        b.customerName.toLowerCase().includes(keyword) ||
        b.bayNumber?.toLowerCase().includes(keyword)
      )
    }

    if (filter.value.dateRange && filter.value.dateRange.length === 2) {
      const [start, end] = filter.value.dateRange
      result = result.filter(b => b.date >= start && b.date <= end)
    }

    pagination.value.total = result.length

    const start = (pagination.value.page - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize

    return result
      .sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
        if (dateCompare !== 0) return dateCompare
        return a.startTime.localeCompare(b.startTime)
      })
      .slice(start, end)
  })

  const todayCount = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return bookings.value.filter(b => b.date === today).length
  })

  const pendingCount = computed(() => {
    return bookings.value.filter(b => b.status === 'pending').length
  })

  function getTypeLabel(type: BookingType): string {
    return typeLabelMap[type] || type
  }

  function getById(id: string): Booking | undefined {
    return bookings.value.find(b => b.id === id)
  }

  function getByDate(date: string): Booking[] {
    return bookings.value.filter(b => b.date === date)
  }

  function setCurrentBooking(id: string) {
    currentBooking.value = getById(id) || null
  }

  function clearCurrentBooking() {
    currentBooking.value = null
  }

  function updateStatus(id: string, newStatus: RecordStatus, remark?: string) {
    const booking = getById(id)
    if (!booking) return

    const oldStatus = booking.status
    booking.status = newStatus
    booking.updatedAt = new Date().toISOString()

    commonStore.addStatusHistory({
      recordId: id,
      fromStatus: oldStatus,
      toStatus: newStatus,
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      remark
    })
  }

  function checkIn(id: string) {
    const booking = getById(id)
    if (!booking) return

    booking.checkInTime = new Date().toISOString()
    booking.updatedAt = new Date().toISOString()

    addTimeline(id, '客户已到场签到')
  }

  function checkOut(id: string) {
    const booking = getById(id)
    if (!booking) return

    booking.checkOutTime = new Date().toISOString()
    booking.updatedAt = new Date().toISOString()

    updateStatus(id, 'completed', '客户已离场，结算完成')
    addTimeline(id, '客户已离场，结算完成')

    const unreturnedEquipment = booking.equipmentRentals.filter(r => r.pickedUp && !r.returned)
    if (unreturnedEquipment.length > 0) {
      notificationStore.addNotification({
        type: 'warning',
        title: '器材待归还',
        message: `预订 ${booking.bookingNo} 的客户已离场，但还有 ${unreturnedEquipment.length} 件器材未归还。`,
        relatedId: id,
        relatedType: 'booking',
        recipientRole: ['reception', 'manager']
      })
    }
  }

  function addTimeline(id: string, description: string) {
    commonStore.addRemark(id, description, false)
  }

  function createBooking(booking: Partial<Booking>): Booking {
    const now = new Date()
    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      bookingNo: commonStore.generateNo('BK'),
      customerId: booking.customerId || '',
      customerName: booking.customerName || '',
      customerPhone: booking.customerPhone || '',
      type: booking.type || 'driving_range',
      bayNumber: booking.bayNumber,
      holeNumber: booking.holeNumber,
      date: booking.date || now.toISOString().split('T')[0],
      startTime: booking.startTime || '09:00',
      endTime: booking.endTime || '11:00',
      duration: booking.duration || 120,
      status: 'pending',
      numberOfPeople: booking.numberOfPeople || 1,
      equipmentRentals: booking.equipmentRentals || [],
      fees: booking.fees || [],
      totalAmount: booking.totalAmount || 0,
      prepaidDeducted: 0,
      paymentMethod: booking.paymentMethod || 'prepaid',
      paid: false,
      checkInTime: undefined,
      checkOutTime: undefined,
      noShow: false,
      remark: booking.remark,
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }

    bookings.value.unshift(newBooking)

    commonStore.addStatusHistory({
      recordId: newBooking.id,
      fromStatus: null,
      toStatus: 'pending',
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      remark: '预约创建，等待支付'
    })

    return newBooking
  }

  async function confirmBooking(id: string) {
    const booking = getById(id)
    if (!booking) return

    if (booking.paymentMethod === 'prepaid' && !booking.paid) {
      const customerAccount = prepaidStore.getByCustomerId(booking.customerId)
      if (customerAccount) {
        const discountedAmount = booking.totalAmount * customerAccount.discountRate
        const success = prepaidStore.consume(
          customerAccount.id,
          discountedAmount,
          booking.id,
          booking.bookingNo,
          booking.fees.map(f => `${f.name}:${f.amount}`).join(' + ')
        )

        if (success) {
          booking.prepaidDeducted = discountedAmount
          booking.paid = true
          updateStatus(id, 'approved', '储值卡扣款成功，预约确认')

          if (customerAccount.balance < 1000) {
            notificationStore.addNotification({
              type: 'info',
              title: '储值余额不足提醒',
              message: `客户${booking.customerName}的储值账户余额已不足1000元，请提醒充值。`,
              relatedId: customerAccount.id,
              relatedType: 'prepaid',
              recipientRole: ['reception', 'manager']
            })
          }

          if (booking.totalAmount > 500) {
            notificationStore.addNotification({
              type: 'info',
              title: '大额消费提醒',
              message: `${customerAccount.level === 'platinum' ? '铂金' : customerAccount.level === 'gold' ? '金' : '银'}卡会员${booking.customerName}消费${commonStore.formatMoney(discountedAmount)}。`,
              relatedId: customerAccount.id,
              relatedType: 'prepaid',
              recipientRole: ['manager']
            })
          }
        }
      }
    } else {
      booking.paid = true
      updateStatus(id, 'approved', '支付成功，预约确认')
    }
  }

  function cancelBooking(id: string, reason?: string) {
    const booking = getById(id)
    if (!booking) return

    if (booking.paid && booking.prepaidDeducted > 0) {
      const customerAccount = prepaidStore.getByCustomerId(booking.customerId)
      if (customerAccount) {
        prepaidStore.refund(
          customerAccount.id,
          booking.prepaidDeducted,
          booking.id,
          booking.bookingNo,
          reason || '预约取消退款'
        )
      }
    }

    updateStatus(id, 'rejected', reason || '预约已取消')
  }

  function markEquipmentPickedUp(bookingId: string, rentalId: string) {
    const booking = getById(bookingId)
    if (!booking) return

    const rental = booking.equipmentRentals.find(r => r.id === rentalId)
    if (rental) {
      rental.pickedUp = true
      rental.pickedUpAt = new Date().toISOString()
      booking.updatedAt = new Date().toISOString()

      addTimeline(bookingId, `已领取器材：${rental.equipmentName}`)
    }
  }

  function markEquipmentReturned(bookingId: string, rentalId: string, condition: 'good' | 'damaged' | 'missing') {
    const booking = getById(bookingId)
    if (!booking) return

    const rental = booking.equipmentRentals.find(r => r.id === rentalId)
    if (rental) {
      rental.returned = true
      rental.returnedAt = new Date().toISOString()
      rental.returnedCondition = condition
      rental.returnCheckBy = userStore.currentUser!.name
      booking.updatedAt = new Date().toISOString()

      addTimeline(bookingId, `归还器材：${rental.equipmentName}，状态：${condition === 'good' ? '完好' : condition === 'damaged' ? '损坏' : '遗失'}`)

      if (condition !== 'good') {
        notificationStore.addNotification({
          type: 'warning',
          title: '器材归还异常',
          message: `器材 ${rental.equipmentName} 归还时状态为${condition === 'damaged' ? '损坏' : '遗失'}，请处理。`,
          relatedId: bookingId,
          relatedType: 'equipment',
          recipientRole: ['manager', 'coach_supervisor']
        })
      }
    }
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
    bookings,
    currentBooking,
    filter,
    pagination,
    filteredBookings,
    todayCount,
    pendingCount,
    getTypeLabel,
    getById,
    getByDate,
    setCurrentBooking,
    clearCurrentBooking,
    updateStatus,
    checkIn,
    checkOut,
    createBooking,
    confirmBooking,
    cancelBooking,
    markEquipmentPickedUp,
    markEquipmentReturned,
    setFilter,
    clearFilter,
    setPage
  }
})
