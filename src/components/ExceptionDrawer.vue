<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useOrderStore } from '@/stores/order'
import { useUserStore } from '@/stores/user'
import type { Exception, SampleVersion, ShipmentItem, ResponsibleParty } from '@/types'
import { X, AlertTriangle, Package, DollarSign, Check, XCircle, RefreshCw, Send } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  exception: Exception | null
}>()

const emit = defineEmits<{
  close: []
}>()

const orderStore = useOrderStore()
const userStore = useUserStore()

const order = computed(() => {
  if (!props.exception) return null
  return orderStore.getOrderById(props.exception.orderId)
})

const oldVersion = computed<SampleVersion | undefined>(() => {
  if (!props.exception || !props.exception.oldVersionId || !order.value) return undefined
  return order.value.sampleVersions.find(v => v.id === props.exception!.oldVersionId)
})

const newVersion = computed<SampleVersion | undefined>(() => {
  if (!props.exception || !props.exception.newVersionId || !order.value) return undefined
  return order.value.sampleVersions.find(v => v.id === props.exception!.newVersionId)
})

const shipmentItems = computed<ShipmentItem[]>(() => {
  if (!order.value) return []
  return order.value.shipments.flatMap(s => s.items.filter(i => i.isMissing))
})

const specDifferences = computed(() => {
  if (!oldVersion.value || !newVersion.value) return []
  const diffs: Array<{ key: string; oldVal: string; newVal: string }> = []
  for (const key of Object.keys(newVersion.value.specs)) {
    if (oldVersion.value.specs[key] !== newVersion.value.specs[key]) {
      diffs.push({
        key,
        oldVal: oldVersion.value.specs[key],
        newVal: newVersion.value.specs[key]
      })
    }
  }
  return diffs
})

const resolveReason = ref('')
const responsibleParty = ref<ResponsibleParty>('factory')
const refundRemark = ref('')

watch(() => props.exception, () => {
  resolveReason.value = ''
  refundRemark.value = ''
  if (props.exception?.refundChain) {
    responsibleParty.value = props.exception.refundChain.responsibleParty
  }
})

const handleResolve = () => {
  if (!props.exception) return
  orderStore.resolveException(props.exception.id, resolveReason.value)
  emit('close')
}

const handleApproveRefund = (approved: boolean) => {
  if (!props.exception) return
  orderStore.approveRefund(props.exception.id, approved)
  emit('close')
}

const exceptionTypeInfo = computed(() => {
  if (!props.exception) return { icon: AlertTriangle, title: '异常处理', color: 'text-amber-500' }
  switch (props.exception.type) {
    case 'version_overwrite':
      return { icon: RefreshCw, title: '版本覆盖告警', color: 'text-amber-500' }
    case 'shipment_missing':
      return { icon: Package, title: '拆单漏件检测', color: 'text-red-500' }
    case 'refund_required':
      return { icon: DollarSign, title: '退款责任链', color: 'text-amber-500' }
    default:
      return { icon: AlertTriangle, title: '异常处理', color: 'text-amber-500' }
  }
})

