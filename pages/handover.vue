<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="flex gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-all',
              activeTab === tab.value
                ? 'bg-gold-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            ]"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
      <BaseButton @click="showCreateModal = true">
        <Plus class="w-4 h-4 mr-2" />
        新建交接
      </BaseButton>
    </div>

    <BaseCard>
      <template #header>
        <h3 class="font-semibold text-gray-800">交接记录</h3>
      </template>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">时间</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">订单号</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">类型</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">交接双方</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">货品</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">留痕</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">备注</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="record in filteredRecords"
              :key="record.id"
              class="border-b border-gray-50 hover:bg-gold-50/50 transition-colors"
            >
              <td class="py-4 px-4">
                <p class="text-sm font-medium text-gray-800">{{ formatDate(record.timestamp) }}</p>
                <p class="text-xs text-gray-400">{{ formatTime(record.timestamp) }}</p>
              </td>
              <td class="py-4 px-4">
                <span class="text-sm font-medium text-gray-800">{{ record.orderId }}</span>
              </td>
              <td class="py-4 px-4">
                <span :class="['status-badge', getHandoverTypeClass(record.type)]">
                  {{ getHandoverTypeLabel(record.type) }}
                </span>
              </td>
              <td class="py-4 px-4">
                <div class="flex items-center gap-2 text-sm">
                  <span class="text-gray-600">{{ record.fromParty }}</span>
                  <ArrowRight class="w-4 h-4 text-gray-400" />
                  <span class="text-gray-800 font-medium">{{ record.toParty }}</span>
                </div>
              </td>
              <td class="py-4 px-4">
                <div v-for="(item, idx) in record.items" :key="idx" class="text-sm">
                  <span class="text-gray-800">{{ item.name }}</span>
                  <span class="text-gray-400 ml-1">x{{ item.quantity }}</span>
                </div>
              </td>
              <td class="py-4 px-4">
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1 text-sm text-gray-500">
                    <Camera class="w-4 h-4" />
                    {{ record.photos.length }}
                  </div>
                  <div v-if="record.signature" class="flex items-center gap-1 text-sm text-forest-600">
                    <PenTool class="w-4 h-4" />
                    已签名
                  </div>
                </div>
              </td>
              <td class="py-4 px-4">
                <p class="text-sm text-gray-600">{{ record.remark || '-' }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BaseCard v-for="record in recentDetailed" :key="record.id" hoverable>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center',
                record.type === 'receive' ? 'bg-blue-100' :
                record.type === 'deliver' ? 'bg-forest-100' :
                record.type === 'transfer' ? 'bg-purple-100' : 'bg-coral-100'
              ]">
                <Package class="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-gray-800">{{ record.orderId }}</span>
                  <span :class="['status-badge', getHandoverTypeClass(record.type)]">
                    {{ getHandoverTypeLabel(record.type) }}
                  </span>
                </div>
                <p class="text-sm text-gray-500">{{ formatDateTime(record.timestamp) }}</p>
              </div>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <p class="text-xs text-gray-500 mb-1">移交方</p>
              <p class="font-medium text-gray-800">{{ record.fromParty }}</p>
            </div>
            <ArrowRight class="w-6 h-6 text-gold-400" />
            <div class="flex-1">
              <p class="text-xs text-gray-500 mb-1">接收方</p>
              <p class="font-medium text-gray-800">{{ record.toParty }}</p>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-2">货品清单</p>
            <div v-for="(item, idx) in record.items" :key="idx" class="flex items-center justify-between py-1">
              <span class="text-sm text-gray-700">{{ item.name }}</span>
              <span class="text-sm text-gray-500">x{{ item.quantity }}</span>
            </div>
          </div>

          <div v-if="record.photos.length > 0">
            <p class="text-xs text-gray-500 mb-2">照片留痕</p>
            <div class="flex gap-2">
              <div
                v-for="(photo, idx) in record.photos"
                :key="idx"
                class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center"
              >
                <Image class="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>

          <div v-if="record.signature" class="flex items-center gap-2 pt-2 border-t border-gray-100">
            <ShieldCheck class="w-4 h-4 text-forest-500" />
            <span class="text-sm text-forest-600">已由 {{ record.signature }} 签名确认</span>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>

  <BaseModal
    :visible="showCreateModal"
    title="新建交接"
    @close="closeCreateModal"
  >
    <form @submit.prevent="handleSubmit" class="space-y-5">
      <div>
        <label class="label">关联订单 <span class="text-coral-500">*</span></label>
        <select
          v-model="form.orderId"
          class="input-field"
          required
        >
          <option value="">请选择订单</option>
          <option v-for="order in ordersStore.orders" :key="order.id" :value="order.id">
            {{ order.orderNo }} - {{ order.customer.name }}
          </option>
        </select>
      </div>

      <div>
        <label class="label">交接类型 <span class="text-coral-500">*</span></label>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="type in typeOptions"
            :key="type.value"
            type="button"
            :class="[
              'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
              form.type === type.value
                ? 'border-gold-500 bg-gold-50 text-gold-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            ]"
            @click="form.type = type.value as any"
          >
            {{ type.label }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label">移交方 <span class="text-coral-500">*</span></label>
          <input
            v-model="form.fromParty"
            type="text"
            class="input-field"
            placeholder="如：客户（陈女士）"
            required
          />
        </div>
        <div>
          <label class="label">接收方 <span class="text-coral-500">*</span></label>
          <input
            v-model="form.toParty"
            type="text"
            class="input-field"
            placeholder="如：门店（李导购）"
            required
          />
        </div>
      </div>

      <div>
        <label class="label">货品清单 <span class="text-coral-500">*</span></label>
        <div class="space-y-3">
          <div
            v-for="(item, index) in form.items"
            :key="index"
            class="flex gap-2"
          >
            <input
              v-model="item.name"
              type="text"
              class="input-field flex-1"
              placeholder="货品名称"
              required
            />
            <input
              v-model.number="item.quantity"
              type="number"
              min="1"
              class="input-field w-20"
              placeholder="数量"
              required
            />
            <button
              v-if="form.items.length > 1"
              type="button"
              class="px-3 text-coral-500 hover:bg-coral-50 rounded-lg"
              @click="removeItem(index)"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
          <button
            type="button"
            class="text-sm text-gold-600 hover:text-gold-700 flex items-center gap-1"
            @click="addItem"
          >
            <Plus class="w-4 h-4" />
            添加货品
          </button>
        </div>
      </div>

      <div>
        <label class="label">备注</label>
        <textarea
          v-model="form.remark"
          class="input-field min-h-[80px] resize-none"
          placeholder="交接备注说明..."
        ></textarea>
      </div>

      <div>
        <label class="label">签名确认</label>
        <input
          v-model="form.signature"
          type="text"
          class="input-field"
          placeholder="签名人姓名"
        />
      </div>

      <div class="pt-4 flex gap-3">
        <BaseButton type="button" variant="secondary" class="flex-1" @click="closeCreateModal">
          取消
        </BaseButton>
        <BaseButton type="submit" class="flex-1" :loading="submitting">
          创建交接
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { Plus, ArrowRight, Camera, PenTool, Package, Image, ShieldCheck, X } from 'lucide-vue-next'
import { useHandoverStore } from '~/stores/handover'
import { useOrdersStore } from '~/stores/orders'
import { useAuthStore } from '~/stores/auth'
import { useFormat } from '~/composables/useFormat'
import BaseModal from '~/components/BaseModal.vue'
import type { HandoverType, HandoverItem } from '~/types'

definePageMeta({
  layout: 'default',
})

const handoverStore = useHandoverStore()
const ordersStore = useOrdersStore()
const authStore = useAuthStore()
const { formatDate, formatDateTime, getHandoverTypeLabel, getHandoverTypeClass } = useFormat()

const activeTab = ref<HandoverType | ''>('')
const showCreateModal = ref(false)
const submitting = ref(false)

const tabs = [
  { value: '', label: '全部' },
  { value: 'receive', label: '收货' },
  { value: 'transfer', label: '转送' },
  { value: 'deliver', label: '交付' },
  { value: 'return', label: '退回' },
]

const typeOptions = [
  { value: 'receive', label: '收货' },
  { value: 'transfer', label: '转送' },
  { value: 'deliver', label: '交付' },
  { value: 'return', label: '退回' },
]

const form = reactive({
  orderId: '',
  type: 'receive' as HandoverType,
  fromParty: '',
  toParty: '',
  items: [{ name: '', quantity: 1, description: '' }] as HandoverItem[],
  remark: '',
  signature: '',
})

const addItem = () => {
  form.items.push({ name: '', quantity: 1, description: '' })
}

const removeItem = (index: number) => {
  form.items.splice(index, 1)
}

const resetForm = () => {
  form.orderId = ''
  form.type = 'receive'
  form.fromParty = ''
  form.toParty = ''
  form.items = [{ name: '', quantity: 1, description: '' }]
  form.remark = ''
  form.signature = ''
}

const closeCreateModal = () => {
  showCreateModal.value = false
  resetForm()
}

const handleSubmit = async () => {
  if (!form.orderId || !form.fromParty || !form.toParty || form.items.some(i => !i.name)) return

  submitting.value = true
  await new Promise(resolve => setTimeout(resolve, 500))

  const newRecord = handoverStore.createRecord({
    orderId: form.orderId,
    type: form.type,
    fromParty: form.fromParty,
    toParty: form.toParty,
    items: [...form.items],
    photos: [],
    signature: form.signature || undefined,
    timestamp: new Date(),
    remark: form.remark || undefined,
  })

  ordersStore.addHandoverRecord(form.orderId, newRecord.id)

  submitting.value = false
  closeCreateModal()
}

const filteredRecords = computed(() => {
  let result = [...handoverStore.records]
  if (activeTab.value) {
    result = result.filter(r => r.type === activeTab.value)
  }
  return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

const recentDetailed = computed(() => {
  return handoverStore.recentRecords.slice(0, 4)
})

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  await handoverStore.fetchRecords()
  await ordersStore.fetchOrders()
})
</script>
