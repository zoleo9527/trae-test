<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore, type Plot, type Transfer } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import StatusBadge from '@/components/StatusBadge.vue'
import Timeline from '@/components/Timeline.vue'
import DataTable, { type Column } from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import { ArrowLeft, Plus, MessageSquare } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useDataStore()
const appStore = useAppStore()

const plot = ref<Plot | null>(null)
const loading = ref(true)
const relatedTransfers = ref<Transfer[]>([])
const showStatusModal = ref(false)
const statusForm = ref({
  from_status: '',
  to_status: '',
  reason: '',
  note: '',
})
const newNote = ref('')

const statusOptions = ['在养', '养护中', '休整', '已调出']

onMounted(async () => {
  try {
    const plotId = Number(route.params.id)
    plot.value = await store.fetchPlot(plotId)
    await store.fetchTransfers()
    relatedTransfers.value = store.transfers.filter(t => t.plot_id === plotId)
  } finally {
    loading.value = false
  }
})

const inventoryColumns: Column[] = [
  { key: 'species', label: '品种' },
  { key: 'total_count', label: '总数' },
  { key: 'available_count', label: '可用' },
  { key: 'reserved_count', label: '已预留' },
  { key: 'transferred_count', label: '已调出' },
]

const transferColumns: Column[] = [
  { key: 'id', label: '调拨单号' },
  { key: 'customer_name', label: '客户' },
  { key: 'species', label: '品种' },
  { key: 'quantity', label: '数量' },
  { key: 'status', label: '状态' },
]

const statusTimeline = computed(() => {
  if (!plot.value?.status_logs) return []
  return plot.value.status_logs.map(log => ({
    title: `${log.from_status || '初始'} → ${log.to_status}`,
    subtitle: log.operator ? `操作人: ${log.operator}` : '',
    detail: log.reason ? `原因: ${log.reason}` : '',
    timestamp: log.note ? `备注: ${log.note}` : '',
    color: 'green' as const,
  })).reverse()
})

const canChangeStatus = computed(() => {
  return appStore.currentRole === '基地负责人'
})

function openStatusModal() {
  if (!plot.value) return
  statusForm.value.from_status = plot.value.status
  statusForm.value.to_status = ''
  statusForm.value.reason = ''
  statusForm.value.note = ''
  showStatusModal.value = true
}

async function handleStatusChange() {
  if (!plot.value || !statusForm.value.to_status) return
  try {
    const response = await fetch(`/api/plots/${plot.value.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_status: statusForm.value.from_status,
        to_status: statusForm.value.to_status,
        reason: statusForm.value.reason,
        operator: appStore.currentRole === '基地负责人' ? '张建国' : '王秀芳',
        note: statusForm.value.note,
      }),
    })
    if (response.ok) {
      plot.value = await store.fetchPlot(plot.value.id)
      showStatusModal.value = false
    }
  } catch (e) {
    console.error('状态变更失败', e)
  }
}

async function addNote() {
  if (!newNote.value.trim() || !plot.value) return
  try {
    await fetch(`/api/plots/${plot.value.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newNote.value,
        author: appStore.currentRole === '基地负责人' ? '张建国' : '王秀芳',
      }),
    })
    newNote.value = ''
    plot.value = await store.fetchPlot(plot.value.id)
  } catch (e) {
    console.error('添加备注失败', e)
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 16)
}

