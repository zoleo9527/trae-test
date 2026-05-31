<template>
  <div class="space-y-6">
    <FilterBar
      :show-category="true"
      :show-assignee="false"
      :category-options="categoryOptions"
      @filter="handleFilter"
      @create="showCreateModal = true"
    >
      <template #actions>新增预约</template>
    </FilterBar>

    <div class="card p-0 overflow-hidden">
      <div class="table-container border-0 rounded-none">
        <table class="table">
          <thead>
            <tr>
              <th>预约编号</th>
              <th>客户</th>
              <th>类型</th>
              <th>日期</th>
              <th>时间</th>
              <th>打位/洞号</th>
              <th>金额</th>
              <th>储值扣减</th>
              <th>支付</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="booking in pagedBookings"
              :key="booking.id"
              class="cursor-pointer"
              @click="navigateTo(`/booking/${booking.id}`)"
            >
              <td class="font-medium text-primary-600">{{ booking.bookingNo }}</td>
              <td>
                <div>
                  <p class="font-medium text-gray-900">{{ booking.customerName }}</p>
                  <p class="text-xs text-gray-500">{{ booking.customerPhone }}</p>
                </div>
              </td>
              <td>
                <span class="badge bg-blue-100 text-blue-800">{{ getBookingTypeLabel(booking.type) }}</span>
              </td>
              <td>{{ commonStore.formatDate(booking.date) }}</td>
              <td>{{ booking.startTime }} - {{ booking.endTime }}</td>
              <td>{{ booking.bayNumber || booking.holeNumber || '--' }}</td>
              <td class="font-medium">¥{{ booking.totalAmount.toFixed(2) }}</td>
              <td class="text-amber-600">¥{{ booking.prepaidDeducted.toFixed(2) }}</td>
              <td>
                <span v-if="booking.paid" class="badge bg-green-100 text-green-800">已支付</span>
                <span v-else class="badge bg-gray-100 text-gray-800">未支付</span>
              </td>
              <td>
                <StatusBadge :status="booking.status" />
              </td>
              <td @click.stop>
                <div class="flex items-center gap-2">
                  <button
                    v-if="booking.status === 'pending' && userStore.hasPermission('booking:confirm')"
                    class="text-sm text-green-600 hover:text-green-700"
                    @click="handleConfirm(booking.id)"
                  >
                    确认
                  </button>
                  <button
                    v-if="booking.status === 'approved' && !booking.checkInTime && userStore.hasPermission('booking:checkin')"
                    class="text-sm text-primary-600 hover:text-primary-700"
                    @click="handleCheckIn(booking.id)"
                  >
                    签到
                  </button>
                  <button
                    v-if="booking.checkInTime && !booking.checkOutTime && userStore.hasPermission('booking:checkout')"
                    class="text-sm text-blue-600 hover:text-blue-700"
                    @click="handleCheckOut(booking.id)"
                  >
                    签退
                  </button>
                  <button
                    class="text-sm text-gray-500 hover:text-gray-700"
                    @click="navigateTo(`/booking/${booking.id}`)"
                  >
                    详情
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-model:page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="filteredBookings.length"
        @change="handlePageChange"
      />
    </div>

    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content p-6 max-w-2xl">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">新增预约</h3>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">客户姓名</label>
              <input v-model="newBooking.customerName" type="text" class="input" placeholder="请输入客户姓名" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
              <input v-model="newBooking.customerPhone" type="tel" class="input" placeholder="请输入联系电话" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">预约类型</label>
              <select v-model="newBooking.type" class="select">
                <option v-for="t in categoryOptions" :key="t.value" :value="t.value">
                  {{ t.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">人数</label>
              <input v-model.number="newBooking.numberOfPeople" type="number" min="1" class="input" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">预约日期</label>
              <input v-model="newBooking.date" type="date" class="input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">打位/洞号</label>
              <input v-model="newBooking.bayNumber" type="text" class="input" placeholder="如: A1, B3" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
              <input v-model="newBooking.startTime" type="time" class="input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
              <input v-model="newBooking.endTime" type="time" class="input" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
              <select v-model="newBooking.paymentMethod" class="select">
                <option value="prepaid">储值卡</option>
                <option value="cash">现金</option>
                <option value="card">刷卡</option>
                <option value="points">积分</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">预约金额</label>
              <input v-model.number="newBooking.totalAmount" type="number" min="0" step="0.01" class="input" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea v-model="newBooking.remark" class="textarea" rows="2" placeholder="可选填写备注..." />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-4 mt-4 border-t">
          <button class="btn btn-secondary" @click="showCreateModal = false">取消</button>
          <button class="btn btn-primary" @click="handleCreate">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useUserStore } from '~/stores/user'
import { useCommonStore } from '~/stores/common'
import { useBookingStore } from '~/stores/booking'
import { useNotificationStore } from '~/stores/notification'
import FilterBar from '~/components/FilterBar.vue'
import StatusBadge from '~/components/StatusBadge.vue'
import Pagination from '~/components/Pagination.vue'
import type { BookingType } from '~/types'

const userStore = useUserStore()
const commonStore = useCommonStore()
const bookingStore = useBookingStore()
const notificationStore = useNotificationStore()

const filters = reactive({
  keyword: '',
  startDate: '',
  endDate: '',
  status: '',
  category: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const showCreateModal = ref(false)

const newBooking = reactive({
  customerName: '',
  customerPhone: '',
  type: 'driving_range' as BookingType,
  numberOfPeople: 1,
  date: new Date().toISOString().split('T')[0],
  bayNumber: '',
  startTime: '09:00',
  endTime: '11:00',
  paymentMethod: 'prepaid' as 'prepaid' | 'cash' | 'card' | 'points',
  totalAmount: 200,
  remark: ''
})

function resetNewBooking() {
  newBooking.customerName = ''
  newBooking.customerPhone = ''
  newBooking.type = 'driving_range'
  newBooking.numberOfPeople = 1
  newBooking.date = new Date().toISOString().split('T')[0]
  newBooking.bayNumber = ''
  newBooking.startTime = '09:00'
  newBooking.endTime = '11:00'
  newBooking.paymentMethod = 'prepaid'
  newBooking.totalAmount = 200
  newBooking.remark = ''
}

function handleCreate() {
  if (!newBooking.customerName.trim()) {
    notificationStore.showToastMessage('error', '请输入客户姓名')
    return
  }
  if (!newBooking.customerPhone.trim()) {
    notificationStore.showToastMessage('error', '请输入联系电话')
    return
  }
  if (!newBooking.date) {
    notificationStore.showToastMessage('error', '请选择预约日期')
    return
  }

  const startTime = new Date(`${newBooking.date}T${newBooking.startTime}`)
  const endTime = new Date(`${newBooking.date}T${newBooking.endTime}`)
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

  const booking = bookingStore.createBooking({
    customerName: newBooking.customerName,
    customerPhone: newBooking.customerPhone,
    type: newBooking.type,
    numberOfPeople: newBooking.numberOfPeople,
    date: newBooking.date,
    bayNumber: newBooking.bayNumber || undefined,
    startTime: newBooking.startTime,
    endTime: newBooking.endTime,
    duration: duration > 0 ? duration : 120,
    paymentMethod: newBooking.paymentMethod,
    totalAmount: newBooking.totalAmount,
    remark: newBooking.remark || undefined,
    fees: [{
      id: `fee-${Date.now()}`,
      name: getBookingTypeLabel(newBooking.type),
      category: 'other' as const,
      amount: newBooking.totalAmount,
      prepaidApplicable: true
    }]
  })

  notificationStore.showToastMessage('success', '预约创建成功')
  showCreateModal.value = false
  resetNewBooking()

  navigateTo(`/booking/${booking.id}`)
}

const categoryOptions = [
  { value: 'driving_range', label: '练习场' },
  { value: 'putting_green', label: '推杆区' },
  { value: 'chipping_area', label: '切杆区' },
  { value: 'lesson', label: '教练课' }
]

const filteredBookings = computed(() => {
  return bookingStore.bookings.filter(booking => {
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      if (!booking.bookingNo.toLowerCase().includes(keyword) &&
          !booking.customerName.toLowerCase().includes(keyword) &&
          !booking.customerPhone.includes(keyword)) {
        return false
      }
    }

    if (filters.startDate && booking.date < filters.startDate) return false
    if (filters.endDate && booking.date > filters.endDate) return false

    if (filters.status && booking.status !== filters.status) return false
    if (filters.category && booking.type !== filters.category) return false

    return true
  }).sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.createdAt.localeCompare(a.createdAt)
  })
})

