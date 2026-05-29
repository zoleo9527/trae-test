<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore, type LoadingOrder } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import StatusBadge from '@/components/StatusBadge.vue'
import Modal from '@/components/Modal.vue'
import { ArrowLeft, AlertTriangle, Edit, Check } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useDataStore()
const appStore = useAppStore()

const order = ref<LoadingOrder | null>(null)
const loading = ref(true)
const showEditModal = ref(false)
const editForm = ref({
  vehicle_no: '',
  driver_name: '',
  status: '',
  items: [] as Array<{ id: number; species: string; planned_qty: number; actual_qty: number; difference_reason: string }>,
})

onMounted(async () => {
  try {
    order.value = await store.fetchLoadingOrder(Number(route.params.id))
  } finally {
    loading.value = false
  }
})

const itemsWithDiff = computed(() => {
  if (!order.value?.items) return []
  return order.value.items.map(item => ({
    ...item,
    difference: item.actual_qty - item.planned_qty,
  }))
})

const canEdit = computed(() => {
  return appStore.currentRole === '销售跟单' || appStore.currentRole === '基地负责人'
})

const hasDiscrepancy = computed(() => {
  return itemsWithDiff.value.some(item => item.difference !== 0 && item.actual_qty > 0)
})

function openEditModal() {
  if (!order.value) return
  editForm.value = {
    vehicle_no: order.value.vehicle_no || '',
    driver_name: order.value.driver_name || '',
    status: order.value.status,
    items: order.value.items?.map(item => ({
      id: item.id,
      species: item.species,
      planned_qty: item.planned_qty,
      actual_qty: item.actual_qty,
      difference_reason: item.difference_reason || '',
    })) || [],
  }
  showEditModal.value = true
}