const responsiblePartyOptions = [
  { value: 'factory', label: '工厂责任', desc: '生产质量、交期问题' },
  { value: 'client', label: '客户责任', desc: '客户变更、拒收' },
  { value: 'logistics', label: '物流责任', desc: '运输损坏、丢失' },
  { value: 'internal', label: '内部责任', desc: '跟单、操作失误' }
]
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="visible" 
        class="fixed inset-0 bg-black/50 z-40"
        @click="emit('close')"
      ></div>
    </Transition>
    <Transition name="slide">
      <div 
        v-if="visible"
        class="fixed right-0 top-0 h-full w-[520px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right"
      >
        <div v-if="exception" class="flex flex-col h-full">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <div :class="['p-2 rounded-lg bg-gray-50', exceptionTypeInfo.color]">
                <component :is="exceptionTypeInfo.icon" class="w-5 h-5" />
              </div>
              <div>
                <h2 class="font-semibold text-gray-800">{{ exceptionTypeInfo.title }}</h2>
                <p class="text-xs text-gray-500">{{ order?.orderNo }}</p>
              </div>
            </div>
            <button 
              @click="emit('close')"
              class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X class="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div class="flex-1 overflow-auto p-6">
            <div class="mb-6">
              <div class="flex items-center gap-2 mb-2">
                <span 
                  v-if="exception.severity === 'critical'" 
                  class="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full animate-pulse-slow"
                >
                  <AlertTriangle class="w-3 h-3" />
                  紧急
                </span>
                <span v-else class="px-2 py-1 bg-amber-100 text-amber-600 text-xs font-medium rounded-full">
                  警告
                </span>
                <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  {{ exception.status === 'pending' ? '待处理' : exception.status === 'processing' ? '处理中' : '已解决' }}
                </span>
              </div>
              <p class="text-gray-700">{{ exception.description }}</p>
              <p class="text-xs text-gray-400 mt-1">
                创建时间: {{ new Date(exception.createdAt).toLocaleString('zh-CN') }}
              </p>
            </div>

            <div v-if="exception.type === 'version_overwrite' && oldVersion && newVersion" class="space-y-6">
              <h3 class="font-medium text-gray-800">版本对比</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded">
                      v{{ oldVersion.version }} (旧版)
                    </span>
                  </div>
                  <img :src="oldVersion.photoUrl" class="w-full h-32 object-cover rounded-lg mb-3" />
                  <div class="space-y-2">
                    <div v-for="(val, key) in oldVersion.specs" :key="key" class="text-sm">
                      <span class="text-gray-500">{{ key }}:</span>
                      <span 
                        class="ml-2 font-medium"
                        :class="specDifferences.find(d => d.key === key) ? 'text-red-500 line-through' : 'text-gray-800'"
                      >{{ val }}</span>
                    </div>
                  </div>
                </div>
                <div class="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded">
                      v{{ newVersion.version }} (新版)
                    </span>
                  </div>
                  <img :src="newVersion.photoUrl" class="w-full h-32 object-cover rounded-lg mb-3" />
                  <div class="space-y-2">
                    <div v-for="(val, key) in newVersion.specs" :key="key" class="text-sm">
                      <span class="text-gray-500">{{ key }}:</span>
                      <span 
                        class="ml-2 font-medium"
                        :class="specDifferences.find(d => d.key === key) ? 'text-green-600 bg-green-100 px-1 rounded' : 'text-gray-800'"
                      >{{ val }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="newVersion.changeReason" class="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p class="text-sm text-amber-700">
                  <span class="font-medium">变更原因:</span> {{ newVersion.changeReason }}
                </p>
              </div>
              <div v-if="exception.status !== 'resolved'" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">确认处理备注</label>
                  <textarea 
                    v-model="resolveReason"
                    class="input-field h-24 resize-none"
                    placeholder="请填写处理确认说明..."
                  ></textarea>
                </div>
                <button 
                  @click="handleResolve"
                  class="w-full btn-primary flex items-center justify-center gap-2"
                  :disabled="!resolveReason.trim()"
                >
                  <Check class="w-4 h-4" />
                  确认版本变更并关闭异常
                </button>
              </div>
            </div>

            <div v-if="exception.type === 'shipment_missing'" class="space-y-6">
              <h3 class="font-medium text-gray-800">漏件明细</h3>
              <div class="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
                <table class="w-full">
                  <thead class="bg-red-100">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-red-700">商品</th>
                      <th class="px-4 py-3 text-center text-xs font-medium text-red-700">应发</th>
                      <th class="px-4 py-3 text-center text-xs font-medium text-red-700">实发</th>
                      <th class="px-4 py-3 text-center text-xs font-medium text-red-700">差异</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in shipmentItems" :key="item.id" class="border-t border-red-100">
                      <td class="px-4 py-3 text-sm text-gray-800">{{ item.skuName }}</td>
                      <td class="px-4 py-3 text-center text-sm text-gray-600">{{ item.expectedQty }}</td>
                      <td class="px-4 py-3 text-center text-sm text-gray-600">{{ item.actualQty }}</td>
                      <td class="px-4 py-3 text-center text-sm font-medium text-red-600">
                        -{{ item.expectedQty - item.actualQty }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="exception.status !== 'resolved'" class="space-y-4">
                <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p class="text-sm text-amber-700">
                    <span class="font-medium">建议动作:</span> 
                    立即联系工厂补发漏件，生成补发货工单，并同步更新物流信息给客户。
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">处理措施</label>
                  <textarea 
                    v-model="resolveReason"
                    class="input-field h-24 resize-none"
                    placeholder="请填写补发安排或处理措施..."
                  ></textarea>
                </div>
                <button 
                  @click="handleResolve"
                  class="w-full btn-primary flex items-center justify-center gap-2"
                  :disabled="!resolveReason.trim()"
                >
                  <Send class="w-4 h-4" />
                  记录处理措施并标记解决
                </button>
              </div>
            </div>

            <div v-if="exception.type === 'refund_required' && exception.refundChain" class="space-y-6">
              <h3 class="font-medium text-gray-800">退款审批流程</h3>
              
              <div class="p-4 bg-gray-50 rounded-xl">
                <div class="flex justify-between items-center mb-4">
                  <span class="text-gray-600">退款金额</span>
                  <span class="text-2xl font-bold text-red-500">
                    ¥{{ exception.refundChain.amount.toLocaleString() }}
                  </span>
                </div>
                <div v-if="exception.refundChain.remark" class="text-sm text-gray-600">
                  <span class="font-medium">退款原因:</span> {{ exception.refundChain.remark }}
                </div>
              </div>

              <div class="space-y-3">
                <p class="text-sm font-medium text-gray-700">责任方认定</p>
                <div class="grid grid-cols-2 gap-3">
                  <button 
                    v-for="opt in responsiblePartyOptions" 
                    :key="opt.value"
                    @click="responsibleParty = opt.value as ResponsibleParty"
                    class="p-3 rounded-lg border-2 text-left transition-all"
                    :class="responsibleParty === opt.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'"
                    :disabled="exception.status === 'resolved'"
                  >
                    <p class="font-medium text-sm text-gray-800">{{ opt.label }}</p>
                    <p class="text-xs text-gray-500">{{ opt.desc }}</p>
                  </button>
                </div>
              </div>

              <div class="flex items-center gap-4 p-4 rounded-lg" 
                   :class="exception.refundChain.approvalStatus === 'approved' ? 'bg-green-50' : exception.refundChain.approvalStatus === 'rejected' ? 'bg-red-50' : 'bg-gray-50'">
                <div v-if="exception.refundChain.approvalStatus === 'pending'" class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle class="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p class="font-medium text-amber-700">待审批</p>
                    <p class="text-xs text-amber-600">请项目商务审批确认</p>
                  </div>
                </div>
                <div v-else class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center"
                       :class="exception.refundChain.approvalStatus === 'approved' ? 'bg-green-100' : 'bg-red-100'">
                    <Check v-if="exception.refundChain.approvalStatus === 'approved'" class="w-4 h-4 text-green-600" />
                    <XCircle v-else class="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p class="font-medium" :class="exception.refundChain.approvalStatus === 'approved' ? 'text-green-700' : 'text-red-700'">
                      {{ exception.refundChain.approvalStatus === 'approved' ? '已通过' : '已拒绝' }}
                    </p>
                    <p class="text-xs text-gray-500">
                      审批人: {{ exception.refundChain.approver }} · 
                      {{ exception.refundChain.approvedAt ? new Date(exception.refundChain.approvedAt).toLocaleDateString('zh-CN') : '' }}
                    </p>
                  </div>
                </div>
              </div>

              <div v-if="exception.refundChain.approvalStatus === 'pending' && userStore.currentUser.role === 'business'" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">审批备注</label>
                  <textarea 
                    v-model="refundRemark"
                    class="input-field h-20 resize-none"
                    placeholder="可选：填写审批意见..."
                  ></textarea>
                </div>
                <div class="flex gap-3">
                  <button 
                    @click="handleApproveRefund(false)"
                    class="flex-1 btn-danger flex items-center justify-center gap-2"
                  >
                    <XCircle class="w-4 h-4" />
                    拒绝
                  </button>
                  <button 
                    @click="handleApproveRefund(true)"
                    class="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    <Check class="w-4 h-4" />
                    通过
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease-out;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
