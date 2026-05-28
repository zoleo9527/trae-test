<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Camera, AlertCircle, CheckCircle2, XCircle,
  Plus, AlertTriangle, Gavel
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'
import { DAMAGE_LEVEL_LABELS, LIABILITY_PARTY_LABELS } from '@/types'
import type { DamageLevel, LiabilityParty } from '@/types'
import { cn } from '@/lib/utils'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const orderStore = useOrderStore()

const orderId = computed(() => route.params.id as string)
const order = computed(() => orderStore.getOrderById(orderId.value))
const instrument = computed(() => order.value ? orderStore.getInstrumentById(order.value.instrumentId) : undefined)
const customer = computed(() => order.value ? orderStore.getCustomerById(order.value.customerId) : undefined)

const step = ref(1)
const hasDamage = ref(false)
const damageLevel = ref<DamageLevel>('none')
const damageDescription = ref('')
const liabilityParty = ref<LiabilityParty>('undetermined')
const isDisputed = ref(false)
const damagePhotos = ref<string[]>([])
const disputeReason = ref('')

const showDisputeDialog = ref(false)

function goBack() {
  router.push('/return')
}

function addPhoto() {
  damagePhotos.value.push(`damage-photo-${Date.now()}.jpg`)
}

function removePhoto(idx: number) {
  damagePhotos.value.splice(idx, 1)
}

function markDamage() {
  hasDamage.value = true
  damageLevel.value = 'moderate'
  liabilityParty.value = 'customer'
}

function clearDamage() {
  hasDamage.value = false
  damageLevel.value = 'none'
  liabilityParty.value = 'undetermined'
  damageDescription.value = ''
  damagePhotos.value = []
}

function nextStep() {
  if (step.value === 1) step.value = 2
}

function prevStep() {
  if (step.value > 1) step.value--
}

function openDisputeDialog() {
  showDisputeDialog.value = true
}

function confirmDispute() {
  if (!disputeReason.value) return
  isDisputed.value = true
  showDisputeDialog.value = false
}

