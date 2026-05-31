<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">新建申领单</h1>
        <p class="text-gray-500 mt-1">选择项目和耗材，提交申领</p>
      </div>
      <NuxtLink
        to="/supplies/requisitions"
        class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回列表
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                申领项目 <span class="text-red-500">*</span>
              </label>
              <select
                v-model="selectedProjectId"
                class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">请选择项目</option>
                <option v-for="project in projects" :key="project.id" :value="project.id">
                  {{ project.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                申领日期
              </label>
              <input
                :value="today"
                disabled
                class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">申领明细</h2>
            <button
              @click="() => addItem()"
              class="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              添加耗材
            </button>
          </div>

          <div v-if="items.length === 0" class="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
            <span class="text-5xl mb-4 block">📦</span>
            <p class="text-gray-500">暂无申领明细</p>
            <button
              @click="() => addItem()"
              class="mt-4 px-4 py-2 bg-primary-500 text-white hover:bg-primary-600 rounded-lg transition-colors text-sm font-medium"
            >
              添加第一项耗材
            </button>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(item, index) in items"
              :key="index"
              class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div class="flex-1">
                <select
                  v-model="item.supplyId"
                  @change="handleSupplyChange(index)"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择耗材</option>
                  <option
                    v-for="supply in availableSupplies"
                    :key="supply.id"
                    :value="supply.id"
                    :disabled="isSupplySelected(supply.id, index)"
                  >
                    {{ supply.name }} (库存: {{ supply.currentStock }}{{ supply.unit }})
                  </option>
                </select>
              </div>
              <div class="w-32">
                <input
                  v-model.number="item.quantity"
                  type="number"
                  min="1"
                  placeholder="数量"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div class="w-24 text-sm text-gray-600 text-center">
                {{ getSupplyUnit(item.supplyId) }}
              </div>
              <div class="w-28 text-sm font-medium text-gray-900 text-right">
                {{ formatCurrency(getItemAmount(item)) }}
              </div>
              <button
                @click="removeItem(index)"
                class="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">备注</h2>
          <textarea
            v-model="note"
            placeholder="请输入备注信息（选填）..."
            class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows="3"
          ></textarea>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">申领汇总</h2>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">耗材项数</span>
              <span class="font-medium text-gray-900">{{ items.length }} 项</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">总数量</span>
              <span class="font-medium text-gray-900">{{ totalQuantity }} 件</span>
            </div>
            <div class="border-t border-gray-100 pt-4">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">合计金额</span>
                <span class="text-2xl font-bold text-primary-600">{{ formatCurrency(totalAmount) }}</span>
              </div>
            </div>
          </div>

          <div class="mt-6 space-y-3">
            <button
              @click="submitRequisition"
              :disabled="!canSubmit"
              class="w-full px-4 py-3 bg-primary-500 text-white hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
            >
              提交审核
            </button>
            <button
              @click="saveDraft"
              :disabled="!canSave"
              class="w-full px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
            >
              保存草稿
            </button>
          </div>

          <div v-if="items.length > 0" class="mt-6 p-4 bg-yellow-50 rounded-xl">
            <h3 class="font-medium text-yellow-900 mb-2 flex items-center gap-2">
              <span>⚠️</span>
              温馨提示
            </h3>
            <ul class="text-xs text-yellow-700 space-y-1">
              <li>• 提交后将进入待审核状态</li>
              <li>• 项目主管审核通过后将安排发货</li>
              <li>• 库存不足的耗材可能需要等待补货</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showToast"
        class="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up"
      >
        <span v-if="toastType === 'success'" class="text-green-400">✓</span>
        <span v-else class="text-red-400">✕</span>
        <span>{{ toastMessage }}</span>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '~/stores/data'
import { useAuthStore } from '~/stores/auth'
import { formatDate } from '~/utils/date'
import { formatCurrency } from '~/utils/formatters'
import type { RequisitionItem, Supply } from '~/types'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()
const authStore = useAuthStore()

const selectedProjectId = ref('')
const note = ref('')
const items = ref<Array<RequisitionItem & { supplyId: string }>>([])

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

const today = computed(() => formatDate(new Date()))

const projects = computed(() => dataStore.projects.filter(p => p.status === 'active'))
const supplies = computed(() => dataStore.supplies)

const availableSupplies = computed(() => {
  return supplies.value.sort((a, b) => {
    const statusA = a.currentStock <= a.warningStock ? 0 : a.currentStock <= a.safeStock ? 1 : 2
    const statusB = b.currentStock <= b.warningStock ? 0 : b.currentStock <= b.safeStock ? 1 : 2
    return statusA - statusB
  })
})

const totalQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + getItemAmount(item), 0)
})

