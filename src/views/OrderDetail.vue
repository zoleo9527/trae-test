<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useOrderStore } from '@/stores/order'
import type { Exception, SampleVersion } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'
import VerticalTimeline from '@/components/VerticalTimeline.vue'
import ExceptionDrawer from '@/components/ExceptionDrawer.vue'
import { 
  ArrowLeft, 
  Check, 
  Lock, 
  RefreshCw, 
  Calendar,
  Truck,
  AlertTriangle,
  DollarSign,
  Package,
  Clock,
  ChevronRight,
  Edit3,
  Send
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const orderStore = useOrderStore()

const orderId = computed(() => route.params.id as string)
const order = computed(() => orderStore.getOrderById(orderId.value))

const drawerVisible = ref(false)
const selectedException = ref<Exception | null>(null)
const showVersionModal = ref(false)
const showShipmentModal = ref(false)
const showRefundModal = ref(false)

const newVersionReason = ref('')
const newSpecs = ref<Record<string, string>>({})

const shipmentCarrier = ref('顺丰速运')
const shipmentTrackingNo = ref('')
const shipmentActualQty = ref(0)

const refundAmount = ref(0)
const refundParty = ref('factory')
const refundApplyReason = ref('')

const sampleSteps = [
  { key: 'quoting', label: '创建报价', icon: Package },
  { key: 'sampling', label: '打样中', icon: Clock },
  { key: 'sample_confirmed', label: '样品确认', icon: Check },
  { key: 'version_locked', label: '版本锁定', icon: Lock }
]

const productionSteps = [
  { key: 'scheduled', label: '已排期', icon: Calendar },
  { key: 'producing', label: '生产中', icon: RefreshCw },
  { key: 'qc_passed', label: '质检通过', icon: Check },
  { key: 'shipping', label: '发货中', icon: Truck },
  { key: 'completed', label: '已完成', icon: Lock }
]

const sampleStepStatus = computed(() => {
  if (!order.value) return 0
  const status = order.value.status
  const orderIdx = sampleSteps.findIndex(s => s.key === status)
  if (orderIdx >= 0) return orderIdx + 1
  if (['scheduled', 'producing', 'qc_passed', 'shipping', 'completed'].includes(status)) {
    return 4
  }
  return 0
})

const productionStepStatus = computed(() => {
  if (!order.value) return 0
  const status = order.value.status
  if (['draft', 'quoting', 'sampling', 'sample_confirmed', 'version_locked'].includes(status)) {
    return 0
  }
  const orderIdx = productionSteps.findIndex(s => s.key === status)
  return orderIdx >= 0 ? orderIdx + 1 : 0
})

const sortedVersions = computed(() => {
  if (!order.value) return []
  return [...order.value.sampleVersions].sort((a, b) => b.version - a.version)
})

onMounted(() => {
  const exceptionType = route.query.exception as string
  if (exceptionType && order.value) {
    const exception = order.value.exceptions.find(e => {
      if (exceptionType === 'version') return e.type === 'version_overwrite'
      if (exceptionType === 'shipment') return e.type === 'shipment_missing'
      if (exceptionType === 'refund') return e.type === 'refund_required'
      return false
    })
    if (exception && canOpenException(exception)) {
      selectedException.value = exception
      drawerVisible.value = true
    }
  }
})

const canOpenException = (exception: Exception): boolean => {
  if (exception.type === 'refund_required' && userStore.currentUser.role !== 'business') {
    return false
  }
  return true
}

const goBack = () => {
  router.push('/')
}

const openException = (exception: Exception) => {
  if (!canOpenException(exception)) return
  selectedException.value = exception
  drawerVisible.value = true
}

const handleConfirmSample = (version: SampleVersion) => {
  orderStore.confirmSampleVersion(orderId.value, version.id, false)
}

const handleLockVersion = (version: SampleVersion) => {
  orderStore.confirmSampleVersion(orderId.value, version.id, true)
}

const handleCreateNewVersion = (oldVersion: SampleVersion) => {
  newVersionReason.value = ''
  newSpecs.value = { ...oldVersion.specs }
  showVersionModal.value = true
}

const submitNewVersion = () => {
  const lockedVersion = order.value?.sampleVersions.find(v => v.status === 'locked')
  if (lockedVersion && newVersionReason.value.trim()) {
    orderStore.createNewSampleVersion(orderId.value, lockedVersion.id, newVersionReason.value, newSpecs.value)
    showVersionModal.value = false
  }
}

const handleScheduleProduction = () => {
  orderStore.scheduleProduction(orderId.value)
}

const handleStartProduction = () => {
  orderStore.startProduction(orderId.value)
}

const handleQcPass = () => {
  orderStore.passQC(orderId.value)
}

const openShipmentModal = () => {
  shipmentActualQty.value = order.value?.quantity || 0
  showShipmentModal.value = true
}

const submitShipment = () => {
  if (order.value && shipmentTrackingNo.value.trim()) {
    orderStore.recordShipment(
      orderId.value, 
      shipmentCarrier.value, 
      shipmentTrackingNo.value,
      [{
        skuName: order.value.productName,
        expectedQty: order.value.quantity,
        actualQty: shipmentActualQty.value
      }]
    )
    showShipmentModal.value = false
  }
}

const openRefundModal = () => {
  refundAmount.value = Math.floor((order.value?.totalAmount || 0) * 0.05)
  refundApplyReason.value = ''
  showRefundModal.value = true
}

const submitRefund = () => {
  if (refundAmount.value > 0 && refundApplyReason.value.trim()) {
    orderStore.initiateRefund(orderId.value, refundAmount.value, refundParty.value, refundApplyReason.value)
    showRefundModal.value = false
  }
}

const pendingExceptions = computed(() => {
  if (!order.value) return []
  return orderStore.visibleExceptionsForOrder(order.value)
})
</script>

<template>
  <div class="space-y-6 animate-fade-in-up" v-if="order">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button 
          @click="goBack"
          class="p-2 rounded-lg hover:bg-white transition-colors"
        >
          <ArrowLeft class="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-xl font-semibold text-gray-800">{{ order.orderNo }}</h1>
            <StatusBadge type="order" :status="order.status" />
          </div>
          <p class="text-sm text-gray-500">{{ order.clientName }} - {{ order.productName }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button 
          v-if="userStore.currentUser.role === 'business'"
          @click="openRefundModal"
          class="btn-secondary flex items-center gap-2"
        >
          <DollarSign class="w-4 h-4" />
          发起退款
        </button>
      </div>
    </div>

    <div v-if="pendingExceptions.length > 0" class="card border-l-4 border-red-500">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-medium text-gray-800 flex items-center gap-2">
          <AlertTriangle class="w-5 h-5 text-red-500" />
          当前异常 ({{ pendingExceptions.length }})
        </h3>
      </div>
      <div class="flex flex-wrap gap-3">
        <button 
          v-for="ex in pendingExceptions" 
          :key="ex.id"
          @click="openException(ex)"
          class="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
          :class="ex.severity === 'critical' ? 'bg-red-50 border border-red-200 hover:bg-red-100' : 'bg-amber-50 border border-amber-200 hover:bg-amber-100'"
        >
          <AlertTriangle 
            class="w-4 h-4" 
            :class="ex.severity === 'critical' ? 'text-red-500 animate-pulse-slow' : 'text-amber-500'"
          />
          <span class="text-sm" :class="ex.severity === 'critical' ? 'text-red-700' : 'text-amber-700'">
            {{ ex.type === 'version_overwrite' ? '版本覆盖' : ex.type === 'shipment_missing' ? '拆单漏件' : '退款待审批' }}
          </span>
          <ChevronRight class="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <div class="card">
        <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package class="w-5 h-5 text-amber-500" />
          打样确认流程
        </h3>
        <div class="flex items-center justify-between mb-6">
          <div 
            v-for="(step, idx) in sampleSteps" 
            :key="step.key"
            class="flex flex-col items-center relative"
            :style="{ width: '25%' }"
          >
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center mb-2 z-10"
              :class="idx < sampleStepStatus 
                ? 'bg-success text-white' 
                : idx === sampleStepStatus 
                  ? 'bg-amber-100 text-amber-600 ring-4 ring-amber-50' 
                  : 'bg-gray-100 text-gray-400'"
            >
              <component :is="step.icon" class="w-5 h-5" />
            </div>
            <span 
              class="text-xs font-medium"
              :class="idx < sampleStepStatus ? 'text-success' : idx === sampleStepStatus ? 'text-amber-600' : 'text-gray-400'"
            >{{ step.label }}</span>
            <div 
              v-if="idx < sampleSteps.length - 1"
              class="absolute top-5 left-1/2 w-full h-0.5"
              :class="idx < sampleStepStatus - 1 ? 'bg-success' : 'bg-gray-200'"
            ></div>
          </div>
        </div>

        <div class="space-y-3">
          <div 
            v-for="version in sortedVersions" 
            :key="version.id"
            class="p-4 rounded-xl border transition-all"
            :class="version.status === 'locked' 
              ? 'border-emerald-200 bg-emerald-50' 
              : version.status === 'confirmed' 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-200'"
          >
            <div class="flex items-start gap-4">
              <img :src="version.photoUrl" class="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <span class="px-2 py-0.5 bg-gray-800 text-white text-xs font-medium rounded">
                    v{{ version.version }}
                  </span>
                  <span 
                    v-if="version.status === 'locked'" 
                    class="px-2 py-0.5 bg-emerald-500 text-white text-xs font-medium rounded"
                  >
                    已锁定
                  </span>
                  <span 
                    v-else-if="version.status === 'confirmed'" 
                    class="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded"
                  >
                    已确认
                  </span>
                  <span 
                    v-else 
                    class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded"
                  >
                    待确认
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-2 mb-2">
                  <div v-for="(val, key) in version.specs" :key="key" class="text-sm">
                    <span class="text-gray-500">{{ key }}:</span>
                    <span class="font-medium text-gray-800 ml-1">{{ val }}</span>
                  </div>
                </div>
                <p v-if="version.confirmedBy" class="text-xs text-gray-500">
                  {{ version.confirmedBy }} 于 {{ new Date(version.confirmedAt || '').toLocaleDateString('zh-CN') }} 确认
                </p>
                <p v-if="version.changeReason" class="text-xs text-amber-600 mt-1">
                  变更原因: {{ version.changeReason }}
                </p>
              </div>
              <div class="flex flex-col gap-2">
                <button 
                  v-if="version.status === 'pending' && userStore.currentUser.role === 'sampling'"
                  @click="handleConfirmSample(version)"
                  class="btn-primary text-sm px-3 py-1.5 flex items-center gap-1"
                >
                  <Check class="w-3 h-3" />
                  确认
                </button>
                <button 
                  v-if="version.status === 'confirmed' && userStore.currentUser.role === 'sampling'"
                  @click="handleLockVersion(version)"
                  class="btn-primary text-sm px-3 py-1.5 flex items-center gap-1"
                >
                  <Lock class="w-3 h-3" />
                  锁定
                </button>
                <button 
                  v-if="version.status === 'locked' && userStore.currentUser.role === 'sampling'"
                  @click="handleCreateNewVersion(version)"
                  class="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1"
                >
                  <Edit3 class="w-3 h-3" />
                  改版
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Truck class="w-5 h-5 text-cyan-500" />
          量产排期流程
        </h3>
        <div class="flex items-center justify-between mb-6">
          <div 
            v-for="(step, idx) in productionSteps" 
            :key="step.key"
            class="flex flex-col items-center relative"
            :style="{ width: '20%' }"
          >
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center mb-2 z-10"
              :class="idx < productionStepStatus 
                ? 'bg-success text-white' 
                : idx === productionStepStatus 
                  ? 'bg-cyan-100 text-cyan-600 ring-4 ring-cyan-50' 
                  : 'bg-gray-100 text-gray-400'"
            >
              <component :is="step.icon" class="w-5 h-5" />
            </div>
            <span 
              class="text-xs font-medium text-center"
              :class="idx < productionStepStatus ? 'text-success' : idx === productionStepStatus ? 'text-cyan-600' : 'text-gray-400'"
            >{{ step.label }}</span>
            <div 
              v-if="idx < productionSteps.length - 1"
              class="absolute top-5 left-1/2 w-full h-0.5"
              :class="idx < productionStepStatus - 1 ? 'bg-success' : 'bg-gray-200'"
            ></div>
          </div>
        </div>

        <div class="space-y-3">
          <div v-if="order.productionSchedules.length > 0" class="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div v-for="schedule in order.productionSchedules" :key="schedule.id" class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">排期日期</span>
                <span class="font-medium text-gray-800">{{ schedule.scheduledDate }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">生产状态</span>
                <span class="font-medium text-gray-800">
                  {{ schedule.productionStatus === 'scheduled' ? '已排期' : schedule.productionStatus === 'producing' ? '生产中' : '已完成' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">计划数量</span>
                <span class="font-medium text-gray-800">{{ schedule.quantity }} 件</span>
              </div>
              <div v-if="schedule.qcResult" class="flex items-center justify-between">
                <span class="text-sm text-gray-600">质检结果</span>
                <span class="font-medium text-green-600">{{ schedule.qcResult }}</span>
              </div>
            </div>
          </div>
          <div v-else class="p-6 rounded-xl border-2 border-dashed border-gray-200 text-center">
            <Calendar class="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p class="text-gray-500 text-sm">暂未安排排期</p>
          </div>

          <div class="flex gap-2">
            <button 
              v-if="order.status === 'version_locked' && userStore.currentUser.role === 'warehouse'"
              @click="handleScheduleProduction"
              class="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <Calendar class="w-4 h-4" />
              安排排期
            </button>
            <button 
              v-if="order.status === 'scheduled' && userStore.currentUser.role === 'warehouse'"
              @click="handleStartProduction"
              class="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <RefreshCw class="w-4 h-4" />
              开始生产
            </button>
            <button 
              v-if="order.status === 'producing' && userStore.currentUser.role === 'warehouse'"
              @click="handleQcPass"
              class="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <Check class="w-4 h-4" />
              质检通过
            </button>
            <button 
              v-if="['qc_passed', 'shipping'].includes(order.status) && userStore.currentUser.role === 'warehouse'"
              @click="openShipmentModal"
              class="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <Send class="w-4 h-4" />
              发货操作
            </button>
          </div>
        </div>

        <div v-if="order.shipments.length > 0" class="mt-6">
          <h4 class="font-medium text-gray-800 mb-3">发货记录</h4>
          <div class="space-y-2">
            <div 
              v-for="shipment in order.shipments" 
              :key="shipment.id"
              class="p-3 rounded-lg border border-gray-200 bg-white"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <Truck class="w-4 h-4 text-cyan-500" />
                  <span class="font-medium text-sm text-gray-800">{{ shipment.carrier }}</span>
                </div>
                <span class="text-xs text-gray-500">
                  {{ shipment.shippedAt ? new Date(shipment.shippedAt).toLocaleDateString('zh-CN') : '' }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-2">运单号: {{ shipment.trackingNo }}</p>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="item in shipment.items" 
                  :key="item.id"
                  class="px-2 py-1 rounded text-xs"
                  :class="item.isMissing ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'"
                >
                  {{ item.skuName }}: {{ item.actualQty }}/{{ item.expectedQty }}
                  <span v-if="item.isMissing" class="ml-1">(缺{{ item.expectedQty - item.actualQty }})</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Clock class="w-5 h-5 text-gray-500" />
        操作日志
      </h3>
      <VerticalTimeline :logs="order.operationLogs.slice(0, 10)" />
    </div>

    <Transition name="fade">
      <div 
        v-if="showVersionModal" 
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="showVersionModal = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-lg p-6 animate-fade-in-up">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">创建新版本</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">变更原因 *</label>
              <textarea 
                v-model="newVersionReason"
                class="input-field h-24 resize-none"
                placeholder="请填写版本变更原因，这将被记录在操作日志中..."
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">规格参数</label>
              <div class="space-y-2">
                <div 
                  v-for="(val, key) in newSpecs" 
                  :key="key"
                  class="flex items-center gap-2"
                >
                  <span class="w-20 text-sm text-gray-500">{{ key }}</span>
                  <input 
                    v-model="newSpecs[key]" 
                    class="flex-1 input-field text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button 
              @click="showVersionModal = false"
              class="flex-1 btn-secondary"
            >
              取消
            </button>
            <button 
              @click="submitNewVersion"
              class="flex-1 btn-primary"
              :disabled="!newVersionReason.trim()"
            >
              确认创建新版本
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div 
        v-if="showShipmentModal" 
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="showShipmentModal = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-lg p-6 animate-fade-in-up">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">发货操作</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">物流公司</label>
              <select v-model="shipmentCarrier" class="input-field">
                <option value="顺丰速运">顺丰速运</option>
                <option value="京东物流">京东物流</option>
                <option value="德邦快递">德邦快递</option>
                <option value="圆通速递">圆通速递</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">运单号 *</label>
              <input 
                v-model="shipmentTrackingNo"
                class="input-field"
                placeholder="请输入运单号"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">实际发货数量</label>
              <div class="flex items-center gap-4">
                <input 
                  v-model.number="shipmentActualQty"
                  type="number"
                  class="input-field"
                  :max="order.quantity"
                  min="0"
                />
                <span class="text-sm text-gray-500">/ {{ order.quantity }} 件</span>
              </div>
              <p 
                v-if="shipmentActualQty < order.quantity" 
                class="mt-2 text-sm text-red-500"
              >
                ⚠️ 实发数量少于应发数量，将触发漏件检测异常
              </p>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button 
              @click="showShipmentModal = false"
              class="flex-1 btn-secondary"
            >
              取消
            </button>
            <button 
              @click="submitShipment"
              class="flex-1 btn-primary"
              :disabled="!shipmentTrackingNo.trim()"
            >
              确认发货
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div 
        v-if="showRefundModal" 
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="showRefundModal = false"
      >
        <div class="bg-white rounded-2xl w-full max-w-lg p-6 animate-fade-in-up">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">发起退款申请</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">退款金额 (元)</label>
              <input 
                v-model.number="refundAmount"
                type="number"
                class="input-field"
                :max="order.totalAmount"
                min="0"
              />
              <p class="text-xs text-gray-500 mt-1">订单总金额: ¥{{ order.totalAmount.toLocaleString() }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">责任方</label>
              <div class="grid grid-cols-2 gap-2">
                <button 
                  v-for="party in ['factory', 'client', 'logistics', 'internal']" 
                  :key="party"
                  @click="refundParty = party"
                  class="p-3 rounded-lg border text-left transition-all"
                  :class="refundParty === party ? 'border-primary bg-primary/5' : 'border-gray-200'"
                >
                  <p class="text-sm font-medium text-gray-800">
                    {{ party === 'factory' ? '工厂责任' : party === 'client' ? '客户责任' : party === 'logistics' ? '物流责任' : '内部责任' }}
                  </p>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">退款原因 *</label>
              <textarea 
                v-model="refundApplyReason"
                class="input-field h-24 resize-none"
                placeholder="请详细说明退款原因，这将作为申请记录留存..."
              ></textarea>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button 
              @click="showRefundModal = false"
              class="flex-1 btn-secondary"
            >
              取消
            </button>
            <button 
              @click="submitRefund"
              class="flex-1 btn-primary"
              :disabled="refundAmount <= 0 || !refundApplyReason.trim()"
            >
              提交申请
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <ExceptionDrawer 
      :visible="drawerVisible" 
      :exception="selectedException"
      @close="drawerVisible = false"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
