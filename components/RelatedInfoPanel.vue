<template>
  <div class="card">
    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      关联信息
    </h3>

    <div class="space-y-4">
      <div v-if="relatedBooking" class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors" @click="navigateTo(`/booking/${relatedBooking.id}`)">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">球道预约</span>
          <StatusBadge :status="relatedBooking.status" />
        </div>
        <p class="text-sm font-medium text-gray-900">{{ relatedBooking.bookingNo }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ relatedBooking.customerName }} · {{ relatedBooking.date }} {{ relatedBooking.startTime }}-{{ relatedBooking.endTime }}</p>
      </div>

      <div v-if="relatedPatrol" class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors" @click="navigateTo(`/patrol/${relatedPatrol.id}`)">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">巡场记录</span>
          <StatusBadge :status="relatedPatrol.status" />
        </div>
        <p class="text-sm font-medium text-gray-900">{{ relatedPatrol.patrolNo }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ relatedPatrol.date }} · {{ relatedPatrol.location }}</p>
      </div>

      <div v-if="relatedComplaint" class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors" @click="navigateTo(`/complaint/${relatedComplaint.id}`)">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">客户投诉</span>
          <StatusBadge :status="relatedComplaint.status" />
        </div>
        <p class="text-sm font-medium text-gray-900">{{ relatedComplaint.complaintNo }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ relatedComplaint.title }}</p>
      </div>

      <div v-if="relatedEquipment" class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors" @click="navigateTo(`/equipment/${relatedEquipment.id}`)">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded">器材记录</span>
          <span class="badge" :class="equipmentStatusClass">{{ getEquipmentStatusLabel(relatedEquipment.status) }}</span>
        </div>
        <p class="text-sm font-medium text-gray-900">{{ relatedEquipment.equipmentNo }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ relatedEquipment.name }} · {{ relatedEquipment.brand }}</p>
      </div>

      <div v-if="relatedPrepaidAccount" class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors" @click="navigateTo(`/prepaid/${relatedPrepaidAccount.id}`)">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">储值账户</span>
          <span class="badge" :class="prepaidStatusClass">{{ getPrepaidStatusLabel(relatedPrepaidAccount.status) }}</span>
        </div>
        <p class="text-sm font-medium text-gray-900">{{ relatedPrepaidAccount.accountNo }}</p>
        <p class="text-xs text-gray-500 mt-1">余额: ¥{{ relatedPrepaidAccount.balance.toFixed(2) }}</p>
      </div>

      <div v-if="!hasRelatedData" class="text-center py-8 text-gray-500">
        <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <p class="text-sm">暂无关联数据</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBookingStore } from '~/stores/booking'
import { usePatrolStore } from '~/stores/patrol'
import { useComplaintStore } from '~/stores/complaint'
import { useEquipmentStore } from '~/stores/equipment'
import { usePrepaidStore } from '~/stores/prepaid'
import StatusBadge from './StatusBadge.vue'
import type { EquipmentStatus } from '~/types'

const props = defineProps<{
  bookingId?: string
  patrolId?: string
  complaintId?: string
  equipmentId?: string
  prepaidAccountId?: string
}>()

const bookingStore = useBookingStore()
const patrolStore = usePatrolStore()
const complaintStore = useComplaintStore()
const equipmentStore = useEquipmentStore()
const prepaidStore = usePrepaidStore()

const relatedBooking = computed(() => props.bookingId ? bookingStore.getById(props.bookingId) : null)
const relatedPatrol = computed(() => props.patrolId ? patrolStore.getById(props.patrolId) : null)
const relatedComplaint = computed(() => props.complaintId ? complaintStore.getById(props.complaintId) : null)
const relatedEquipment = computed(() => props.equipmentId ? equipmentStore.getById(props.equipmentId) : null)
const relatedPrepaidAccount = computed(() => props.prepaidAccountId ? prepaidStore.getById(props.prepaidAccountId) : null)

const hasRelatedData = computed(() => {
  return relatedBooking.value || relatedPatrol.value || relatedComplaint.value || relatedEquipment.value || relatedPrepaidAccount.value
})

const equipmentStatusClass = computed(() => {
  if (!relatedEquipment.value) return ''
  const map: Record<EquipmentStatus, string> = {
    available: 'bg-green-100 text-green-800',
    borrowed: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-amber-100 text-amber-800',
    lost: 'bg-red-100 text-red-800',
    damaged: 'bg-red-100 text-red-800'
  }
  return map[relatedEquipment.value.status] || ''
})

const prepaidStatusClass = computed(() => {
  if (!relatedPrepaidAccount.value) return ''
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    frozen: 'bg-amber-100 text-amber-800',
    closed: 'bg-gray-100 text-gray-800'
  }
  return map[relatedPrepaidAccount.value.status] || ''
})

function getEquipmentStatusLabel(status: EquipmentStatus) {
  const map: Record<EquipmentStatus, string> = {
    available: '可借',
    borrowed: '已借出',
    maintenance: '维修中',
    lost: '已遗失',
    damaged: '已损坏'
  }
  return map[status] || status
}

function getPrepaidStatusLabel(status: string) {
  const map: Record<string, string> = {
    active: '正常',
    frozen: '冻结',
    closed: '已销户'
  }
  return map[status] || status
}
</script>
