<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import StatusBadge from '@/components/StatusBadge.vue'
import Modal from '@/components/Modal.vue'
import { Plus, AlertTriangle } from 'lucide-vue-next'

const router = useRouter()
const store = useDataStore()

const activeTab = ref('起苗任务')
const tabs = ['起苗任务', '养护任务', '病害上报']
const tabTypes: Record<string, string> = { '起苗任务': 'lifting', '养护任务': 'maintenance', '病害上报': 'disease' }
const tabColors: Record<string, string> = { '起苗任务': 'bg-status-green', '养护任务': 'bg-blue-500', '病害上报': 'bg-danger-600' }

const showDiseaseModal = ref(false)
const diseaseForm = ref({
  plot_id: 0,
  disease_type: '',
  severity: '轻度',
  description: '',
  assignee: '',
})
const diseaseTypes = ['锈病', '白粉病', '蚜虫', '根腐病', '其他']
const severityOptions = ['轻度', '中度', '重度']

onMounted(() => {
  store.fetchTasks()
  store.fetchPlots()
})

const currentType = computed(() => tabTypes[activeTab.value])

const filteredTasks = computed(() => {
  return store.tasks.filter(t => t.type === currentType.value)
})

const priorityColor = (priority: string) => {
  if (priority === '高' || priority === '紧急') return 'bg-red-100 text-danger-600'
  if (priority === '中') return 'bg-amber-100 text-accent-600'
  return 'bg-green-100 text-status-green'
}

async function handleCreateDisease() {
  try {
    await store.createTask({
      plot_id: diseaseForm.value.plot_id,
      type: 'disease',
      title: `病害上报: ${diseaseForm.value.disease_type}`,
      assignee: diseaseForm.value.assignee,
      priority: diseaseForm.value.severity === '重度' ? '高' : diseaseForm.value.severity === '中度' ? '中' : '低',
      disease_report: {
        disease_type: diseaseForm.value.disease_type,
        severity: diseaseForm.value.severity,
        description: diseaseForm.value.description,
      },
    } as any)
    showDiseaseModal.value = false
    diseaseForm.value = { plot_id: 0, disease_type: '', severity: '轻度', description: '', assignee: '' }
    store.fetchTasks()
  } catch (e) {
    console.error('创建病害上报失败', e)
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
      <h1 class="page-title">作业中心</h1>
      <button
        v-if="activeTab === '病害上报'"
        class="btn-primary flex items-center gap-1"
        @click="showDiseaseModal = true"
      >
        <AlertTriangle class="w-4 h-4" /> 病害上报
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

    <div v-if="store.loadingTasks" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-20 bg-gray-100 rounded-lg animate-pulse" />
    </div>
    <div v-else-if="filteredTasks.length === 0" class="text-center text-text-muted py-12">
      暂无{{ activeTab }}
    </div>
    <div v-else class="space-y-3">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="card flex overflow-hidden hover:shadow-md cursor-pointer"
      >
        <div :class="tabColors[activeTab]" class="w-1.5 shrink-0" />
        <div class="flex-1 p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-text-primary">{{ task.title }}</span>
              <StatusBadge :status="task.status" size="sm" />
            </div>
            <span :class="priorityColor(task.priority)" class="badge">{{ task.priority }}</span>
          </div>
          <div class="flex items-center gap-4 text-xs text-text-secondary">
            <span>负责人: {{ task.assignee }}</span>
            <span>截止: {{ formatDate(task.due_date) }}</span>
          </div>
        </div>
      </div>
    </div>

    <Modal v-model:visible="showDiseaseModal" title="病害上报" @close="showDiseaseModal = false">
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">选择地块</label>
            <select v-model="diseaseForm.plot_id" class="input-field">
              <option :value="0" disabled>请选择地块</option>
              <option v-for="p in store.plots" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">病害类型</label>
            <select v-model="diseaseForm.disease_type" class="input-field">
              <option value="" disabled>请选择病害类型</option>
              <option v-for="dt in diseaseTypes" :key="dt" :value="dt">{{ dt }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">严重程度</label>
            <div class="flex gap-2">
              <button
                v-for="s in severityOptions"
                :key="s"
                :class="diseaseForm.severity === s ? 'bg-forest-700 text-white' : 'bg-gray-100 text-text-secondary'"
                class="px-4 py-2 rounded-lg text-sm font-medium"
                @click="diseaseForm.severity = s"
              >
                {{ s }}
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">描述</label>
            <textarea v-model="diseaseForm.description" class="input-field" rows="3" placeholder="请描述病害情况" />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">指派负责人</label>
            <input v-model="diseaseForm.assignee" class="input-field" placeholder="请输入负责人姓名" />
          </div>
        </div>
      </template>
      <template #footer>
        <button class="btn-secondary" @click="showDiseaseModal = false">取消</button>
        <button class="btn-primary" @click="handleCreateDisease">提交上报</button>
      </template>
    </Modal>
  </div>
</template>