async function handleSave() {
  if (!order.value) return
  try {
    const items = editForm.value.items.map(item => ({
      id: item.id,
      actual_qty: item.actual_qty,
      difference_reason: item.difference_reason || null,
    }))

    await fetch(`/api/loading-orders/${order.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_no: editForm.value.vehicle_no || null,
        driver_name: editForm.value.driver_name || null,
        status: editForm.value.status,
        items,
      }),
    })

    order.value = await store.fetchLoadingOrder(order.value.id)
    showEditModal.value = false
    store.fetchLoadingOrders()
    store.fetchTransfers()
  } catch (e) {
    console.error('保存失败', e)
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 16)
}

const diffColor = (diff: number) => {
  if (diff > 0) return 'text-accent-600'
  if (diff < 0) return 'text-danger-600'
  return 'text-status-green'
}
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-4">
      <div class="h-8 bg-gray-100 rounded animate-pulse w-1/3" />
      <div class="h-64 bg-gray-100 rounded animate-pulse" />
    </div>
    <div v-else-if="order">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <button class="text-text-secondary hover:text-text-primary" @click="router.push('/loading')">
            <ArrowLeft class="w-5 h-5" />
          </button>
          <h1 class="page-title">装车单 #{{ order.id }}</h1>
          <StatusBadge :status="order.status" size="md" />
          <span v-if="hasDiscrepancy" class="inline-flex items-center gap-1 text-xs text-accent-600 bg-accent-50 px-2 py-1 rounded">
            <AlertTriangle class="w-3 h-3" /> 数量差异
          </span>
        </div>
        <button
          v-if="canEdit"
          class="btn-primary flex items-center gap-1"
          @click="openEditModal"
        >
          <Edit class="w-4 h-4" /> 编辑
        </button>
      </div>

      <div class="card p-4 mb-6">
        <h2 class="section-title">基本信息</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><span class="text-text-muted">客户:</span> {{ order.customer_name }}</div>
          <div><span class="text-text-muted">车牌号:</span> {{ order.vehicle_no || '-' }}</div>
          <div><span class="text-text-muted">司机:</span> {{ order.driver_name || '-' }}</div>
          <div><span class="text-text-muted">创建人:</span> {{ order.created_by }}</div>
          <div><span class="text-text-muted">装车时间:</span> {{ formatDate(order.loaded_at) }}</div>
          <div><span class="text-text-muted">关联调拨:</span> 
            <span class="text-forest-700 cursor-pointer hover:underline" @click="router.push(`/transfers/${order.transfer_id}`)">
              #{{ order.transfer_id }}
            </span>
          </div>
        </div>
      </div>

      <div class="card p-4 mb-6">
        <h2 class="section-title">数量核验</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-2 px-3 text-text-secondary font-medium text-xs">品种</th>
                <th class="text-center py-2 px-3 text-text-secondary font-medium text-xs">计划数量</th>
                <th class="text-center py-2 px-3 text-text-secondary font-medium text-xs">实际数量</th>
                <th class="text-center py-2 px-3 text-text-secondary font-medium text-xs">差异</th>
                <th class="text-left py-2 px-3 text-text-secondary font-medium text-xs">差异原因</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in itemsWithDiff"
                :key="item.id"
                :class="item.difference !== 0 && item.actual_qty > 0 ? 'bg-amber-50' : ''"
                class="border-b border-border/50"
              >
                <td class="py-2.5 px-3">{{ item.species }}</td>
                <td class="py-2.5 px-3 text-center font-medium">{{ item.planned_qty }}</td>
                <td class="py-2.5 px-3 text-center font-medium">{{ item.actual_qty }}</td>
                <td class="py-2.5 px-3 text-center">
                  <span :class="diffColor(item.difference)" class="font-medium">
                    {{ item.difference > 0 ? '+' : '' }}{{ item.difference }}
                  </span>
                </td>
                <td class="py-2.5 px-3">
                  <span v-if="item.difference_reason" class="text-text-secondary">{{ item.difference_reason }}</span>
                  <span v-else class="text-text-muted">-</span>
                </td>
              </tr>
              <tr v-if="itemsWithDiff.length === 0">
                <td colspan="5" class="text-center py-4 text-text-muted">暂无装车明细</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="hasDiscrepancy" class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div class="flex items-start gap-2">
            <AlertTriangle class="w-4 h-4 text-accent-600 mt-0.5 shrink-0" />
            <div class="text-sm">
              <div class="font-medium text-accent-800">装车数量存在差异</div>
              <div class="text-accent-700 mt-0.5">请及时与客户沟通，必要时发起补苗协商或索赔流程</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-text-muted py-12">装车单不存在</div>

    <Modal v-model:visible="showEditModal" title="编辑装车单" @close="showEditModal = false">
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">车牌号</label>
            <input v-model="editForm.vehicle_no" class="input-field" placeholder="请输入车牌号" />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">司机姓名</label>
            <input v-model="editForm.driver_name" class="input-field" placeholder="请输入司机姓名" />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">状态</label>
            <select v-model="editForm.status" class="input-field">
              <option value="待装车">待装车</option>
              <option value="装车中">装车中</option>
              <option value="已完成">已完成</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">装车明细</label>
            <div class="border border-border rounded-lg overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="text-left py-2 px-3 text-text-secondary font-medium text-xs">品种</th>
                    <th class="text-center py-2 px-3 text-text-secondary font-medium text-xs">计划</th>
                    <th class="text-center py-2 px-3 text-text-secondary font-medium text-xs">实际</th>
                    <th class="text-left py-2 px-3 text-text-secondary font-medium text-xs">差异原因</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in editForm.items" :key="idx" class="border-t border-border/50">
                    <td class="py-2 px-3">{{ item.species }}</td>
                    <td class="py-2 px-3 text-center">{{ item.planned_qty }}</td>
                    <td class="py-2 px-3 text-center">
                      <input
                        v-model.number="item.actual_qty"
                        type="number"
                        class="w-20 text-center input-field py-1 px-2"
                        min="0"
                      />
                    </td>
                    <td class="py-2 px-3">
                      <input
                        v-model="item.difference_reason"
                        class="input-field py-1 px-2 text-sm"
                        placeholder="差异原因"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <button class="btn-secondary" @click="showEditModal = false">取消</button>
        <button class="btn-primary" @click="handleSave">保存</button>
      </template>
    </Modal>
  </div>
</template>
