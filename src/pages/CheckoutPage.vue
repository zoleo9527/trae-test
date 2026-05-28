<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Search, Package, User, Calendar, DollarSign,
  Building2, CheckCircle2, Camera, Plus, X
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'
import { INSTRUMENT_TYPE_LABELS } from '@/types'
import type { Instrument, Customer } from '@/types'
import { cn } from '@/lib/utils'

const router = useRouter()
const authStore = useAuthStore()
const orderStore = useOrderStore()

const step = ref(1)
const selectedInstrument = ref<Instrument | null>(null)
const selectedCustomer = ref<Customer | null>(null)
const instrumentSearch = ref('')
const customerSearch = ref('')
const customerType = ref<'individual' | 'school'>('individual')

const depositAmount = ref(0)
const rentalDays = ref(30)
const expectedReturnDate = ref('')
const schoolCooperation = ref(false)
const schoolInstallments = ref(1)
const checkoutPhotos = ref<string[]>([])

const filteredInstruments = computed(() => {
  const available = orderStore.getAvailableInstruments()
  if (!instrumentSearch.value) return available
  const q = instrumentSearch.value.toLowerCase()
  return available.filter(i =>
    i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q)
  )
})

const filteredCustomers = computed(() => {
  const customers = orderStore.customers.filter(c =>
    customerType.value === 'school' ? c.type === 'school' : c.type !== 'school'
  )
  if (!customerSearch.value) return customers
  const q = customerSearch.value.toLowerCase()
  return customers.filter(c => c.name.toLowerCase().includes(q))
})

const totalRentalFee = computed(() => {
  if (!selectedInstrument.value) return 0
  return selectedInstrument.value.dailyRate * rentalDays.value
})

const schoolInstallmentAmount = computed(() => {
  return Math.round((depositAmount.value + totalRentalFee.value) / schoolInstallments.value)
})

function selectInstrument(inst: Instrument) {
  selectedInstrument.value = inst
  depositAmount.value = Math.round(inst.dailyRate * 30)
}

function selectCustomer(cust: Customer) {
  selectedCustomer.value = cust
  if (cust.type === 'school') {
    schoolCooperation.value = true
    customerType.value = 'school'
  }
}

function goBack() {
  router.push('/orders')
}

function nextStep() {
  if (step.value === 1 && selectedInstrument.value) step.value = 2
  else if (step.value === 2 && selectedCustomer.value) step.value = 3
  else if (step.value === 3 && depositAmount.value > 0 && expectedReturnDate.value) step.value = 4
}

function prevStep() {
  if (step.value > 1) step.value--
}

function addPhoto() {
  checkoutPhotos.value.push(`checkout-photo-${Date.now()}.jpg`)
}

function removePhoto(idx: number) {
  checkoutPhotos.value.splice(idx, 1)
}