function submitReturn() {
  if (!order.value) return

  orderStore.processReturn(orderId.value, {
    inspectedBy: authStore.userName,
    hasDamage: hasDamage.value,
    damageLevel: damageLevel.value,
    damageDescription: damageDescription.value || undefined,
    damagePhotos: damagePhotos.value,
    liabilityParty: liabilityParty.value,
    isDisputed: isDisputed.value,
  })

  router.push(`/orders/${orderId.value}`)
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <button
      @click="goBack"
      class="flex items-center gap-2 text-sm text-txt-muted hover:text-txt-primary transition-colors mb-6"
    >
      <ArrowLeft :size="16" />
      返回待归还列表
    </button>

    <div v-if="order" class="bg-bg-secondary rounded-xl border border-border p-6 animate-fade-in">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="text-xl font-semibold text-txt-primary">{{ order.orderNo }}</h1>
          <p class="text-sm text-txt-muted mt-1">{{ instrument?.name }} · {{ customer?.name }}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-txt-primary">押金 ¥{{ order.depositAmount.toLocaleString() }}</p>
          <p class="text-xs text-txt-muted mt-0.5">
            应还：{{ new Date(order.expectedReturnAt).toLocaleDateString() }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-4 mb-8">
        <div
          v-for="s in 2"
          :key="s"
          class="flex items-center"
        >
          <div
            :class="cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all',
              step > s
                ? 'bg-emerald-500 text-white'
                : step === s
                  ? 'bg-accent text-bg-primary'
                  : 'bg-bg-tertiary text-txt-muted'
            )"
          >
            <CheckCircle2 v-if="step > s" :size="18" />
            <span v-else>{{ s }}</span>
          </div>
          <span
            :class="cn(
              'ml-2 text-sm',
              step >= s ? 'text-txt-primary' : 'text-txt-muted'
            )"
          >
            {{ s === 1 ? '外观检查' : '确认提交' }}
          </span>
          <div v-if="s < 2" :class="cn('w-20 h-0.5 mx-4', step > s ? 'bg-emerald-500' : 'bg-border')" />
        </div>
      </div>

      <div v-if="step === 1" class="space-y-6">
        <div>
          <h3 class="text-sm font-medium text-txt-secondary mb-4">乐器外观检查</h3>

          <div class="flex gap-3 mb-6">
            <button
              @click="clearDamage"
              :class="cn(
                'flex-1 px-4 py-4 rounded-xl border text-sm font-medium transition-all',
                !hasDamage
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                  : 'border-border bg-bg-tertiary text-txt-muted hover:text-txt-primary'
              )"
            >
              <CheckCircle2 :size="20" class="mx-auto mb-2" />
              完好无损
            </button>
            <button
              @click="markDamage"
              :class="cn(
                'flex-1 px-4 py-4 rounded-xl border text-sm font-medium transition-all',
                hasDamage
                  ? 'border-red-500/50 bg-red-500/10 text-red-400'
                  : 'border-border bg-bg-tertiary text-txt-muted hover:text-txt-primary'
              )"
            >
              <AlertCircle :size="20" class="mx-auto mb-2" />
              存在损坏
            </button>
          </div>

          <div v-if="hasDamage" class="space-y-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <div class="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle :size="16" />
              <span class="text-sm font-medium">损坏详情</span>
            </div>

            <div>
              <label class="block text-sm text-txt-secondary mb-2">损坏程度</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="level in ['minor', 'moderate', 'severe'] as DamageLevel[]"
                  :key="level"
                  @click="damageLevel = level"
                  :class="cn(
                    'px-3 py-2 rounded-lg border text-sm transition-all',
                    damageLevel === level
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-bg-tertiary text-txt-muted hover:text-txt-primary'
                  )"
                >
                  {{ DAMAGE_LEVEL_LABELS[level] }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm text-txt-secondary mb-2">责任判定</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="party in ['customer', 'natural_wear', 'quality_issue', 'undetermined'] as LiabilityParty[]"
                  :key="party"
                  @click="liabilityParty = party"
                  :class="cn(
                    'px-3 py-2 rounded-lg border text-sm transition-all',
                    liabilityParty === party
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-bg-tertiary text-txt-muted hover:text-txt-primary'
                  )"
                >
                  {{ LIABILITY_PARTY_LABELS[party] }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm text-txt-secondary mb-2">损坏描述</label>
              <textarea
                v-model="damageDescription"
                placeholder="请详细描述损坏情况..."
                rows="3"
                class="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 resize-none"
              />
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm text-txt-secondary">拍照留证</label>
                <button
                  @click="addPhoto"
                  class="flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
                >
                  <Plus :size="12" />
                  添加照片
                </button>
              </div>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(photo, idx) in damagePhotos"
                  :key="idx"
                  class="relative w-20 h-20 rounded-lg bg-bg-tertiary border border-border overflow-hidden"
                >
                  <Camera :size="24" class="absolute inset-0 m-auto text-txt-muted" />
                  <button
                    @click="removePhoto(idx)"
                    class="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                  >
                    <XCircle :size="12" />
                  </button>
                </div>
                <div v-if="damagePhotos.length === 0" class="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <Camera :size="20" class="text-txt-muted" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-4 border-t border-border">
          <button
            @click="nextStep"
            class="px-6 py-2.5 rounded-xl bg-accent text-bg-primary text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            下一步
          </button>
        </div>
      </div>

      <div v-if="step === 2" class="space-y-6">
        <div class="p-4 bg-bg-tertiary rounded-xl">
          <h3 class="text-sm font-medium text-txt-secondary mb-3">验收概况</h3>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <p class="text-xs text-txt-muted mb-1">损坏情况</p>
              <p :class="cn(
                'text-sm font-medium',
                hasDamage ? 'text-red-400' : 'text-emerald-400'
              )">
                {{ hasDamage ? '存在损坏' : '完好无损' }}
              </p>
            </div>
            <div v-if="hasDamage">
              <p class="text-xs text-txt-muted mb-1">损坏程度</p>
              <p class="text-sm font-medium text-txt-primary">
                {{ DAMAGE_LEVEL_LABELS[damageLevel] }}
              </p>
            </div>
            <div v-if="hasDamage">
              <p class="text-xs text-txt-muted mb-1">责任判定</p>
              <p class="text-sm font-medium text-txt-primary">
                {{ LIABILITY_PARTY_LABELS[liabilityParty] }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="hasDamage && damageDescription" class="p-4 bg-bg-tertiary rounded-xl">
          <h3 class="text-sm font-medium text-txt-secondary mb-2">损坏描述</h3>
          <p class="text-sm text-txt-primary">{{ damageDescription }}</p>
        </div>

        <div class="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div class="flex items-start gap-3">
            <AlertTriangle :size="18" class="text-amber-400 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <p class="text-sm text-amber-400 font-medium">客户是否有异议？</p>
              <p class="text-xs text-txt-muted mt-1">如客户对损坏判定有异议，请标记争议，由老板最终裁定</p>
            </div>
            <button
              @click="isDisputed ? (isDisputed = false) : openDisputeDialog"
              :class="cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                isDisputed
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-bg-tertiary text-txt-muted hover:text-txt-primary'
              )"
            >
              {{ isDisputed ? '已标记争议' : '标记争议' }}
            </button>
          </div>
        </div>

        <div class="flex justify-between pt-4 border-t border-border">
          <button
            @click="prevStep"
            class="px-6 py-2.5 rounded-xl border border-border text-txt-secondary text-sm hover:bg-bg-tertiary transition-colors"
          >
            上一步
          </button>
          <button
            @click="submitReturn"
            class="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            确认归还
          </button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :show="showDisputeDialog"
      title="标记争议"
      message="标记后订单将进入争议状态，由门店老板裁定责任方。"
      @confirm="confirmDispute"
      @cancel="showDisputeDialog = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-txt-secondary mb-2">争议原因</label>
          <textarea
            v-model="disputeReason"
            placeholder="请描述客户异议..."
            rows="3"
            class="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 resize-none"
          />
        </div>
        <p class="text-xs text-txt-muted">
          标记后订单将进入争议状态，由门店老板裁定责任方
        </p>
      </div>
    </ConfirmDialog>
  </div>
</template>
