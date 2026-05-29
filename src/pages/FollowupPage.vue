<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useDataStore, type Followup, type Negotiation } from '@/stores/data'
import { useAppStore } from '@/stores/app'
import StatusBadge from '@/components/StatusBadge.vue'
import Modal from '@/components/Modal.vue'
import Timeline from '@/components/Timeline.vue'
import { Plus, Star, Phone, MessageSquare, Check, AlertCircle } from 'lucide-vue-next'

const store = useDataStore()
const appStore = useAppStore()

const showFollowupModal = ref(false)
const showNegotiationModal = ref(false)
const expandedNegotiation = ref<number | null>(null)
const activeTab = ref<'followup' | 'negotiation'>('followup')

const followupForm = ref({
  transfer_id: 0,
  customer_name: '',
  contact_result: '',
  satisfaction: '3',
  issue_description: '',
})

const negotiationForm = ref({
  followup_id: 0,
  disease_report_id: 0,
  type: '补苗协商' as '补苗协商' | '病害赔偿',
  initial_note: '',
})

const newNegotiationNote = ref('')
const selectedNegotiation = ref<Negotiation | null>(null)

onMounted(() => {
  store.fetchFollowups()
  store.fetchNegotiations()
  store.fetchTransfers()
})

const canCreateFollowup = computed(() => {
  return appStore.currentRole === '销售跟单' || appStore.currentRole === '基地负责人'
})

const canHandleNegotiation = computed(() => {
  return appStore.currentRole === '销售跟单' || appStore.currentRole === '基地负责人'
})

const satisfactionStars = computed(() => {
  return (s: string) => {
    const n = parseInt(s) || 0
    return n
  }
})

const negotiationTimeline = computed(() => {
  return (neg: any) => {
    if (!neg.notes) return []
    return neg.notes.map((n: any) => ({
      title: n.content,
      subtitle: n.author,
      timestamp: formatDate(n.created_at),
      color: 'blue' as const,
    }))
  }
})

function openFollowupModal() {
  followupForm.value = { transfer_id: 0, customer_name: '', contact_result: '', satisfaction: '3', issue_description: '' }
  showFollowupModal.value = true
}

function openNegotiationModal(followup?: Followup) {
  negotiationForm.value = {
    followup_id: followup?.id || 0,
    disease_report_id: 0,
    type: '补苗协商',
    initial_note: '',
  }
  if (followup) {
    negotiationForm.value.followup_id = followup.id
    negotiationForm.value.type = followup.issue_description?.includes('病害') || followup.issue_description?.includes('质量') ? '病害赔偿' : '补苗协商'
  }
  showNegotiationModal.value = true
}

async function handleCreateFollowup() {
  try {
    await store.createFollowup({
      transfer_id: followupForm.value.transfer_id,
      customer_name: followupForm.value.customer_name,
      contact_result: followupForm.value.contact_result,
      satisfaction: followupForm.value.satisfaction,
      issue_description: followupForm.value.issue_description,
      followup_by: appStore.currentRole === '销售跟单' ? '赵敏' : '张建国',
      status: '已完成',
    } as any)
    showFollowupModal.value = false
    followupForm.value = { transfer_id: 0, customer_name: '', contact_result: '', satisfaction: '3', issue_description: '' }
    store.fetchFollowups()
  } catch (e) {
    console.error('创建回访失败', e)
  }
}

async function handleCreateNegotiation() {
  try {
    const response = await fetch('/api/negotiations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        followup_id: negotiationForm.value.followup_id || null,
        disease_report_id: negotiationForm.value.disease_report_id || null,
        type: negotiationForm.value.type,
        negotiated_by: appStore.currentRole === '销售跟单' ? '赵敏' : '张建国',
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const negotiationId = data.data?.id || data.id

      if (negotiationForm.value.initial_note && negotiationId) {
        await fetch(`/api/negotiations/${negotiationId}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: negotiationForm.value.initial_note,
            author: appStore.currentRole === '销售跟单' ? '赵敏' : '张建国',
          }),
        })
      }

      showNegotiationModal.value = false
      negotiationForm.value = { followup_id: 0, disease_report_id: 0, type: '补苗协商', initial_note: '' }
      store.fetchNegotiations()
    }
  } catch (e) {
    console.error('创建协商失败', e)
  }
}

async function completeFollowup(followup: Followup) {
  try {
    await fetch(`/api/followups/${followup.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: '已完成',
        contact_result: followup.contact_result || '已完成回访',
      }),
    })
    store.fetchFollowups()
  } catch (e) {
    console.error('完成回访失败', e)
  }
}

async function resolveNegotiation(negotiation: Negotiation) {
  try {
    await store.updateNegotiation(negotiation.id, {
      status: '已解决',
      result: '双方达成一致，问题已解决',
    })
    store.fetchNegotiations()
  } catch (e) {
    console.error('解决协商失败', e)
  }
}

