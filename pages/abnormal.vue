<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <p class="text-sm text-gray-500">待处理</p>
        <p class="text-2xl font-bold text-coral-600 mt-1">{{ abnormalStore.stats.pending }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <p class="text-sm text-gray-500">处理中</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">{{ abnormalStore.stats.processing }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <p class="text-sm text-gray-500">已解决</p>
        <p class="text-2xl font-bold text-forest-600 mt-1">{{ abnormalStore.stats.resolved }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <p class="text-sm text-gray-500">已关闭</p>
        <p class="text-2xl font-bold text-gray-500 mt-1">{{ abnormalStore.stats.closed }}</p>
      </div>
    </div>

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
          <span class="ml-1 text-sm opacity-75">({{ tab.count }})</span>
        </button>
      </div>
      <div class="flex-1"></div>
      <select
        v-model="filterLevel"
        class="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none"
      >
        <option value="">全部等级</option>
        <option value="critical">紧急</option>
        <option value="high">高</option>
        <option value="medium">中</option>
        <option value="low">低</option>
      </select>
      <BaseButton @click="showCreateModal = true">
        <Plus class="w-4 h-4 mr-2" />
        登记异常
      </BaseButton>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BaseCard
        v-for="record in filteredRecords"
        :key="record.id"
        :class="record.level === 'critical' ? 'border-coral-300' : ''"
        hoverable
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div :class="[
              'w-10 h-10 rounded-lg flex items-center justify-center',
              record.level === 'critical' ? 'bg-coral-100' :
              record.level === 'high' ? 'bg-orange-100' :
              record.level === 'medium' ? 'bg-yellow-100' : 'bg-gray-100'
            ]">
              <AlertTriangle :class="[
                'w-5 h-5',
                record.level === 'critical' ? 'text-coral-600 animate-breathe' :
                record.level === 'high' ? 'text-orange-600' :
                record.level === 'medium' ? 'text-yellow-600' : 'text-gray-500'
              ]" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-semibold text-gray-800">{{ record.orderNo }}</span>
                <span :class="['status-badge text-xs', getAbnormalLevelClass(record.level)]">
                  {{ getAbnormalLevelLabel(record.level) }}
                </span>
              </div>
              <p class="text-sm text-gray-500">{{ record.customerName }}</p>
            </div>
          </div>
          <span :class="['status-badge', getAbnormalStatusClass(record.status)]">
            {{ getAbnormalStatusLabel(record.status) }}
          </span>
        </div>

        <div class="mb-4">
          <span class="text-xs text-gray-500">{{ getAbnormalTypeLabel(record.type) }}</span>
          <p class="text-gray-700 mt-1">{{ record.description }}</p>
        </div>

        <div v-if="record.cause" class="bg-gray-50 rounded-lg p-3 mb-4">
          <p class="text-xs text-gray-500 mb-1">原因分析</p>
          <p class="text-sm text-gray-700">{{ record.cause }}</p>
        </div>

        <div v-if="record.solution" class="bg-gold-50 rounded-lg p-3 mb-4">
          <p class="text-xs text-gold-600 mb-1">解决方案</p>
          <p class="text-sm text-gray-700">{{ record.solution }}</p>
          <p v-if="record.compensation !== undefined && record.compensation > 0" class="text-sm text-coral-600 mt-2">
            赔付金额: {{ formatPrice(record.compensation) }}
          </p>
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-gray-100">
          <span class="text-xs text-gray-400">{{ formatDateTime(record.createdAt) }}</span>
          <div class="flex gap-2">
            <BaseButton v-if="record.status === 'pending'" size="sm" @click="startProcessing(record)">
              开始处理
            </BaseButton>
            <BaseButton v-if="record.status === 'processing'" size="sm" variant="secondary" @click="resolveRecord(record)">
              标记解决
            </BaseButton>
            <BaseButton size="sm" variant="ghost">
              查看详情
            </BaseButton>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-100">
          <p class="text-xs text-gray-500 mb-2">处理进度</p>
          <div class="space-y-2">
            <div
              v-for="(history, idx) in record.history.slice(0, 3)"
              :key="history.id"
              class="flex items-start gap-2 text-xs"
            >
              <div class="w-2 h-2 mt-1.5 rounded-full bg-gold-400 flex-shrink-0"></div>
              <div class="flex-1">
                <span class="font-medium text-gray-600">{{ history.action }}</span>
                <span class="text-gray-400 ml-2">{{ history.operator }}</span>
                <p class="text-gray-500 mt-0.5">{{ history.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <div v-if="filteredRecords.length === 0" class="text-center py-16">
      <ShieldCheck class="w-16 h-16 mx-auto text-gray-300 mb-4" />
      <p class="text-gray-500">没有找到匹配的异常记录</p>
    </div>
  </div>

  <BaseModal
    :visible="showCreateModal"
    title="登记异常"
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
        <label class="label">异常类型 <span class="text-coral-500">*</span></label>
        <select
          v-model="form.type"
          class="input-field"
          required
        >
          <option value="">请选择异常类型</option>
          <option value="stone_shortage">石缺货</option>
          <option value="craft_issue">工艺问题</option>
          <option value="customer_change">客户改款</option>
          <option value="quality_issue">质量问题</option>
          <option value="damage">货品损坏</option>
          <option value="other">其他</option>
        </select>
      </div>

      <div>
        <label class="label">紧急程度 <span class="text-coral-500">*</span></label>
        <div class="flex gap-3">
          <button
            v-for="level in levelOptions"
            :key="level.value"
            type="button"
            :class="[
              'flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
              form.level === level.value
                ? 'border-gold-500 bg-gold-50 text-gold-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            ]"
            @click="form.level = level.value as any"
          >
            {{ level.label }}
          </button>
        </div>
      </div>

      <div>
        <label class="label">异常描述 <span class="text-coral-500">*</span></label>
        <textarea
          v-model="form.description"
          class="input-field min-h-[100px] resize-none"
          placeholder="请详细描述异常情况..."
          required
        ></textarea>
      </div>

      <div>
        <label class="label">原因分析</label>
        <textarea
          v-model="form.cause"
          class="input-field min-h-[80px] resize-none"
          placeholder="分析异常产生的原因..."
        ></textarea>
      </div>

      <div>
        <label class="label">赔付金额（元）</label>
        <input
          v-model.number="form.compensation"
          type="number"
          min="0"
          class="input-field"
          placeholder="0"
        />
      </div>

      <div class="pt-4 flex gap-3">
        <BaseButton type="button" variant="secondary" class="flex-1" @click="closeCreateModal">
          取消
        </BaseButton>
        <BaseButton type="submit" class="flex-1" :loading="submitting">
          提交登记
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { AlertTriangle, Plus, ShieldCheck } from 'lucide-vue-next'
import { useAbnormalStore } from '~/stores/abnormal'
import { useOrdersStore } from '~/stores/orders'
import { useAuthStore } from '~/stores/auth'
import { useFormat } from '~/composables/useFormat'
import BaseModal from '~/components/BaseModal.vue'
import type { AbnormalRecord, AbnormalStatus, AbnormalLevel, AbnormalType } from '~/types'

definePageMeta({
  layout: 'default',
})

const abnormalStore = useAbnormalStore()
const ordersStore = useOrdersStore()
const authStore = useAuthStore()
const { formatDateTime, formatPrice, getAbnormalTypeLabel, getAbnormalLevelLabel, getAbnormalLevelClass, getAbnormalStatusLabel, getAbnormalStatusClass } = useFormat()

const activeTab = ref<AbnormalStatus | ''>('')
const filterLevel = ref<AbnormalLevel | ''>('')
const showCreateModal = ref(false)
const submitting = ref(false)

const levelOptions = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'critical', label: '紧急' },
]