function goToTransfer(row: Record<string, any>) {
  router.push(`/transfers/${row.id}`)
}
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-4">
      <div class="h-8 bg-gray-100 rounded animate-pulse w-1/3" />
      <div class="h-64 bg-gray-100 rounded animate-pulse" />
    </div>
    <div v-else-if="plot">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <button class="text-text-secondary hover:text-text-primary" @click="router.push('/plots')">
            <ArrowLeft class="w-5 h-5" />
          </button>
          <h1 class="page-title">{{ plot.name }}</h1>
          <StatusBadge :status="plot.status" size="md" />
        </div>
        <button
          v-if="canChangeStatus"
          class="btn-primary flex items-center gap-1"
          @click="openStatusModal"
        >
          <Plus class="w-4 h-4" /> 状态变更
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="card p-4">
          <h2 class="section-title">基本信息</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-text-muted">区域</span>
              <span class="text-text-primary">{{ plot.area }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-muted">品种</span>
              <span class="text-text-primary">{{ plot.species }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-muted">负责人</span>
              <span class="text-text-primary">{{ plot.responsible_person }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-muted">创建时间</span>
              <span class="text-text-primary">{{ formatDate(plot.created_at) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-muted">更新时间</span>
              <span class="text-text-primary">{{ formatDate(plot.updated_at) }}</span>
            </div>
          </div>
        </div>

        <div class="card p-4">
          <h2 class="section-title">库存明细</h2>
          <DataTable
            :columns="inventoryColumns"
            :data="plot.inventory || []"
            empty-text="暂无库存数据"
            :show-header="false"
            @row-click="() => {}"
          />
        </div>

        <div class="card p-4">
          <h2 class="section-title">状态时间线</h2>
          <Timeline
            v-if="statusTimeline.length > 0"
            :items="statusTimeline"
          />
          <div v-else class="text-sm text-text-muted py-4 text-center">暂无状态变更记录</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card p-4">
          <h2 class="section-title">关联调拨单</h2>
          <DataTable
            :columns="transferColumns"
            :data="relatedTransfers"
            empty-text="暂无关联调拨单"
            @row-click="goToTransfer"
          >
            <template #status="{ value }">
              <StatusBadge :status="value" />
            </template>
            <template #id="{ value }">
              <span class="font-medium">#{{ value }}</span>
            </template>
          </DataTable>
        </div>

        <div class="card p-4">
          <h2 class="section-title">备注与沟通</h2>
          <div v-if="plot.status_logs && plot.status_logs.length > 0" class="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
            <div
              v-for="log in plot.status_logs"
              :key="log.id"
              class="flex items-start gap-3 p-3 bg-gray-50 rounded"
            >
              <MessageSquare class="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-medium text-text-primary">{{ log.operator }}</span>
                  <span class="text-xs bg-forest-100 text-forest-700 px-2 py-0.5 rounded">状态变更</span>
                </div>
                <div class="text-sm text-text-secondary">
                  {{ log.from_status }} → {{ log.to_status }}
                  <span v-if="log.reason" class="text-text-muted"> ({{ log.reason }})</span>
                </div>
                <div v-if="log.note" class="text-sm text-text-secondary mt-1">{{ log.note }}</div>
                <div class="text-xs text-text-muted mt-1">{{ formatDate(log.created_at) }}</div>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <textarea
              v-model="newNote"
              class="input-field flex-1"
              rows="2"
              placeholder="添加备注..."
            />
            <button class="btn-primary self-end" @click="addNote" :disabled="!newNote.trim()">发送</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-text-muted py-12">地块不存在</div>

    <Modal v-model:visible="showStatusModal" title="状态变更" @close="showStatusModal = false">
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">当前状态</label>
            <input :value="statusForm.from_status" class="input-field bg-gray-50" readonly />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">目标状态</label>
            <select v-model="statusForm.to_status" class="input-field">
              <option value="" disabled>请选择目标状态</option>
              <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">变更原因</label>
            <input v-model="statusForm.reason" class="input-field" placeholder="请输入变更原因" />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">备注</label>
            <textarea v-model="statusForm.note" class="input-field" rows="3" placeholder="请输入备注（可选）" />
          </div>
        </div>
      </template>
      <template #footer>
        <button class="btn-secondary" @click="showStatusModal = false">取消</button>
        <button class="btn-primary" @click="handleStatusChange" :disabled="!statusForm.to_status">确认变更</button>
      </template>
    </Modal>
  </div>
</template>