function submitOrder() {
  if (!selectedInstrument.value || !selectedCustomer.value) return

  const order = orderStore.createOrder({
    instrumentId: selectedInstrument.value.id,
    customerId: selectedCustomer.value.id,
    depositAmount: depositAmount.value,
    rentalFee: totalRentalFee.value,
    expectedReturnAt: new Date(expectedReturnDate.value).toISOString(),
    checkoutBy: authStore.userName,
    schoolCooperation: schoolCooperation.value,
    schoolPaymentSchedule: schoolCooperation.value
      ? Array.from({ length: schoolInstallments.value }, (_, i) => {
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + (i + 1) * Math.round(rentalDays.value / schoolInstallments.value))
          return {
            installment: i + 1,
            amount: schoolInstallmentAmount.value,
            dueDate: dueDate.toISOString(),
            status: 'pending' as const,
          }
        })
      : undefined,
    checkoutPhotos: checkoutPhotos.value,
  })

  router.push(`/orders/${order.id}`)
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <button
      @click="goBack"
      class="flex items-center gap-2 text-sm text-txt-muted hover:text-txt-primary transition-colors mb-6"
    >
      <ArrowLeft :size="16" />
      返回订单列表
    </button>

    <div class="bg-bg-secondary rounded-xl border border-border p-6 animate-fade-in">
      <h1 class="text-xl font-semibold text-txt-primary mb-6">租出办理</h1>

      <div class="flex items-center gap-4 mb-8">
        <div
          v-for="s in 4"
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
            {{ s === 1 ? '选择乐器' : s === 2 ? '选择客户' : s === 3 ? '租赁信息' : '确认办理' }}
          </span>
          <div v-if="s < 4" :class="cn('w-16 h-0.5 mx-4', step > s ? 'bg-emerald-500' : 'bg-border')" />
        </div>
      </div>

      <div v-if="step === 1" class="space-y-4">
        <div class="relative">
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
          <input
            v-model="instrumentSearch"
            type="text"
            placeholder="搜索乐器名称、品牌..."
            class="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        <div class="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          <div
            v-for="inst in filteredInstruments"
            :key="inst.id"
            @click="selectInstrument(inst)"
            :class="cn(
              'p-4 rounded-xl border cursor-pointer transition-all',
              selectedInstrument?.id === inst.id
                ? 'border-accent bg-accent/5'
                : 'border-border bg-bg-tertiary hover:border-accent/30'
            )"
          >
            <div class="flex items-start gap-3">
              <img
                :src="inst.imageUrl"
                :alt="inst.name"
                class="w-16 h-16 rounded-lg object-cover"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-txt-primary truncate">{{ inst.name }}</p>
                <p class="text-xs text-txt-muted mt-0.5">{{ inst.brand }} · {{ INSTRUMENT_TYPE_LABELS[inst.type] }}</p>
                <p class="text-sm font-semibold text-accent mt-2">¥{{ inst.dailyRate }}/天</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredInstruments.length === 0" class="text-center py-12">
          <Package :size="32" class="mx-auto mb-3 text-txt-muted" />
          <p class="text-txt-muted">暂无可用乐器</p>
        </div>
      </div>

      <div v-if="step === 2" class="space-y-4">
        <div class="flex gap-2">
          <button
            @click="customerType = 'individual'"
            :class="cn(
              'flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              customerType === 'individual'
                ? 'bg-accent text-bg-primary'
                : 'bg-bg-tertiary text-txt-muted hover:text-txt-primary'
            )"
          >
            个人客户
          </button>
          <button
            @click="customerType = 'school'"
            :class="cn(
              'flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              customerType === 'school'
                ? 'bg-accent text-bg-primary'
                : 'bg-bg-tertiary text-txt-muted hover:text-txt-primary'
            )"
          >
            <span class="flex items-center justify-center gap-2">
              <Building2 :size="14" />
              学校/机构
            </span>
          </button>
        </div>

        <div class="relative">
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
          <input
            v-model="customerSearch"
            type="text"
            placeholder="搜索客户名称..."
            class="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        <div class="space-y-2 max-h-80 overflow-y-auto">
          <div
            v-for="cust in filteredCustomers"
            :key="cust.id"
            @click="selectCustomer(cust)"
            :class="cn(
              'flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all',
              selectedCustomer?.id === cust.id
                ? 'border-accent bg-accent/5'
                : 'border-border bg-bg-tertiary hover:border-accent/30'
            )"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-bg-primary flex items-center justify-center">
                <User :size="18" class="text-txt-muted" />
              </div>
              <div>
                <p class="text-sm font-medium text-txt-primary">{{ cust.name }}</p>
                <p class="text-xs text-txt-muted">{{ cust.phone }}</p>
              </div>
            </div>
            <div v-if="cust.type === 'school'" class="px-2 py-1 rounded-full bg-violet-500/15 text-violet-400 text-xs">
              学校合作
            </div>
          </div>
        </div>
      </div>

      <div v-if="step === 3" class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-txt-secondary mb-2">押金金额</label>
            <div class="relative">
              <DollarSign :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
              <input
                v-model.number="depositAmount"
                type="number"
                placeholder="0"
                class="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm text-txt-secondary mb-2">租赁天数</label>
            <div class="relative">
              <Calendar :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
              <input
                v-model.number="rentalDays"
                type="number"
                placeholder="30"
                class="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm text-txt-secondary mb-2">预计归还日期</label>
          <input
            v-model="expectedReturnDate"
            type="date"
            class="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        <div v-if="selectedCustomer?.type !== 'school'" class="flex items-center gap-3">
          <input
            v-model="schoolCooperation"
            type="checkbox"
            id="schoolCoop"
            class="w-4 h-4 rounded border-border bg-bg-tertiary text-accent focus:ring-accent/50"
          />
          <label for="schoolCoop" class="text-sm text-txt-secondary">学校合作订单（分期付款）</label>
        </div>

        <div v-if="schoolCooperation" class="p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl space-y-4">
          <h3 class="text-sm font-medium text-violet-400">学校分期付款设置</h3>
          <div>
            <label class="block text-sm text-txt-secondary mb-2">分期期数</label>
            <select
              v-model.number="schoolInstallments"
              class="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary focus:outline-none focus:border-accent/50 transition-colors"
            >
              <option :value="1">1期（一次性付清）</option>
              <option :value="2">2期</option>
              <option :value="3">3期</option>
            </select>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-txt-muted">每期金额</span>
            <span class="text-txt-primary font-medium">¥{{ schoolInstallmentAmount.toLocaleString() }}</span>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm text-txt-secondary">租前拍照留证</label>
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
              v-for="(photo, idx) in checkoutPhotos"
              :key="idx"
              class="relative w-20 h-20 rounded-lg bg-bg-tertiary border border-border overflow-hidden"
            >
              <Camera :size="24" class="absolute inset-0 m-auto text-txt-muted" />
              <button
                @click="removePhoto(idx)"
                class="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <X :size="12" />
              </button>
            </div>
            <div v-if="checkoutPhotos.length === 0" class="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
              <Camera :size="20" class="text-txt-muted" />
            </div>
          </div>
        </div>

        <div class="p-4 bg-bg-tertiary rounded-xl">
          <div class="flex justify-between text-sm mb-2">
            <span class="text-txt-muted">租金（{{ rentalDays }}天 × ¥{{ selectedInstrument?.dailyRate }}）</span>
            <span class="text-txt-primary">¥{{ totalRentalFee.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-txt-muted">押金</span>
            <span class="text-txt-primary">¥{{ depositAmount.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between text-sm font-medium pt-2 border-t border-border">
            <span class="text-txt-primary">合计应收</span>
            <span class="text-accent">¥{{ (depositAmount + totalRentalFee).toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <div v-if="step === 4" class="space-y-6">
        <div class="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
          <CheckCircle2 :size="48" class="mx-auto mb-3 text-emerald-400" />
          <h3 class="text-lg font-semibold text-emerald-400">信息确认无误</h3>
          <p class="text-sm text-txt-muted mt-1">确认后将完成租出办理</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="p-4 bg-bg-tertiary rounded-xl">
            <p class="text-xs text-txt-muted mb-1">租赁乐器</p>
            <p class="text-sm font-medium text-txt-primary">{{ selectedInstrument?.name }}</p>
          </div>
          <div class="p-4 bg-bg-tertiary rounded-xl">
            <p class="text-xs text-txt-muted mb-1">客户</p>
            <p class="text-sm font-medium text-txt-primary">{{ selectedCustomer?.name }}</p>
          </div>
          <div class="p-4 bg-bg-tertiary rounded-xl">
            <p class="text-xs text-txt-muted mb-1">租赁期限</p>
            <p class="text-sm font-medium text-txt-primary">{{ rentalDays }}天</p>
          </div>
          <div class="p-4 bg-bg-tertiary rounded-xl">
            <p class="text-xs text-txt-muted mb-1">押金</p>
            <p class="text-sm font-medium text-txt-primary">¥{{ depositAmount.toLocaleString() }}</p>
          </div>
        </div>
      </div>

      <div class="flex justify-between mt-8 pt-6 border-t border-border">
        <button
          v-if="step > 1"
          @click="prevStep"
          class="px-6 py-2.5 rounded-xl border border-border text-txt-secondary text-sm hover:bg-bg-tertiary transition-colors"
        >
          上一步
        </button>
        <div v-else />

        <button
          v-if="step < 4"
          @click="nextStep"
          :disabled="(step === 1 && !selectedInstrument) || (step === 2 && !selectedCustomer) || (step === 3 && (!depositAmount || !expectedReturnDate))"
          class="px-6 py-2.5 rounded-xl bg-accent text-bg-primary text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一步
        </button>
        <button
          v-else
          @click="submitOrder"
          class="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
        >
          确认租出
        </button>
      </div>
    </div>
  </div>
</template>
