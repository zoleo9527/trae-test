<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import StatusBadge from '@/components/StatusBadge.vue'
import Modal from '@/components/Modal.vue'
import { Plus } from 'lucide-vue-next'

const router = useRouter()
const store = useDataStore()

const activeTab = ref('全部')
const tabs = ['全部', '待审批', '进行中', '已完成', '已取消']
const showCreateModal = ref(false)

const form = ref({
  plot_id: 0,
  customer_name: '',
  species: '',
  quantity: 0,
  expected_date: '',
  note: '',
})

onMounted(() => {
  store.fetchTransfers()
})

const filteredTransfers = computed(() => {
  if (activeTab.value === '全部') return store.transfers
  return store.transfers.filter(t => t.status === activeTab.value)
})

const plotOptions = computed(() => store.plots)

async function handleCreate() {
  try {
    await store.createTransfer({
      plot_id: form.value.plot_id,
      customer_name: form.value.customer_name,
      species: form.value.species,
      quantity: form.value.quantity,
      expected_date: form.value.expected_date,
    } as any)
    showCreateModal.value = false
    form.value = { plot_id: 0, customer_name: '', species: '', quantity: 0, expected_date: '', note: '' }
    store.fetchTransfers()
  } catch (e) {
    console.error('创建调拨单失败', e)
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 10)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="page-title">调拨管理</h1>
      <button class="btn-primary flex items-center gap-1" @click="showCreateModal = true">
        <Plus class="w-4 h-4" /> 创建调拨单
      </button>
    </div>

    <div class="flex gap-1 mb-4 border-b border-border">
      <button
        v-for="tab in tabs"
        :key="tab"
        :class="activeTab === tab ? 'border-forest-700 text-forest-700' : 'border-transparent text-text-secondary hover:text-text-primary'"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <div v-if="store.loadingTransfers" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-20 bg-gray-100 rounded-lg animate-pulse" />
    </div>
    <div v-else-if="filteredTransfers.length === 0" class="text-center text-text-muted py-12">
      暂无调拨单
    </div>
    <div v-else class="space-y-3">
      <div
        v-for="t in filteredTransfers"
        :key="t.id"
        class="card p-4 hover:shadow-md cursor-pointer"
        @click="router.push(`/transfers/${t.id}`)"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold text-text-primary">调拨单 #{{ t.id }}</span>
            <StatusBadge :status="t.status" />
          </div>
          <span class="text-xs text-text-muted">{{ formatDate(t.created_at) }}</span>
        </div>
        <div class="flex items-center gap-4 text-sm text-text-secondary">
          <span>客户: {{ t.customer_name }}</span>
          <span>品种: {{ t.species }}</span>
          <span>数量: {{ t.quantity }}</span>
          <span v-if="t.created_by">创建人: {{ t.created_by }}</span>
        </div>
      </div>
    </div>

    <Modal v-model:visible="showCreateModal" title="创建调拨单" @close="showCreateModal = false">
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">选择地块</label>
            <select v-model="form.plot_id" class="input-field">
              <option :value="0" disabled>请选择地块</option>
              <option v-for="p in plotOptions" :key="p.id" :value="p.id">{{ p.name }} - {{ p.species }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">客户名称</label>
            <input v-model="form.customer_name" class="input-field" placeholder="请输入客户名称" />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">品种</label>
            <input v-model="form.species" class="input-field" placeholder="请输入品种" />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">数量</label>
            <input v-model.number="form.quantity" type="number" class="input-field" placeholder="请输入数量" />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">预计装车日期</label>
            <input v-model="form.expected_date" type="date" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">备注</label>
            <textarea v-model="form.note" class="input-field" rows="3" placeholder="请输入备注" />
          </div>
        </div>
      </template>
      <template #footer>
        <button class="btn-secondary" @click="showCreateModal = false">取消</button>
        <button class="btn-primary" @click="handleCreate">创建</button>
      </template>
    </Modal>
  </div>
</template>
