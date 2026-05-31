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