async function addNegotiationNote() {
  if (!newNegotiationNote.value.trim() || !selectedNegotiation.value) return
  try {
    await store.addNegotiationNote(
      selectedNegotiation.value.id,
      newNegotiationNote.value,
    )
    newNegotiationNote.value = ''
    store.fetchNegotiations()
  } catch (e) {
    console.error('添加备注失败', e)
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 16)
}

function toggleNegotiation(id: number) {
  expandedNegotiation.value = expandedNegotiation.value === id ? null : id
  if (expandedNegotiation.value === id) {
    selectedNegotiation.value = store.negotiations.find(n => n.id === id) || null
  } else {
    selectedNegotiation.value = null
  }
}

function isOverdue(dateStr: string) {
  if (!dateStr) return false
  const today = new Date()
  const dueDate = new Date(dateStr)
  return dueDate < today
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="page-title">回访与协商</h1>
      <div class="flex gap-2">
        <button
          v-if="canHandleNegotiation"
          class="btn-secondary flex items-center gap-1"
          @click="openNegotiationModal()"
        >
          <MessageSquare class="w-4 h-4" /> 发起协商
        </button>
        <button
          v-if="canCreateFollowup"
          class="btn-primary flex items-center gap-1"
          @click="openFollowupModal"
        >
          <Plus class="w-4 h-4" /> 创建回访
        </button>
      </div>
    </div>

    <div class="flex gap-1 mb-4 border-b border-border">
      <button
        :class="activeTab === 'followup' ? 'border-forest-700 text-forest-700' : 'border-transparent text-text-secondary hover:text-text-primary'"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
        @click="activeTab = 'followup'"
      >
        回访记录
      </button>
      <button
        :class="activeTab === 'negotiation' ? 'border-forest-700 text-forest-700' : 'border-transparent text-text-secondary hover:text-text-primary'"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
        @click="activeTab = 'negotiation'"
      >
        协商记录
      </button>
    </div>

    <div v-show="activeTab === 'followup'">
      <div v-if="store.loadingFollowups" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-28 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div v-else-if="store.followups.length === 0" class="text-sm text-text-muted py-8 text-center card p-4">
        暂无回访记录
      </div>
      <div v-else class="space-y-3">
        <div v-for="f in store.followups" :key="f.id" class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <Phone class="w-4 h-4 text-forest-500" />
              <span class="text-sm font-semibold text-text-primary">{{ f.customer_name }}</span>
              <span v-if="isOverdue(f.followup_at) && f.status === '待回访'" class="text-xs text-danger-600 bg-danger-50 px-2 py-0.5 rounded">
                <AlertCircle class="w-3 h-3 inline mr-1" />已逾期
              </span>
            </div>
            <div class="flex items-center gap-2">
              <StatusBadge :status="f.status" size="sm" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 mb-2">
            <div>
              <span class="text-xs text-text-muted">联系结果:</span>
              <span class="text-sm text-text-secondary ml-1">{{ f.contact_result || '-' }}</span>
            </div>
            <div>
              <span class="text-xs text-text-muted">回访人:</span>
              <span class="text-sm text-text-secondary ml-1">{{ f.followup_by || '-' }}</span>
            </div>
          </div>
          <div class="flex items-center gap-1 mb-1">
            <span class="text-xs text-text-muted">满意度:</span>
            <div class="flex">
              <Star
                v-for="i in 5"
                :key="i"
                :class="i <= satisfactionStars(f.satisfaction) ? 'text-accent-500 fill-accent-500' : 'text-gray-300'"
                class="w-3.5 h-3.5"
              />
            </div>
          </div>
          <div v-if="f.issue_description" class="text-xs text-text-muted mt-1 bg-gray-50 p-2 rounded">
            {{ f.issue_description }}
          </div>
          <div class="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <span class="text-xs text-text-muted">{{ formatDate(f.followup_at) }}</span>
            <div class="flex gap-2">
              <button
                v-if="f.status === '待回访' && canCreateFollowup"
                class="text-xs text-forest-700 hover:text-forest-800 flex items-center gap-1"
                @click.stop="completeFollowup(f)"
              >
                <Check class="w-3 h-3" /> 标记完成
              </button>
              <button
                v-if="f.issue_description && canHandleNegotiation"
                class="text-xs text-accent-600 hover:text-accent-700 flex items-center gap-1"
                @click.stop="openNegotiationModal(f)"
              >
                <MessageSquare class="w-3 h-3" /> 发起协商
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'negotiation'">
      <div v-if="store.loadingNegotiations" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-32 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div v-else-if="store.negotiations.length === 0" class="text-sm text-text-muted py-8 text-center card p-4">
        暂无协商记录
      </div>
      <div v-else class="space-y-3">
        <div v-for="n in store.negotiations" :key="n.id" class="card p-4">
          <div
            class="flex items-center justify-between cursor-pointer"
            @click="toggleNegotiation(n.id)"
          >
            <div class="flex items-center gap-2">
              <MessageSquare class="w-4 h-4 text-blue-500" />
              <span class="text-sm font-semibold text-text-primary">{{ n.customer_name || '客户' }} - {{ n.type }}</span>
              <StatusBadge :status="n.status" size="sm" />
            </div>
            <span class="text-xs text-text-muted">{{ formatDate(n.created_at) }}</span>
          </div>
          <div class="flex items-center gap-4 mt-2 text-xs text-text-muted">
            <span>协商人: {{ n.negotiated_by }}</span>
            <span v-if="n.disease_type">病害: {{ n.disease_type }} ({{ n.severity }})</span>
          </div>
          <div v-if="n.issue_description" class="text-xs text-text-secondary mt-1">
            问题: {{ n.issue_description }}
          </div>
          <div v-if="n.result" class="text-xs text-forest-700 mt-1 bg-forest-50 p-2 rounded">
            结果: {{ n.result }}
          </div>

          <div v-if="expandedNegotiation === n.id" class="mt-3 pt-3 border-t border-border">
            <h4 class="text-sm font-medium text-text-primary mb-3">协商过程</h4>
            <div v-if="n.notes && n.notes.length > 0" class="mb-3 max-h-[250px] overflow-y-auto">
              <Timeline :items="negotiationTimeline(n)" />
            </div>
            <div v-else class="text-xs text-text-muted mb-3 text-center py-2">
              暂无协商记录
            </div>

            <div v-if="n.status === '协商中' && canHandleNegotiation" class="flex gap-2">
              <textarea
                v-model="newNegotiationNote"
                class="input-field flex-1 text-sm"
                rows="2"
                placeholder="添加协商记录..."
              />
              <div class="flex flex-col gap-2">
                <button
                  class="btn-primary text-sm"
                  @click.stop="addNegotiationNote"
                  :disabled="!newNegotiationNote.trim()"
                >
                  发送
                </button>
                <button
                  class="btn-secondary text-sm"
                  @click.stop="resolveNegotiation(n)"
                >
                  <Check class="w-3 h-3 inline mr-1" /> 标记解决
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal v-model:visible="showFollowupModal" title="创建回访记录" @close="showFollowupModal = false">
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">关联调拨单</label>
            <select v-model="followupForm.transfer_id" class="input-field">
              <option :value="0" disabled>请选择调拨单</option>
              <option v-for="t in store.transfers" :key="t.id" :value="t.id">#{{ t.id }} - {{ t.customer_name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">客户名称</label>
            <input v-model="followupForm.customer_name" class="input-field" placeholder="请输入客户名称" />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">联系结果</label>
            <input v-model="followupForm.contact_result" class="input-field" placeholder="请输入联系结果" />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">满意度</label>
            <div class="flex gap-1">
              <button
                v-for="i in 5"
                :key="i"
                @click="followupForm.satisfaction = String(i)"
                class="p-1"
              >
                <Star
                  :class="i <= parseInt(followupForm.satisfaction) ? 'text-accent-500 fill-accent-500' : 'text-gray-300'"
                  class="w-6 h-6"
                />
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">问题描述</label>
            <textarea v-model="followupForm.issue_description" class="input-field" rows="3" placeholder="请描述问题（如有）" />
          </div>
        </div>
      </template>
      <template #footer>
        <button class="btn-secondary" @click="showFollowupModal = false">取消</button>
        <button class="btn-primary" @click="handleCreateFollowup">创建</button>
      </template>
    </Modal>

    <Modal v-model:visible="showNegotiationModal" title="发起协商" @close="showNegotiationModal = false">
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">关联回访</label>
            <select v-model="negotiationForm.followup_id" class="input-field">
              <option :value="0">无（直接发起）</option>
              <option v-for="f in store.followups" :key="f.id" :value="f.id">#{{ f.id }} - {{ f.customer_name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">协商类型</label>
            <div class="flex gap-2">
              <button
                :class="negotiationForm.type === '补苗协商' ? 'bg-forest-700 text-white' : 'bg-gray-100 text-text-secondary'"
                class="px-4 py-2 rounded-lg text-sm font-medium flex-1"
                @click="negotiationForm.type = '补苗协商'"
              >
                补苗协商
              </button>
              <button
                :class="negotiationForm.type === '病害赔偿' ? 'bg-danger-600 text-white' : 'bg-gray-100 text-text-secondary'"
                class="px-4 py-2 rounded-lg text-sm font-medium flex-1"
                @click="negotiationForm.type = '病害赔偿'"
              >
                病害赔偿
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">初始协商记录</label>
            <textarea v-model="negotiationForm.initial_note" class="input-field" rows="3" placeholder="请记录初始协商内容" />
          </div>
        </div>
      </template>
      <template #footer>
        <button class="btn-secondary" @click="showNegotiationModal = false">取消</button>
        <button class="btn-primary" @click="handleCreateNegotiation">发起</button>
      </template>
    </Modal>
  </div>
</template>
