<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore, type Transfer } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import StatusBadge from '@/components/StatusBadge.vue'
import DataTable, { type Column } from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import { Plus } from 'lucide-vue-next'

const router = useRouter()
const store = useDataStore()
const appStore = useAppStore()

const showCreateModal = ref(false)
const form = ref({
  transfer_id: 0,
  vehicle_no: '',
  driver_name: '',
  items: [] as Array<{ species: string; planned_qty: number; actual_qty: number }>,
})

onMounted(() => {
  store.fetchLoadingOrders()
  store.fetchTransfers()
})

const availableTransfers = computed(() => {
  return store.transfers.filter(t => t.status === '待装车')
})

const columns: Column[] = [
  { key: 'id', label: '装车单号' },
  { key: 'customer_name', label: '客户' },
  { key: 'vehicle_no', label: '车牌号' },
  { key: 'driver_name', label: '司机' },
  { key: 'status', label: '状态' },
  { key: 'loaded_at', label: '装车时间' },
  { key: 'discrepancy', label: '差异标记' },
]

const tableData = computed(() => {
  return store.loadingOrders.map(o => {
    const hasDiscrepancy = o.items?.some((item: any) => item.actual_qty > 0 && item.actual_qty !== item.planned_qty)
    return {
      ...o,
      discrepancy: hasDiscrepancy ? '有差异' : '',
      has_discrepancy: hasDiscrepancy,
    }
  })
})

function handleRowClick(row: Record<string, any>) {
  router.push(`/loading/${row.id}`)
}

function openCreateModal() {
  form.value = {
    transfer_id: 0,
    vehicle_no: '',
    driver_name: '',
    items: [],
  }
  showCreateModal.value = true
}

function onTransferChange() {
  const transfer = store.transfers.find(t => t.id === form.value.transfer_id)
  if (transfer) {
    form.value.items = [{
      species: transfer.species,
      planned_qty: transfer.quantity,
      actual_qty: 0,
    }]
  }
}

async function handleCreate() {
  if (!form.value.transfer_id) return
  try {
    await store.createLoadingOrder({
      transfer_id: form.value.transfer_id,
      vehicle_no: form.value.vehicle_no || undefined,
      driver_name: form.value.driver_name || undefined,
      created_by: appStore.currentRole === '销售跟单' ? '赵敏' : '张建国',
      items: form.value.items,
    } as any)
    showCreateModal.value = false
    store.fetchLoadingOrders()
  } catch (e) {
    console.error('创建装车单失败', e)
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 16)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="page-title">装车管理</h1>
      <button class="btn-primary flex items-center gap-1" @click="openCreateModal">
        <Plus class="w-4 h-4" /> 创建装车单
      </button>
    </div>

    <div class="card">
      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="store.loadingOrders_loading"
        empty-text="暂无装车单"
        @row-click="handleRowClick"
      >
        <template #id="{ value }">
          <span class="font-medium">#{{ value }}</span>
        </template>
        <template #status="{ value }">
          <StatusBadge :status="value" />
        </template>
        <template #loaded_at="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #discrepancy="{ value, row }">
          <span v-if="row.has_discrepancy" class="text-accent-600 font-medium text-xs">⚠ 有差异</span>
          <span v-else class="text-xs text-text-muted">-</span>
        </template>
      </DataTable>
    </div>

    <Modal v-model:visible="showCreateModal" title="创建装车单" @close="showCreateModal = false">
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">关联调拨单</label>
            <select v-model="form.transfer_id" class="input-field" @change="onTransferChange">
              <option :value="0" disabled>请选择调拨单</option>
              <option v-for="t in availableTransfers" :key="t.id" :value="t.id">
                #{{ t.id }} - {{ t.customer_name }} ({{ t.species }} x{{ t.quantity }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">车牌号</label>
            <input v-model="form.vehicle_no" class="input-field" placeholder="请输入车牌号" />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">司机姓名</label>
            <input v-model="form.driver_name" class="input-field" placeholder="请输入司机姓名" />
          </div>
          <div v-if="form.items.length > 0">
            <label class="block text-sm font-medium text-text-primary mb-2">装车明细</label>
            <div class="border border-border rounded-lg overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="text-left py-2 px-3 text-text-secondary font-medium text-xs">品种</th>
                    <th class="text-center py-2 px-3 text-text-secondary font-medium text-xs">计划数量</th>
                    <th class="text-center py-2 px-3 text-text-secondary font-medium text-xs">实际数量</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in form.items" :key="idx" class="border-t border-border/50">
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
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <button class="btn-secondary" @click="showCreateModal = false">取消</button>
        <button class="btn-primary" @click="handleCreate" :disabled="!form.transfer_id">创建</button>
      </template>
    </Modal>
  </div>
</template>