const form = reactive({
  orderId: '',
  type: '' as AbnormalType | '',
  level: 'medium' as AbnormalLevel,
  description: '',
  cause: '',
  compensation: 0,
})

const tabs = computed(() => [
  { value: '', label: '全部', count: abnormalStore.stats.total },
  { value: 'pending', label: '待处理', count: abnormalStore.stats.pending },
  { value: 'processing', label: '处理中', count: abnormalStore.stats.processing },
  { value: 'resolved', label: '已解决', count: abnormalStore.stats.resolved },
])

const filteredRecords = computed(() => {
  let result = [...abnormalStore.records]

  if (activeTab.value) {
    result = result.filter(r => r.status === activeTab.value)
  }

  if (filterLevel.value) {
    result = result.filter(r => r.level === filterLevel.value)
  }

  return result.sort((a, b) => {
    const levelOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return levelOrder[a.level] - levelOrder[b.level]
  })
})

const resetForm = () => {
  form.orderId = ''
  form.type = ''
  form.level = 'medium'
  form.description = ''
  form.cause = ''
  form.compensation = 0
}

const closeCreateModal = () => {
  showCreateModal.value = false
  resetForm()
}

const handleSubmit = async () => {
  if (!form.orderId || !form.type || !form.description) return

  submitting.value = true
  await new Promise(resolve => setTimeout(resolve, 500))

  const order = ordersStore.getOrderById(form.orderId)
  if (order) {
    const newRecord = abnormalStore.createRecord({
      orderId: form.orderId,
      orderNo: order.orderNo,
      customerName: order.customer.name,
      type: form.type as AbnormalType,
      level: form.level,
      description: form.description,
      cause: form.cause || undefined,
      compensation: form.compensation > 0 ? form.compensation : undefined,
      operator: authStore.userName || '王售后',
    })

    ordersStore.markOrderAbnormal(form.orderId, newRecord.id)
  }

  submitting.value = false
  closeCreateModal()
}

const startProcessing = (record: AbnormalRecord) => {
  abnormalStore.updateStatus(record.id, 'processing')
  abnormalStore.addHistory(record.id, '开始处理', '售后专员已开始跟进此异常', authStore.userName || '王售后')
}

const resolveRecord = (record: AbnormalRecord) => {
  abnormalStore.updateStatus(record.id, 'resolved')
  abnormalStore.addHistory(record.id, '问题解决', '异常已处理完成', authStore.userName || '王售后')
}

onMounted(async () => {
  await abnormalStore.fetchRecords()
  await ordersStore.fetchOrders()
})
</script>
