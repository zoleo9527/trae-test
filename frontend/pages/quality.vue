<template>
  <div class="h-full flex">
    <div class="w-[420px] border-r border-gray-200 bg-white flex flex-col">
      <div class="p-4 border-b border-gray-200">
        <h1 class="text-xl font-bold text-gray-900 mb-4">质量复查</h1>
        <div class="flex gap-2 mb-4">
          <select v-model="filterProject" class="select-field flex-1 text-sm">
            <option :value="null">全部项目</option>
            <option v-for="p in appStore.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <select v-model="filterStatus" class="select-field w-36 text-sm">
            <option value="all">全部状态</option>
            <option value="rework_required">需返工</option>
            <option value="rectified">已整改</option>
            <option value="completed">已完成</option>
            <option value="pending">待检查</option>
          </select>
        </div>
        <div class="flex gap-2">
          <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
            class="px-3 py-1.5 text-sm rounded-lg transition-colors"
            :class="activeTab === tab.value ? 'bg-red-100 text-red-700 font-medium' : 'text-gray-600 hover:bg-gray-100'">
            {{ tab.label }}
            <span v-if="tab.count > 0" class="ml-1 text-xs">({{ tab.count }})</span>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto">
        <div v-for="ins in filteredInspections" :key="ins.id"
          @click="selectInspection(ins)"
          class="p-4 border-b border-gray-100 cursor-pointer transition-colors"
          :class="selectedInspection?.id === ins.id ? 'bg-red-50' : 'hover:bg-gray-50'">
          <div class="flex items-start justify-between mb-2">
            <div>
              <div class="font-medium text-gray-900">{{ getProjectName(ins.project_id) }}</div>
              <div class="text-sm text-gray-500">{{ ins.inspection_items }}</div>
            </div>
            <div class="text-right">
              <span :class="[getStatusBadge(ins.status).class, 'badge']">
                {{ getStatusBadge(ins.status).text }}
              </span>
            </div>
          </div>
          <div v-if="ins.rework_required" class="mb-2">
            <span class="badge badge-red text-xs">返工面积: {{ formatArea(ins.rework_area) }}</span>
          </div>
          <div class="flex items-center gap-4 text-xs text-gray-500">
            <span>{{ formatDate(ins.inspection_date) }}</span>
            <span>{{ getUserName(ins.inspector_id) }}</span>
            <span v-if="ins.rework_required" class="text-red-600 font-medium">需返工</span>
          </div>
          <div v-if="ins.rework_reason" class="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            {{ ins.rework_reason }}
          </div>
        </div>
        <div v-if="filteredInspections.length === 0" class="text-center py-12 text-gray-500">
          暂无质量检查记录
        </div>
      </div>
    </div>

    <div class="flex-1 bg-gray-50 overflow-auto">
      <div v-if="loadError" class="p-6">
        <div class="card p-6 border-red-200 bg-red-50">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-red-900">数据加载失败</h3>
              <p class="text-sm text-red-700 mt-1">{{ loadError }}</p>
              <button @click="retryLoad" class="btn-primary text-sm mt-3">重新加载</button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="showCreateModal" class="p-6">
        <div class="card p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-6">创建质量检查记录</h2>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">关联项目</label>
              <div class="input-field bg-gray-50">{{ getProjectName(createForm.project_id) }}</div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">关联施工日志</label>
              <div class="input-field bg-gray-50">{{ sourceDiary?.construction_content }}</div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">检查员</label>
              <select v-model="createForm.inspector_id" class="select-field">
                <option v-for="u in inspectors" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">检查日期</label>
              <input v-model="createForm.inspection_date" type="date" class="input-field" />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">检查项目</label>
              <input v-model="createForm.inspection_items" type="text" class="input-field" placeholder="如：基层处理、表面平整度、颜色均匀度等" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">检查结果</label>
              <select v-model="createForm.inspection_result" class="select-field" @change="onResultChange">
                <option value="passed">合格</option>
                <option value="failed">不合格</option>
              </select>
            </div>
            <div v-if="createForm.inspection_result === 'failed'">
              <label class="block text-sm font-medium text-gray-700 mb-1">是否返工</label>
              <select v-model="createForm.rework_required" class="select-field">
                <option :value="false">否</option>
                <option :value="true">是</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">发现问题</label>
              <textarea v-model="createForm.issues_found" class="input-field h-20" placeholder="详细描述发现的问题..."></textarea>
            </div>
            <div v-if="createForm.rework_required">
              <label class="block text-sm font-medium text-gray-700 mb-1">返工面积 (㎡)</label>
              <input v-model.number="createForm.rework_area" type="number" step="0.1" class="input-field" />
            </div>
            <div v-if="createForm.rework_required">
              <label class="block text-sm font-medium text-gray-700 mb-1">返工原因</label>
              <input v-model="createForm.rework_reason" type="text" class="input-field" />
            </div>
            <div v-if="createForm.rework_required" class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">浪费材料</label>
              <input v-model="createForm.material_wasted" type="text" class="input-field" placeholder="如：金刚砂材料约1.2吨，混凝土约10m³" />
            </div>
            <div v-if="createForm.rework_required">
              <label class="block text-sm font-medium text-gray-700 mb-1">整改期限</label>
              <input v-model="createForm.rectification_deadline" type="date" class="input-field" />
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button @click="cancelCreate" class="btn-secondary">取消</button>
            <button @click="submitCreate" class="btn-primary" :disabled="creating">
              {{ creating ? '创建中...' : '创建检查记录' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="selectedInspection" class="p-6">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h2 class="text-xl font-bold text-gray-900">{{ getProjectName(selectedInspection.project_id) }}</h2>
            <p class="text-gray-500 mt-1">检查日期：{{ formatDate(selectedInspection.inspection_date) }} · 检查员：{{ getUserName(selectedInspection.inspector_id) }}</p>
          </div>
          <div class="flex gap-2">
            <span :class="[getStatusBadge(selectedInspection.status).class, 'badge']">
              {{ getStatusBadge(selectedInspection.status).text }}
            </span>
            <span v-if="selectedInspection.rework_required" class="badge badge-red">需返工</span>
          </div>
        </div>

        <div v-if="selectedInspection.rework_required && !selectedInspection.rectification_completed" class="card p-4 mb-6 border-amber-200 bg-amber-50">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-amber-900">待整改</h3>
              <p class="text-sm text-amber-700 mt-1">返工原因：{{ selectedInspection.rework_reason }}</p>
              <p class="text-sm text-amber-700 mt-1">返工面积：{{ formatArea(selectedInspection.rework_area) }}</p>
              <p v-if="selectedInspection.material_wasted" class="text-sm text-amber-700 mt-1">浪费材料：{{ selectedInspection.material_wasted }}</p>
              <p v-if="selectedInspection.rectification_deadline" class="text-sm text-amber-700 mt-1">整改期限：{{ formatDate(selectedInspection.rectification_deadline) }}</p>
              <div class="mt-3 flex gap-2">
                <button @click="showRectificationModal = true" class="btn-warning text-sm">
                  完成整改
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedInspection.rectification_completed" class="card p-4 mb-6 border-green-200 bg-green-50">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-green-900">
                {{ selectedInspection.reinspection_result === 'passed' ? '复检通过' : '已整改待复检' }}
              </h3>
              <p class="text-sm text-green-700 mt-1">整改日期：{{ formatDate(selectedInspection.rectification_date) }}</p>
              <p class="text-sm text-green-600 mt-1">整改说明：{{ selectedInspection.rectification_note }}</p>
              <div v-if="!selectedInspection.reinspection_result" class="mt-3 flex gap-2">
                <button @click="showReinspectModal = true" class="btn-success text-sm">
                  复检确认
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div class="card p-4">
            <h3 class="detail-section-title">检查结果</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">检查项目</div>
                <div class="detail-value">{{ selectedInspection.inspection_items }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">检查结果</div>
                <div class="detail-value">
                  <span :class="[getStatusBadge(selectedInspection.inspection_result).class, 'badge']">
                    {{ getStatusBadge(selectedInspection.inspection_result).text }}
                  </span>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">是否返工</div>
                <div class="detail-value">{{ selectedInspection.rework_required ? '是' : '否' }}</div>
              </div>
              <div v-if="selectedInspection.rework_required" class="detail-item">
                <div class="detail-label">返工面积</div>
                <div class="detail-value">{{ formatArea(selectedInspection.rework_area) }}</div>
              </div>
            </div>
          </div>

          <div class="card p-4">
            <h3 class="detail-section-title">发现问题</h3>
            <p class="text-sm text-gray-700">{{ selectedInspection.issues_found || '无' }}</p>
          </div>

          <div v-if="selectedInspection.rework_required" class="card p-4">
            <h3 class="detail-section-title">返工原因</h3>
            <p class="text-sm text-gray-700">{{ selectedInspection.rework_reason || '-' }}</p>
          </div>

          <div v-if="selectedInspection.material_wasted" class="card p-4">
            <h3 class="detail-section-title">材料浪费</h3>
            <p class="text-sm text-red-600">{{ selectedInspection.material_wasted }}</p>
          </div>
        </div>

        <div class="card p-4 mt-6">
          <h3 class="detail-section-title">关联施工日志</h3>
          <div v-if="relatedDiary" class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" @click="goToDiary">
            <div class="flex justify-between items-center">
              <div>
                <div class="font-medium text-gray-900">{{ formatDate(relatedDiary.report_date) }} · {{ getTeamName(relatedDiary.team_id) }}</div>
                <p class="text-sm text-gray-600 mt-1">{{ relatedDiary.construction_content }}</p>
              </div>
              <span :class="[getStatusBadge(relatedDiary.status).class, 'badge']">
                {{ getStatusBadge(relatedDiary.status).text }}
              </span>
            </div>
          </div>
          <div v-else class="text-center py-6 text-gray-500 text-sm">
            未找到关联施工日志
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button class="btn-secondary">编辑检查记录</button>
        </div>
      </div>

      <div v-else class="h-full flex items-center justify-center text-gray-500">
        请选择左侧质量检查记录查看详情
      </div>
    </div>

    <div v-if="showRectificationModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="card p-6 w-[500px]">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">完成整改</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">整改说明</label>
            <textarea v-model="rectificationNote" class="input-field h-32" placeholder="请输入整改说明..."></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showRectificationModal = false" class="btn-secondary">取消</button>
          <button @click="submitRectification" class="btn-primary">确认完成</button>
        </div>
      </div>
    </div>

    <div v-if="showReinspectModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="card p-6 w-[500px]">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">复检确认</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">复检结果</label>
            <select v-model="reinspectionResult" class="select-field">
              <option value="passed">合格</option>
              <option value="failed">不合格，需继续返工</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showReinspectModal = false" class="btn-secondary">取消</button>
          <button @click="submitReinspection" class="btn-primary">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useAPI()
const appStore = useAppStore()
const route = useRoute()
const router = useRouter()

const inspections = ref<any[]>([])
const selectedInspection = ref<any>(null)
const relatedDiary = ref<any>(null)
const sourceDiary = ref<any>(null)
const filterProject = ref<number | null>(null)
const filterStatus = ref('all')
const activeTab = ref('all')
const showRectificationModal = ref(false)
const showReinspectModal = ref(false)
const showCreateModal = ref(false)
const creating = ref(false)
const rectificationNote = ref('')
const reinspectionResult = ref('passed')
const loadError = ref('')

const createForm = ref({
  project_id: 0,
  diary_id: 0,
  inspector_id: 0,
  inspection_date: '',
  inspection_items: '',
  inspection_result: 'passed',
  issues_found: '',
  rework_required: false,
  rework_reason: '',
  rework_area: 0,
  material_wasted: '',
  rectification_deadline: ''
})

const inspectors = computed(() => appStore.users.filter((u: any) => u.role === 'inspector' || u.role === 'manager'))

const tabs = computed(() => [
  { value: 'all', label: '全部', count: inspections.value.length },
  { value: 'rework', label: '需返工', count: inspections.value.filter(i => i.rework_required && !i.rectification_completed).length },
  { value: 'rectified', label: '已整改待复检', count: inspections.value.filter(i => i.rectification_completed && !i.reinspection_result).length }
])

const filteredInspections = computed(() => {
  let result = [...inspections.value]
  if (filterProject.value) {
    result = result.filter(i => i.project_id === filterProject.value)
  }
  if (filterStatus.value !== 'all') {
    result = result.filter(i => i.status === filterStatus.value)
  }
  if (activeTab.value === 'rework') {
    result = result.filter(i => i.rework_required && !i.rectification_completed)
  } else if (activeTab.value === 'rectified') {
    result = result.filter(i => i.rectification_completed && !i.reinspection_result)
  }
  return result
})

const getProjectName = (id: number) => appStore.projects.find((p: any) => p.id === id)?.name || '未知项目'
const getTeamName = (id: number) => appStore.teams.find((t: any) => t.id === id)?.name || '未知班组'
const getUserName = (id: number) => appStore.users.find((u: any) => u.id === id)?.name || '未知用户'

const loadInspections = async () => {
  loadError.value = ''
  try {
    const params = new URLSearchParams()
    if (filterProject.value) params.append('project_id', String(filterProject.value))
    inspections.value = await api.get(`/inspections?${params.toString()}`) as any[]

    if (route.query.inspectionId) {
      const ins = inspections.value.find(i => i.id === Number(route.query.inspectionId))
      if (ins) {
        selectInspection(ins)
      }
    }
  } catch (e: any) {
    loadError.value = e.message || '加载质量检查数据失败，请稍后重试'
  }
}

const selectInspection = async (ins: any) => {
  selectedInspection.value = ins
  showCreateModal.value = false
  if (ins.diary_id) {
    try {
      relatedDiary.value = await api.get(`/diaries/${ins.diary_id}`)
    } catch (e) {
      relatedDiary.value = null
    }
  }
}

const goToDiary = () => {
  if (relatedDiary.value) {
    router.push(`/progress?diaryId=${relatedDiary.value.id}`)
  }
}

const onResultChange = () => {
  if (createForm.value.inspection_result === 'passed') {
    createForm.value.rework_required = false
  }
}

const cancelCreate = () => {
  showCreateModal.value = false
  selectedInspection.value = null
  router.replace('/quality')
}

const submitCreate = async () => {
  if (!createForm.value.inspection_items) {
    alert('请填写检查项目')
    return
  }
  creating.value = true
  try {
    const data: any = {
      ...createForm.value,
      status: createForm.value.rework_required ? 'rework_required' : (createForm.value.inspection_result === 'passed' ? 'completed' : 'pending')
    }
    if (!data.rework_required) {
      delete data.rework_area
      delete data.rework_reason
      delete data.material_wasted
      delete data.rectification_deadline
    }
    const newInspection = await api.post('/inspections', data)
    await loadInspections()
    showCreateModal.value = false
    selectInspection(newInspection)
    router.replace('/quality')
  } catch (e: any) {
    alert('创建失败: ' + (e.data?.detail || e.message))
  } finally {
    creating.value = false
  }
}

const submitRectification = async () => {
  if (!selectedInspection.value || !rectificationNote.value) return
  await api.post(`/inspections/${selectedInspection.value.id}/complete-rectification`, { note: rectificationNote.value })
  showRectificationModal.value = false
  rectificationNote.value = ''
  await loadInspections()
  const updated = await api.get(`/inspections/${selectedInspection.value.id}`)
  selectedInspection.value = updated
}

const submitReinspection = async () => {
  if (!selectedInspection.value) return
  await api.post(`/inspections/${selectedInspection.value.id}/reinspect`, { result: reinspectionResult.value })
  showReinspectModal.value = false
  await loadInspections()
  const updated = await api.get(`/inspections/${selectedInspection.value.id}`)
  selectedInspection.value = updated
}

const initCreateFromDiary = async (diaryId: number, projectId: number) => {
  try {
    sourceDiary.value = await api.get(`/diaries/${diaryId}`)
    const authStore = useAuthStore()
    const currentUser = authStore.user || appStore.user
    createForm.value = {
      project_id: projectId,
      diary_id: diaryId,
      inspector_id: currentUser?.id || inspectors.value[0]?.id || 0,
      inspection_date: new Date().toISOString().split('T')[0],
      inspection_items: sourceDiary.value.is_exception ? '异常区域专项检查' : '日常质量检查',
      inspection_result: sourceDiary.value.is_exception ? 'failed' : 'passed',
      issues_found: sourceDiary.value.exception_reason || '',
      rework_required: sourceDiary.value.is_exception,
      rework_reason: sourceDiary.value.exception_reason || '',
      rework_area: 0,
      material_wasted: '',
      rectification_deadline: ''
    }
    showCreateModal.value = true
  } catch (e) {
    console.error('加载日志失败', e)
  }
}

const retryLoad = () => {
  loadError.value = ''
  loadInspections()
}

onMounted(async () => {
  try {
    await appStore.loadProjects()
    await appStore.loadTeams()
    await appStore.loadUsers()
    appStore.initFromAuth()
    await loadInspections()

    if (route.query.diaryId && route.query.projectId) {
      await initCreateFromDiary(Number(route.query.diaryId), Number(route.query.projectId))
    }
  } catch (e: any) {
    loadError.value = e.message || '初始化失败，请稍后重试'
  }
})
</script>
