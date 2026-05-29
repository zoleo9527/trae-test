<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore, type Transfer } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import StatusBadge from '@/components/StatusBadge.vue'
import Modal from '@/components/Modal.vue'
import { ArrowLeft, Check, X, MessageSquare } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useDataStore()
const appStore = useAppStore()

const transfer = ref<Transfer | null>(null)
const loading = ref(true)
const noteContent = ref('')
const approvalComment = ref('')
const showApproveModal = ref(false)
const approvalAction = ref<'approve' | 'reject'>('approve')

const steps = ['创建', '审批', '起苗', '装车', '回访']

onMounted(async () => {
  try {
    transfer.value = await store.fetchTransfer(Number(route.params.id))
  } finally {
    loading.value = false
  }
})

const currentStep = computed(() => {
  if (!transfer.value) return 0
  const status = transfer.value.status
  if (status === '待审批') return 1
  if (status === '进行中' || status === '待装车') return 2
  if (status === '装车中' || status === '运输中') return 3
  if (status === '回访中' || status === '待跟进') return 4
  if (status === '已完成') return 5
  return 0
})

const canApprove = computed(() => {
  return transfer.value?.status === '待审批' && appStore.currentRole === '基地负责人'
})

async function addNote() {
  if (!noteContent.value.trim() || !transfer.value) return
  try {
    const author = appStore.currentRole === '基地负责人' ? '张建国' : appStore.currentRole === '销售跟单' ? '赵敏' : '李养护'
    await store.addTransferNote(transfer.value.id, noteContent.value, author, '备注')
    transfer.value = await store.fetchTransfer(transfer.value.id)
    noteContent.value = ''
  } catch (e) {
    console.error('添加备注失败', e)
  }
}

async function handleApproval() {
  if (!transfer.value) return
  try {
    await store.approveTransfer(
      transfer.value.id,
      '张建国',
      approvalAction.value,
      approvalComment.value,
    )
    transfer.value = await store.fetchTransfer(transfer.value.id)
    showApproveModal.value = false
    approvalComment.value = ''
  } catch (e) {
    console.error('审批失败', e)
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 16)
}

const noteTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    comment: '备注',
    approval: '审批',
    status_change: '状态变更',
    system: '系统',
  }
  return map[type] || type
}

const noteTypeColor = (type: string) => {
  const map: Record<string, string> = {
    comment: 'bg-blue-100 text-blue-700',
    approval: 'bg-green-100 text-green-700',
    status_change: 'bg-amber-100 text-amber-700',
    system: 'bg-gray-100 text-gray-600',
  }
  return map[type] || 'bg-gray-100 text-gray-600'
}
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-4">
      <div class="h-8 bg-gray-100 rounded animate-pulse w-1/3" />
      <div class="h-40 bg-gray-100 rounded animate-pulse" />
    </div>
    <div v-else-if="transfer">
      <div class="flex items-center gap-3 mb-6">
        <button class="text-text-secondary hover:text-text-primary" @click="router.push('/transfers')">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <h1 class="page-title">调拨单 #{{ transfer.id }}</h1>
        <StatusBadge :status="transfer.status" size="md" />
      </div>

      <div class="card p-4 mb-6">
        <div class="flex items-center justify-between">
          <div v-for="(step, idx) in steps" :key="step" class="flex items-center flex-1 last:flex-initial">
            <div class="flex flex-col items-center">
              <div
                :class="[
                  idx < currentStep ? 'bg-forest-500 text-white' : idx === currentStep ? 'bg-forest-700 text-white' : 'bg-gray-200 text-text-muted',
                ]"
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              >
                <Check v-if="idx < currentStep" class="w-4 h-4" />
                <span v-else>{{ idx + 1 }}</span>
              </div>
              <span class="text-xs mt-1" :class="idx <= currentStep ? 'text-forest-700 font-medium' : 'text-text-muted'">
                {{ step }}
              </span>
            </div>
            <div
              v-if="idx < steps.length - 1"
              :class="idx < currentStep ? 'bg-forest-500' : 'bg-gray-200'"
              class="flex-1 h-0.5 mx-2 mt-[-16px]"
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card p-4">
          <h2 class="section-title">基本信息</h2>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><span class="text-text-muted">客户:</span> {{ transfer.customer_name }}</div>
            <div><span class="text-text-muted">品种:</span> {{ transfer.species }}</div>
            <div><span class="text-text-muted">数量:</span> {{ transfer.quantity }}</div>
            <div><span class="text-text-muted">创建人:</span> {{ transfer.created_by || '-' }}</div>
            <div><span class="text-text-muted">预计日期:</span> {{ formatDate(transfer.expected_date) }}</div>
            <div><span class="text-text-muted">创建时间:</span> {{ formatDate(transfer.created_at) }}</div>
            <div v-if="transfer.approved_by"><span class="text-text-muted">审批人:</span> {{ transfer.approved_by }}</div>
          </div>
        </div>

        <div class="card p-4">
          <h2 class="section-title">审批操作</h2>
          <div v-if="canApprove" class="flex gap-3">
            <button
              class="btn-primary flex items-center gap-1"
              @click="approvalAction = 'approve'; showApproveModal = true"
            >
              <Check class="w-4 h-4" /> 通过
            </button>
            <button
              class="btn-danger flex items-center gap-1"
              @click="approvalAction = 'reject'; showApproveModal = true"
            >
              <X class="w-4 h-4" /> 退回
            </button>
          </div>
          <div v-else class="text-sm text-text-muted">
            {{ transfer.status === '待审批' ? '仅基地负责人可审批' : '当前状态无需审批' }}
          </div>
        </div>
      </div>

      <div class="card p-4 mb-6">
        <h2 class="section-title">备注与沟通</h2>
        <div v-if="transfer.notes && transfer.notes.length > 0" class="space-y-3 mb-4">
          <div
            v-for="note in transfer.notes"
            :key="note.id"
            class="flex items-start gap-3 p-3 bg-gray-50 rounded"
          >
            <MessageSquare class="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-medium text-text-primary">{{ note.author }}</span>
                <span :class="noteTypeColor(note.type)" class="badge text-[10px]">{{ noteTypeLabel(note.type) }}</span>
              </div>
              <div class="text-sm text-text-secondary">{{ note.content }}</div>
              <div class="text-xs text-text-muted mt-1">{{ formatDate(note.created_at) }}</div>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <textarea
            v-model="noteContent"
            class="input-field flex-1"
            rows="2"
            placeholder="添加备注..."
          />
          <button class="btn-primary self-end" @click="addNote" :disabled="!noteContent.trim()">发送</button>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-text-muted py-12">调拨单不存在</div>

    <Modal
      v-model:visible="showApproveModal"
      :title="approvalAction === 'approve' ? '审批通过' : '退回调拨'"
      @close="showApproveModal = false"
    >
      <template #body>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1">审批意见</label>
          <textarea v-model="approvalComment" class="input-field" rows="3" placeholder="请输入审批意见（可选）" />
        </div>
      </template>
      <template #footer>
        <button class="btn-secondary" @click="showApproveModal = false">取消</button>
        <button
          :class="approvalAction === 'approve' ? 'btn-primary' : 'btn-danger'"
          @click="handleApproval"
        >
          {{ approvalAction === 'approve' ? '确认通过' : '确认退回' }}
        </button>
      </template>
    </Modal>
  </div>
</template>