const canSubmit = computed(() => {
  return selectedProjectId.value && 
         items.value.length > 0 && 
         items.value.every(item => item.supplyId && item.quantity > 0)
})

const canSave = computed(() => {
  return selectedProjectId.value || items.value.length > 0
})

onMounted(() => {
  const supplyId = route.query.supplyId as string
  if (supplyId) {
    const supply = supplies.value.find(s => s.id === supplyId)
    if (supply) {
      addItem(supply)
    }
  }
})

function addItem(preselectedSupply?: Supply) {
  const newItem: RequisitionItem & { supplyId: string } = {
    supplyId: preselectedSupply?.id || '',
    supplyName: preselectedSupply?.name || '',
    quantity: preselectedSupply ? Math.max(1, preselectedSupply.safeStock - preselectedSupply.currentStock) : 1,
    deliveredQuantity: null,
    unitPrice: preselectedSupply?.unitPrice || null
  }
  items.value.push(newItem)
}

function removeItem(index: number) {
  items.value.splice(index, 1)
}

function handleSupplyChange(index: number) {
  const item = items.value[index]
  const supply = supplies.value.find(s => s.id === item.supplyId)
  if (supply) {
    item.supplyName = supply.name
    item.unitPrice = supply.unitPrice
  } else {
    item.supplyName = ''
    item.unitPrice = null
  }
}

function isSupplySelected(supplyId: string, currentIndex: number): boolean {
  return items.value.some((item, idx) => idx !== currentIndex && item.supplyId === supplyId)
}

function getSupplyUnit(supplyId: string): string {
  const supply = supplies.value.find(s => s.id === supplyId)
  return supply?.unit || ''
}

function getItemAmount(item: RequisitionItem & { supplyId: string }): number {
  if (item.unitPrice && item.quantity) {
    return item.unitPrice * item.quantity
  }
  return 0
}

async function submitRequisition() {
  if (!canSubmit.value) return

  try {
    const requisitionData = {
      projectId: selectedProjectId.value,
      applicantId: authStore.currentUser?.id || '',
      applicationDate: today.value,
      items: items.value.map(item => ({
        supplyId: item.supplyId,
        supplyName: item.supplyName,
        quantity: item.quantity,
        deliveredQuantity: null,
        unitPrice: item.unitPrice
      })),
      note: note.value
    }

    await dataStore.createRequisition(requisitionData, 'pending')
    showToastMessage('申领单已提交，等待审核')
    setTimeout(() => {
      router.push('/supplies/requisitions')
    }, 1500)
  } catch (error) {
    showToastMessage('提交失败，请重试', 'error')
  }
}

async function saveDraft() {
  if (!canSave.value) return

  try {
    const requisitionData = {
      projectId: selectedProjectId.value,
      applicantId: authStore.currentUser?.id || '',
      applicationDate: today.value,
      items: items.value.map(item => ({
        supplyId: item.supplyId,
        supplyName: item.supplyName,
        quantity: item.quantity,
        deliveredQuantity: null,
        unitPrice: item.unitPrice
      })),
      note: note.value
    }

    await dataStore.saveRequisitionDraft(requisitionData)
    showToastMessage('草稿已保存')
    setTimeout(() => {
      router.push('/supplies/requisitions')
    }, 1500)
  } catch (error) {
    showToastMessage('保存失败，请重试', 'error')
  }
}

function showToastMessage(message: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}
</script>

<style scoped>
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
