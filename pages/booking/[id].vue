<template>
  <div v-if="booking" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          @click="navigateTo('/booking')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ booking.bookingNo }}</h1>
          <div class="flex items-center gap-2 mt-1">
            <StatusBadge :status="booking.status" />
            <span v-if="booking.paid" class="badge bg-green-100 text-green-800">已支付</span>
            <span v-else class="badge bg-gray-100 text-gray-800">未支付</span>
            <span class="text-sm text-gray-500">{{ commonStore.formatDateTime(booking.createdAt) }} 创建</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="booking.status === 'pending' && userStore.hasPermission('booking:confirm')"
          class="btn btn-primary"
          @click="handleConfirm"
        >
          确认预约
        </button>
        <button
          v-if="booking.status === 'approved' && !booking.checkInTime && userStore.hasPermission('booking:checkin')"
          class="btn btn-primary"
          @click="handleCheckIn"
        >
          签到
        </button>
        <button
          v-if="booking.checkInTime && !booking.checkOutTime && userStore.hasPermission('booking:checkout')"
          class="btn btn-primary"
          @click="handleCheckOut"
        >
          签退
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">客户姓名</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ booking.customerName }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">联系电话</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ booking.customerPhone }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">预约类型</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ getBookingTypeLabel(booking.type) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">人数</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ booking.numberOfPeople }} 人</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">预约日期</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ commonStore.formatDate(booking.date) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">时间段</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ booking.startTime }} - {{ booking.endTime }} ({{ booking.duration }}分钟)</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">打位</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ booking.bayNumber || '未分配' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">洞号</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ booking.holeNumber || '--' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">签到时间</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ booking.checkInTime ? commonStore.formatDateTime(booking.checkInTime) : '--' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">签退时间</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ booking.checkOutTime ? commonStore.formatDateTime(booking.checkOutTime) : '--' }}</p>
            </div>
          </div>
          <div v-if="booking.remark" class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-sm text-gray-500">备注</p>
            <p class="text-sm text-gray-900 mt-1">{{ booking.remark }}</p>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">费用明细</h3>
          <div class="space-y-2 mb-4">
            <div
              v-for="fee in booking.fees"
              :key="fee.id"
              class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">{{ fee.name }}</p>
                <p class="text-xs text-gray-500">{{ getFeeCategoryLabel(fee.category) }}{{ fee.description ? ' · ' + fee.description : '' }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900">¥{{ fee.amount.toFixed(2) }}</p>
                <p v-if="fee.prepaidApplicable" class="text-xs text-amber-600">可使用储值</p>
              </div>
            </div>
          </div>
          <div class="pt-4 border-t border-gray-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600">总金额</span>
              <span class="text-lg font-bold text-gray-900">¥{{ booking.totalAmount.toFixed(2) }}</span>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600">储值扣减</span>
              <span class="text-sm font-medium text-amber-600">-¥{{ booking.prepaidDeducted.toFixed(2) }}</span>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600">支付方式</span>
              <span class="text-sm text-gray-900">{{ getPaymentMethodLabel(booking.paymentMethod) }}</span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-gray-100">
              <span class="text-sm font-medium text-gray-900">实收金额</span>
              <span class="text-lg font-bold text-primary-600">¥{{ (booking.totalAmount - booking.prepaidDeducted).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">租借器材</h3>
            <span class="badge bg-purple-100 text-purple-800">{{ booking.equipmentRentals.length }} 件</span>
          </div>
          <div class="space-y-3">
            <div
              v-for="rental in booking.equipmentRentals"
              :key="rental.id"
              class="p-4 rounded-lg border"
              :class="rental.returned ? 'bg-green-50 border-green-200' : rental.pickedUp ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ rental.equipmentName }}</p>
                  <p class="text-xs text-gray-500">数量: {{ rental.quantity }} · 租金: ¥{{ rental.rentalFee.toFixed(2) }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <span v-if="!rental.pickedUp" class="badge bg-gray-100 text-gray-800">待领取</span>
                  <span v-else-if="!rental.returned" class="badge bg-amber-100 text-amber-800">已借出</span>
                  <span v-else class="badge bg-green-100 text-green-800">已归还</span>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div v-if="rental.pickedUpAt">
                  <span>领取时间: {{ commonStore.formatDateTime(rental.pickedUpAt) }}</span>
                </div>
                <div v-if="rental.returnedAt">
                  <span>归还时间: {{ commonStore.formatDateTime(rental.returnedAt) }}</span>
                </div>
                <div v-if="rental.returnedCondition">
                  <span>归还状态: {{ getReturnConditionLabel(rental.returnedCondition) }}</span>
                </div>
                <div v-if="rental.returnCheckBy">
                  <span>验收人: {{ rental.returnCheckBy }}</span>
                </div>
              </div>
              <div v-if="rental.pickedUp && !rental.returned && userStore.hasPermission('equipment:return')" class="mt-3 pt-3 border-t border-gray-200">
                <button
                  class="btn btn-primary text-sm w-full"
                  @click="showReturnModal(rental)"
                >
                  归还验收
                </button>
              </div>
            </div>
            <div v-if="booking.equipmentRentals.length === 0" class="text-center py-8 text-gray-500">
              暂无租借器材
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">状态流转</h3>
          <StatusTimeline :items="statusHistory" />
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">备注记录</h3>
            <button
              v-if="userStore.hasPermission('booking:remark')"
              class="btn btn-primary text-sm"
              @click="showRemarkModal = true"
            >
              添加备注
            </button>
          </div>
          <RemarkList :items="remarks" />
        </div>
      </div>

      <div class="space-y-6">
        <RelatedInfoPanel
          :prepaid-account-id="prepaidAccountId"
          :complaint-id="relatedComplaintId"
        />

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">储值账户</h3>
          <div v-if="prepaidAccount" class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">账户编号</span>
              <span class="text-sm font-medium text-gray-900 cursor-pointer hover:text-primary-600" @click="navigateTo(`/prepaid/${prepaidAccount.id}`)">
                {{ prepaidAccount.accountNo }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">会员等级</span>
              <span class="badge" :class="getMemberLevelClass(prepaidAccount.level)">
                {{ getMemberLevelLabel(prepaidAccount.level) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">账户余额</span>
              <span class="text-sm font-bold text-amber-600">¥{{ prepaidAccount.balance.toFixed(2) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">折扣率</span>
              <span class="text-sm font-medium text-gray-900">{{ (prepaidAccount.discountRate * 10).toFixed(1) }}折</span>
            </div>
            <div class="mt-4 p-3 bg-amber-50 rounded-lg">
              <p class="text-sm font-medium text-amber-800">本次储值消费明细</p>
              <p class="text-xs text-amber-700 mt-1">{{ consumptionDetail }}</p>
            </div>
          </div>
          <div v-else class="text-center py-4 text-gray-500 text-sm">
            该客户暂无储值账户
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">操作人</h3>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span class="text-primary-700 font-semibold">{{ booking.operatorName.charAt(0) }}</span>
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ booking.operatorName }}</p>
              <p class="text-sm text-gray-500">前台</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showReturnModalFlag" class="modal-overlay" @click.self="showReturnModalFlag = false">
      <div class="modal-content p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">器材归还验收</h3>
        <div class="mb-4">
          <p class="text-sm font-medium text-gray-900 mb-2">{{ selectedRental?.equipmentName }}</p>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">归还状态</label>
          <select v-model="returnCondition" class="select">
            <option value="good">完好</option>
            <option value="damaged">损坏</option>
            <option value="missing">遗失</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">验收备注</label>
          <textarea
            v-model="returnRemark"
            class="textarea"
            rows="3"
            placeholder="请输入验收备注..."
          ></textarea>
        </div>
        <div class="flex justify-end gap-3">
          <button class="btn btn-secondary" @click="showReturnModalFlag = false">取消</button>
          <button class="btn btn-primary" @click="confirmReturn">确认归还</button>
        </div>
      </div>
    </div>

    <div v-if="showRemarkModal" class="modal-overlay" @click.self="showRemarkModal = false">
      <div class="modal-content p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">添加备注</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">备注内容</label>
          <textarea
            v-model="newRemark"
            class="textarea"
            rows="4"
            placeholder="请输入备注内容..."
          ></textarea>
        </div>
        <div class="mb-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="isInternalRemark" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span class="text-sm text-gray-700">设为内部备注</span>
          </label>
        </div>
        <div class="flex justify-end gap-3">
          <button class="btn btn-secondary" @click="showRemarkModal = false">取消</button>
          <button class="btn btn-primary" @click="addRemark">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '~/stores/user'
import { useCommonStore } from '~/stores/common'
import { useBookingStore } from '~/stores/booking'
import { usePrepaidStore } from '~/stores/prepaid'
import { useComplaintStore } from '~/stores/complaint'
import { useNotificationStore } from '~/stores/notification'
import StatusBadge from '~/components/StatusBadge.vue'
import StatusTimeline from '~/components/StatusTimeline.vue'
import RemarkList from '~/components/RemarkList.vue'
import RelatedInfoPanel from '~/components/RelatedInfoPanel.vue'
import type { BookingType, PaymentMethod, EquipmentRental } from '~/types'

const route = useRoute()
const userStore = useUserStore()
const commonStore = useCommonStore()
const bookingStore = useBookingStore()
const prepaidStore = usePrepaidStore()
const complaintStore = useComplaintStore()
const notificationStore = useNotificationStore()

const booking = computed(() => bookingStore.getById(route.params.id as string))

const statusHistory = computed(() => {
  if (!booking.value) return []
  return commonStore.getStatusHistory(booking.value.id)
})

const remarks = computed(() => {
  if (!booking.value) return []
  return commonStore.getRemarks(booking.value.id)
})

const prepaidAccount = computed(() => {
  if (!booking.value) return null
  return prepaidStore.accounts.find(a => a.customerId === booking.value!.customerId)
})

const prepaidAccountId = computed(() => prepaidAccount.value?.id)

const relatedComplaintId = computed(() => {
  if (!booking.value) return undefined
  const complaint = complaintStore.complaints.find(c => c.relatedBookingId === booking.value!.id)
  return complaint?.id
})

const consumptionDetail = computed(() => {
  if (!booking.value) return ''
  const applicableFees = booking.value.fees.filter(f => f.prepaidApplicable)
  const detail = applicableFees.map(f => `${f.name}:¥${f.amount.toFixed(2)}`).join('、')
  if (prepaidAccount.value) {
    return `${detail}，享受${(prepaidAccount.value.discountRate * 10).toFixed(1)}折优惠，实扣¥${booking.value.prepaidDeducted.toFixed(2)}`
  }
  return detail
})

const showReturnModalFlag = ref(false)
const showRemarkModal = ref(false)
const selectedRental = ref<EquipmentRental | null>(null)
const returnCondition = ref<'good' | 'damaged' | 'missing'>('good')
const returnRemark = ref('')
const newRemark = ref('')
const isInternalRemark = ref(false)

function getBookingTypeLabel(type: BookingType) {
  const map: Record<string, string> = {
    driving_range: '练习场',
    putting_green: '推杆区',
    chipping_area: '切杆区',
    lesson: '教练课'
  }
  return map[type] || type
}

function getFeeCategoryLabel(category: string) {
  const map: Record<string, string> = {
    green_fee: '果岭费',
    range_ball: '球费',
    rental: '租赁费',
    lesson: '教练费',
    other: '其他'
  }
  return map[category] || category
}

function getPaymentMethodLabel(method: PaymentMethod) {
  const map: Record<string, string> = {
    prepaid: '储值',
    cash: '现金',
    card: '刷卡',
    points: '积分'
  }
  return map[method] || method
}

function getReturnConditionLabel(condition: string) {
  const map: Record<string, string> = {
    good: '完好',
    damaged: '损坏',
    missing: '遗失'
  }
  return map[condition] || condition
}

function getMemberLevelLabel(level: string) {
  const map: Record<string, string> = {
    normal: '普通会员',
    silver: '银卡会员',
    gold: '金卡会员',
    platinum: '铂金会员'
  }
  return map[level] || level
}

function getMemberLevelClass(level: string) {
  const map: Record<string, string> = {
    normal: 'bg-gray-100 text-gray-800',
    silver: 'bg-gray-300 text-gray-800',
    gold: 'bg-amber-100 text-amber-800',
    platinum: 'bg-purple-100 text-purple-800'
  }
  return map[level] || ''
}

function handleConfirm() {
  if (booking.value) {
    bookingStore.confirmBooking(booking.value.id)
    notificationStore.showToastMessage('success', '预约已确认')
  }
}

function handleCheckIn() {
  if (booking.value) {
    bookingStore.checkIn(booking.value.id)
    notificationStore.showToastMessage('success', '客户已签到')
  }
}

function handleCheckOut() {
  if (booking.value) {
    const unreturnedEquipment = booking.value.equipmentRentals.filter(r => r.pickedUp && !r.returned)
    if (unreturnedEquipment.length > 0) {
      notificationStore.showToastMessage('warning', `还有 ${unreturnedEquipment.length} 件器材未归还，请先验收器材`)
      return
    }
    bookingStore.checkOut(booking.value.id)
    notificationStore.showToastMessage('success', '客户已签退')
  }
}

function showReturnModal(rental: EquipmentRental) {
  selectedRental.value = rental
  returnCondition.value = 'good'
  returnRemark.value = ''
  showReturnModalFlag.value = true
}

function confirmReturn() {
  if (booking.value && selectedRental.value) {
    bookingStore.markEquipmentReturned(
      booking.value.id,
      selectedRental.value.id,
      returnCondition.value
    )
    notificationStore.showToastMessage('success', '器材归还验收完成')
    showReturnModalFlag.value = false
  }
}

function addRemark() {
  if (booking.value && newRemark.value.trim()) {
    commonStore.addRemark(
      booking.value.id,
      newRemark.value.trim(),
      isInternalRemark.value
    )
    notificationStore.showToastMessage('success', '备注添加成功')
    showRemarkModal.value = false
    newRemark.value = ''
    isInternalRemark.value = false
  }
}
</script>
