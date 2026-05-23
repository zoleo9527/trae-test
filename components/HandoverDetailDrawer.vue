<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="fixed inset-0 z-50" @click.self="handleClose">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose"></div>
        <Transition name="slide-right">
          <div
            v-if="visible && record"
            class="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col"
          >
            <div class="flex items-center justify-between px-6 py-4 border-b border-gold-100 bg-gold-50/30">
              <div>
                <h3 class="font-display text-lg font-semibold text-gray-800">交接详情</h3>
                <p class="text-sm text-gray-500 mt-0.5">{{ record.orderNo }} · {{ record.customerName }}</p>
              </div>
              <button
                @click="handleClose"
                class="p-2 hover:bg-white rounded-lg transition-colors shadow-sm"
              >
                <X class="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto p-6 space-y-6">
              <div class="flex items-center gap-4">
                <div :class="[
                  'w-14 h-14 rounded-xl flex items-center justify-center',
                  record.type === 'receive' ? 'bg-blue-100' :
                  record.type === 'deliver' ? 'bg-forest-100' :
                  record.type === 'transfer' ? 'bg-purple-100' : 'bg-coral-100'
                ]">
                  <Package :class="[
                    'w-7 h-7',
                    record.type === 'receive' ? 'text-blue-600' :
                    record.type === 'deliver' ? 'text-forest-600' :
                    record.type === 'transfer' ? 'text-purple-600' : 'text-coral-600'
                  ]" />
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <StatusBadge :label="getHandoverTypeLabel(record.type)" :variant="getHandoverTypeVariant(record.type)" />
                  </div>
                  <p class="text-sm text-gray-500 mt-1">{{ formatDateTime(record.timestamp) }}</p>
                </div>
              </div>

              <div class="bg-gray-50 rounded-xl p-4">
                <p class="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">交接流程</p>
                <div class="flex items-center gap-3">
                  <div class="flex-1">
                    <p class="text-xs text-gray-400 mb-1">移交方</p>
                    <p class="font-semibold text-gray-800">{{ record.fromParty }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center flex-shrink-0">
                    <ArrowRight class="w-5 h-5 text-gold-600" />
                  </div>
                  <div class="flex-1 text-right">
                    <p class="text-xs text-gray-400 mb-1">接收方</p>
                    <p class="font-semibold text-gray-800">{{ record.toParty }}</p>
                  </div>
                </div>
              </div>

              <BaseCard gold>
                <template #header>
                  <p class="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Package class="w-4 h-4 text-gold-600" />
                    货品清单
                  </p>
                </template>
                <div class="space-y-2">
                  <div
                    v-for="(item, idx) in record.items"
                    :key="idx"
                    class="flex items-center justify-between py-2 border-b border-gold-50 last:border-0"
                  >
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-800">{{ item.name }}</p>
                      <p v-if="item.description" class="text-xs text-gray-500 mt-0.5">{{ item.description }}</p>
                    </div>
                    <span class="text-sm text-gold-600 font-semibold">x{{ item.quantity }}</span>
                  </div>
                </div>
              </BaseCard>

              <div>
                <p class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <ShieldCheck class="w-4 h-4 text-forest-600" />
                  留痕摘要
                </p>
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center gap-2 text-gray-600">
                      <Image class="w-4 h-4" />
                      <span class="text-sm">照片留痕</span>
                    </div>
                    <p class="text-lg font-bold text-gray-800 mt-1">{{ record.photos.length }} 张</p>
                  </div>
                  <div :class="[
                    'rounded-lg p-3',
                    record.signature ? 'bg-forest-50' : 'bg-gray-50'
                  ]">
                    <div class="flex items-center gap-2">
                      <PenTool :class="[
                        'w-4 h-4',
                        record.signature ? 'text-forest-600' : 'text-gray-400'
                      ]" />
                      <span :class="[
                        'text-sm',
                        record.signature ? 'text-forest-600' : 'text-gray-500'
                      ]">签名确认</span>
                    </div>
                    <p v-if="record.signature" class="text-lg font-bold text-forest-700 mt-1">{{ record.signature }}</p>
                    <p v-else class="text-sm text-gray-400 mt-1">未签名</p>
                  </div>
                </div>
              </div>

              <div v-if="record.remark" class="bg-blue-50 rounded-xl p-4">
                <p class="text-xs text-blue-500 mb-2 font-medium uppercase tracking-wider">备注</p>
                <p class="text-sm text-gray-700">{{ record.remark }}</p>
              </div>

              <div class="pt-4 border-t border-gray-100">
                <p class="text-xs text-gray-400 mb-2">交接记录 ID</p>
                <p class="text-sm text-gray-600 font-mono">{{ record.id }}</p>
              </div>
            </div>

            <div class="p-6 border-t border-gray-100 bg-gray-50 space-y-3">
              <BaseButton
                class="w-full"
                variant="secondary"
                @click="navigateToOrder"
              >
                <FileText class="w-4 h-4 mr-2" />
                查看关联订单
              </BaseButton>
              <BaseButton
                class="w-full"
                variant="ghost"
                @click="handleClose"
              >
                关闭
              </BaseButton>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X, Package, ArrowRight, Image, PenTool, ShieldCheck, FileText } from 'lucide-vue-next'
import StatusBadge from './StatusBadge.vue'
import BaseCard from './BaseCard.vue'
import BaseButton from './BaseButton.vue'
import { useFormat } from '~/composables/useFormat'
import type { HandoverRecord, HandoverType } from '~/types'

interface Props {
  visible: boolean
  record: HandoverRecord | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const { formatDateTime, getHandoverTypeLabel } = useFormat()

const getHandoverTypeVariant = (type: HandoverType): string => {
  const map: Record<HandoverType, string> = {
    receive: 'info',
    deliver: 'success',
    transfer: 'gold',
    return: 'danger',
  }
  return map[type] || 'default'
}

const handleClose = () => {
  emit('close')
}

const navigateToOrder = () => {
  if (props.record) {
    navigateTo(`/orders/${props.record.orderId}?handoverId=${props.record.id}`)
    handleClose()
  }
}
</script>
