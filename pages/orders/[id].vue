<template>
  <div v-if="order" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button @click="navigateBack" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft class="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-display font-semibold text-gray-800">{{ order.orderNo }}</h1>
            <span :class="['status-badge', getOrderStatusClass(order.status)]">
              {{ getOrderStatusLabel(order.status) }}
            </span>
            <span v-if="order.remodelCount > 0" class="status-badge bg-purple-100 text-purple-700">
              改款 {{ order.remodelCount }} 次
            </span>
          </div>
          <p class="text-sm text-gray-500">{{ formatDateTime(order.createdAt) }} 创建</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <BaseButton variant="secondary">
          <Printer class="w-4 h-4 mr-2" />
          打印
        </BaseButton>
        <BaseButton>
          <Edit class="w-4 h-4 mr-2" />
          编辑订单
        </BaseButton>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <BaseCard>
          <template #header>
            <h3 class="font-semibold text-gray-800">客户信息</h3>
          </template>
          <div class="flex items-start gap-6">
            <div class="w-16 h-16 bg-gold-100 rounded-2xl flex items-center justify-center">
              <User class="w-8 h-8 text-gold-600" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h4 class="font-semibold text-lg text-gray-800">{{ order.customer.name }}</h4>
                <span v-if="order.customer.memberLevel" class="status-badge bg-gold-100 text-gold-700">
                  {{ order.customer.memberLevel }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="flex items-center gap-2 text-gray-600">
                  <Phone class="w-4 h-4" />
                  {{ order.customer.phone }}
                </div>
                <div v-if="order.customer.wechat" class="flex items-center gap-2 text-gray-600">
                  <MessageCircle class="w-4 h-4" />
                  {{ order.customer.wechat }}
                </div>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-800">加工进度</h3>
              <BaseButton size="sm" variant="ghost">
                <Clock class="w-4 h-4 mr-1" />
                预计 {{ formatDate(order.estimatedDelivery) }} 交付
              </BaseButton>
            </div>
          </template>
          <ProgressTimeline
            :nodes="order.progress"
            :show-actions="true"
            :can-edit="true"
            @start="handleStartStep"
            @complete="handleCompleteStep"
            @abnormal="openAbnormalModal"
          />
        </BaseCard>

        <BaseCard>
          <template #header>
            <h3 class="font-semibold text-gray-800">货品信息</h3>
          </template>
          <div class="space-y-4">
            <div class="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div class="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center">
                <Diamond class="w-6 h-6 text-gold-600" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h4 class="font-medium text-gray-800">{{ getJewelryCategoryLabel(order.jewelry.category) }}</h4>
                  <span class="text-sm text-gray-500">{{ order.jewelry.material }}</span>
                </div>
                <p class="text-sm text-gray-500">
                  {{ order.jewelry.weight ? formatWeight(order.jewelry.weight) : '' }}
                  {{ order.jewelry.size ? `· ${order.jewelry.size}` : '' }}
                </p>
              </div>
            </div>

            <div v-if="order.jewelry.mainStone" class="grid grid-cols-2 gap-4">
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">主石</p>
                <p class="font-medium text-gray-800">
                  {{ order.jewelry.mainStone.type }} {{ formatCarat(order.jewelry.mainStone.carat) }}
                </p>
                <p v-if="order.jewelry.mainStone.color" class="text-xs text-gray-500 mt-0.5">
                  {{ order.jewelry.mainStone.color }} · {{ order.jewelry.mainStone.clarity }} · {{ order.jewelry.mainStone.cut }}
                </p>
              </div>
              <div v-if="order.jewelry.sideStones && order.jewelry.sideStones.length > 0" class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">配石</p>
                <p class="font-medium text-gray-800">
                  {{ order.jewelry.sideStones[0].type }} {{ formatCarat(order.jewelry.sideStones[0].carat) }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">共 {{ order.jewelry.sideStones[0].quantity || 0 }} 颗</p>
              </div>
            </div>

            <div class="bg-gold-50 rounded-lg p-4">
              <p class="text-xs text-gold-600 mb-1">定制要求</p>
              <p class="text-gray-700">{{ order.requirements }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <template #header>
            <h3 class="font-semibold text-gray-800">操作记录</h3>
          </template>
          <div class="space-y-4">
            <div
              v-for="note in order.notes"
              :key="note.id"
              class="flex items-start gap-3"
            >
              <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText class="w-4 h-4 text-gray-500" />
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-800">{{ note.content }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ note.operator }} · {{ formatDateTime(note.createdAt) }}</p>
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <input
                v-model="newNote"
                class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none"
                placeholder="添加备注..."
                @keyup.enter="addNote"
              />
              <BaseButton size="sm" @click="addNote">添加</BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>

      <div class="space-y-6">
        <BaseCard gold>
          <template #header>
            <h3 class="font-semibold text-gray-800">价格明细</h3>
          </template>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">基础工费</span>
              <span class="text-gray-800">{{ formatPrice(order.price.basePrice) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">宝石费用</span>
              <span class="text-gray-800">{{ formatPrice(order.price.stonePrice) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">工艺费用</span>
              <span class="text-gray-800">{{ formatPrice(order.price.craftPrice) }}</span>
            </div>
            <div v-if="order.price.discount" class="flex justify-between text-sm">
              <span class="text-gray-500">优惠</span>
              <span class="text-coral-600">-{{ formatPrice(order.price.discount) }}</span>
            </div>
            <div class="gold-divider my-2"></div>
            <div class="flex justify-between">
              <span class="font-semibold text-gray-800">合计</span>
              <span class="font-bold text-xl text-gold-600">{{ formatPrice(order.price.total) }}</span>
            </div>
            <div class="pt-4 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">已付定金</span>
                <span class="text-forest-600 font-medium">{{ formatPrice(order.price.deposit || 0) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">待收尾款</span>
                <span class="text-gold-600 font-medium">{{ formatPrice(order.price.remaining || 0) }}</span>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard v-if="order.abnormalRecords.length > 0">
          <template #header>
            <div class="flex items-center gap-2">
              <AlertTriangle class="w-5 h-5 text-coral-600" />
              <h3 class="font-semibold text-gray-800">异常记录</h3>
            </div>
          </template>
          <div class="space-y-3">
            <div
              v-for="abnormalId in order.abnormalRecords"
              :key="abnormalId"
              class="border border-coral-100 bg-coral-50 rounded-lg p-3"
            >
              <div class="flex items-center gap-2 mb-1">
                <span :class="['status-badge text-xs', getAbnormalLevelClass(getAbnormal(abnormalId)?.level || 'low')]">
                  {{ getAbnormalLevelLabel(getAbnormal(abnormalId)?.level || 'low') }}
                </span>
                <span class="text-sm text-gray-600">{{ getAbnormalTypeLabel(getAbnormal(abnormalId)?.type || 'other') }}</span>
              </div>
              <p class="text-sm text-gray-700">{{ getAbnormal(abnormalId)?.description }}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <template #header>
            <h3 class="font-semibold text-gray-800">交接记录</h3>
          </template>
          <div class="space-y-3">
            <div
              v-for="record in handoverRecords"
              :key="record.id"
              class="flex items-start gap-3"
            >
              <div :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                record.type === 'receive' ? 'bg-blue-100' :
                record.type === 'deliver' ? 'bg-forest-100' :
                record.type === 'transfer' ? 'bg-purple-100' : 'bg-coral-100'
              ]">
                <ArrowRightLeft class="w-4 h-4 text-gray-600" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span :class="['status-badge text-xs', getHandoverTypeClass(record.type)]">
                    {{ getHandoverTypeLabel(record.type) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mt-0.5">{{ record.fromParty }} → {{ record.toParty }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ formatDateTime(record.timestamp) }}</p>
                <div v-if="record.photos.length > 0" class="flex gap-1 mt-2">
                  <div
                    v-for="(photo, idx) in record.photos.slice(0, 3)"
                    :key="idx"
                    class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center"
                  >
                    <Image class="w-4 h-4 text-gray-500" />
                  </div>
                  <div v-if="record.photos.length > 3" class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                    +{{ record.photos.length - 3 }}
                  </div>
                </div>
              </div>
            </div>
            <div v-if="handoverRecords.length === 0" class="text-center py-4 text-gray-400 text-sm">
              暂无交接记录
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>

  <div v-else class="flex items-center justify-center h-64">
    <div class="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full"></div>
  </div>

  <BaseModal
    :visible="showAbnormalModal"
    title="登记工序异常"
    @close="closeAbnormalModal"
  >
    <form @submit.prevent="handleConfirmAbnormal" class="space-y-5">
      <div v-if="abnormalStep" class="bg-coral-50 rounded-lg p-4">
        <p class="text-sm text-coral-600">
          <span class="font-medium">异常工序：</span>{{ abnormalStep.step }}
        </p>
      </div>

      <div>
        <label class="label">异常类型 <span class="text-coral-500">*</span></label>
        <select
          v-model="abnormalForm.type"
          class="input-field"
          required
        >
          <option v-for="opt in abnormalTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="label">紧急程度 <span class="text-coral-500">*</span></label>
        <div class="flex gap-3">
          <button
            v-for="level in abnormalLevelOptions"
            :key="level.value"
            type="button"
            :class="[
              'flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
              abnormalForm.level === level.value
                ? 'border-gold-500 bg-gold-50 text-gold-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            ]"
            @click="abnormalForm.level = level.value as any"
          >
            {{ level.label }}
          </button>
        </div>
      </div>

      <div>
        <label class="label">异常描述 <span class="text-coral-500">*</span></label>
        <textarea
          v-model="abnormalForm.description"
          class="input-field min-h-[100px] resize-none"
          placeholder="请详细描述异常情况..."
          required
        ></textarea>
      </div>

      <div>
        <label class="label">原因分析</label>
        <textarea
          v-model="abnormalForm.cause"
          class="input-field min-h-[80px] resize-none"
          placeholder="分析异常产生的原因..."
        ></textarea>
      </div>

      <div class="pt-4 flex gap-3">
        <BaseButton type="button" variant="secondary" class="flex-1" @click="closeAbnormalModal">
          取消
        </BaseButton>
        <BaseButton type="submit" class="flex-1">
          确认登记
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ArrowLeft, User, Phone, MessageCircle, Diamond, Clock, FileText, AlertTriangle, ArrowRightLeft, Image, Printer, Edit } from 'lucide-vue-next'
import { useOrdersStore } from '~/stores/orders'
import { useAbnormalStore } from '~/stores/abnormal'
import { useHandoverStore } from '~/stores/handover'
import { useAuthStore } from '~/stores/auth'
import { useFormat } from '~/composables/useFormat'
import BaseModal from '~/components/BaseModal.vue'
import type { ProgressNode, AbnormalType, AbnormalLevel } from '~/types'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const ordersStore = useOrdersStore()
const abnormalStore = useAbnormalStore()
const handoverStore = useHandoverStore()
const authStore = useAuthStore()

const { formatDate, formatDateTime, formatPrice, formatWeight, formatCarat, getOrderStatusLabel, getOrderStatusClass, getJewelryCategoryLabel, getAbnormalTypeLabel, getAbnormalLevelLabel, getAbnormalLevelClass, getHandoverTypeLabel, getHandoverTypeClass } = useFormat()

const newNote = ref('')

const order = computed(() => ordersStore.getOrderById(route.params.id as string))

const handoverRecords = computed(() => {
  if (!order.value) return []
  return handoverStore.recordsByOrder(order.value.id)
})

const getAbnormal = (id: string) => {
  return abnormalStore.records.find(r => r.id === id)
}

const navigateBack = () => {
  navigateTo('/orders')
}

const handleStartStep = (node: ProgressNode) => {
  if (order.value) {
    ordersStore.updateOrderProgress(order.value.id, node.id, 'in_progress')
  }
}

const handleCompleteStep = (node: ProgressNode) => {
  if (order.value) {
    ordersStore.updateOrderProgress(order.value.id, node.id, 'completed')
  }
}

const abnormalStep = ref<ProgressNode | null>(null)
const showAbnormalModal = ref(false)
const abnormalForm = reactive({
  type: 'craft_issue' as AbnormalType,
  level: 'medium' as AbnormalLevel,
  description: '',
  cause: '',
})

const abnormalTypeOptions = [
  { value: 'stone_shortage', label: '石缺货' },
  { value: 'craft_issue', label: '工艺问题' },
  { value: 'customer_change', label: '客户改款' },
  { value: 'quality_issue', label: '质量问题' },
  { value: 'damage', label: '货品损坏' },
  { value: 'other', label: '其他' },
]

const abnormalLevelOptions = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'critical', label: '紧急' },
]

const openAbnormalModal = (node: ProgressNode) => {
  abnormalStep.value = node
  abnormalForm.type = 'craft_issue'
  abnormalForm.level = 'medium'
  abnormalForm.description = `${node.step}工序发现异常`
  abnormalForm.cause = ''
  showAbnormalModal.value = true
}

const closeAbnormalModal = () => {
  showAbnormalModal.value = false
  abnormalStep.value = null
}

const handleConfirmAbnormal = async () => {
  if (!order.value || !abnormalStep.value) return

  const step = abnormalStep.value

  ordersStore.updateOrderProgress(order.value.id, step.id, 'abnormal', abnormalForm.description)

  const newAbnormal = abnormalStore.createRecord({
    orderId: order.value.id,
    orderNo: order.value.orderNo,
    customerName: order.value.customer.name,
    type: abnormalForm.type,
    level: abnormalForm.level,
    description: abnormalForm.description,
    cause: abnormalForm.cause || undefined,
    operator: authStore.userName || '王售后',
  })

  ordersStore.markOrderAbnormal(order.value.id, newAbnormal.id)

  closeAbnormalModal()
}

const addNote = () => {
  if (newNote.value.trim() && order.value) {
    ordersStore.addNote(order.value.id, newNote.value.trim(), authStore.userName)
    newNote.value = ''
  }
}

onMounted(async () => {
  await ordersStore.fetchOrders()
  await abnormalStore.fetchRecords()
  await handoverStore.fetchRecords()
})
</script>