const pagedBookings = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  return filteredBookings.value.slice(start, start + pagination.pageSize)
})

function handleFilter(newFilters: typeof filters) {
  Object.assign(filters, newFilters)
  pagination.page = 1
}

function handlePageChange() {}

function getBookingTypeLabel(type: BookingType) {
  const map: Record<string, string> = {
    driving_range: '练习场',
    putting_green: '推杆区',
    chipping_area: '切杆区',
    lesson: '教练课'
  }
  return map[type] || type
}

function handleConfirm(id: string) {
  bookingStore.confirmBooking(id)
  notificationStore.showToastMessage('success', '预约已确认')
}

function handleCheckIn(id: string) {
  bookingStore.checkIn(id)
  notificationStore.showToastMessage('success', '客户已签到')
}

function handleCheckOut(id: string) {
  const booking = bookingStore.getById(id)
  if (booking) {
    const unreturnedEquipment = booking.equipmentRentals.filter(r => r.pickedUp && !r.returned)
    if (unreturnedEquipment.length > 0) {
      notificationStore.showToastMessage('warning', `还有 ${unreturnedEquipment.length} 件器材未归还，请先验收器材`)
      return
    }
  }
  bookingStore.checkOut(id)
  notificationStore.showToastMessage('success', '客户已签退')
}
</script>
