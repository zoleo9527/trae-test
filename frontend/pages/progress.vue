<template>
  <div class="h-full flex">
    <div class="w-[400px] border-r border-gray-200 bg-white flex flex-col">
      <div class="p-4 border-b border-gray-200">
        <h1 class="text-xl font-bold text-gray-900 mb-4">工地进度</h1>
        <div class="flex gap-2 mb-4">
          <select v-model="filterProject" class="select-field flex-1 text-sm">
            <option :value="null">全部项目</option>
            <option v-for="p in appStore.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <select v-model="filterStatus" class="select-field w-32 text-sm">
            <option value="all">全部状态</option>
            <option value="exception">异常</option>
            <option value="submitted">已提交</option>
            <option value="approved">已通过</option>
          </select>
        </div>
        <div class="flex gap-2">
          <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
            class="px-3 py-1.5 text-sm rounded-lg transition-colors"
            :class="activeTab === tab.value ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'">
            {{ tab.label }}
            <span v-if="tab.count > 0" class="ml-1 text-xs">({{ tab.count }})</span>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto">
        <div v-for="diary in filteredDiaries" :key="diary.id"
          @click="selectDiary(diary)"
          class="p-4 border-b border-gray-100 cursor-pointer transition-colors"
          :class="selectedDiary?.id === diary.id ? 'bg-blue-50' : 'hover:bg-gray-50'">
          <div class="flex items-start justify-between mb-2">
            <div>
              <div class="font-medium text-gray-900">{{ getProjectName(diary.project_id) }}</div>
              <div class="text-sm text-gray-500">{{ getTeamName(diary.team_id) }}</div>
            </div>
            <span :class="[getStatusBadge(diary.status).class, 'badge']">
              {{ getStatusBadge(diary.status).text }}
            </span>
          </div>
          <div class="text-sm text-gray-600 mb-2">{{ diary.construction_content }}</div>
          <div class="flex items-center gap-4 text-xs text-gray-500">
            <span>{{ formatDate(diary.report_date) }}</span>
            <span>{{ formatArea(diary.completed_area) }}</span>
            <span>{{ diary.worker_count }}人</span>
            <span v-if="diary.is_exception" class="text-red-600 font-medium">异常</span>
          </div>
        </div>
        <div v-if="filteredDiaries.length === 0" class="text-center py-12 text-gray-500">
          暂无施工日志
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

      <div v-else-if="selectedDiary" class="p-6">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h2 class="text-xl font-bold text-gray-900">{{ getProjectName(selectedDiary.project_id) }}</h2>
            <p class="text-gray-500 mt-1">{{ formatDate(selectedDiary.report_date) }} · {{ getTeamName(selectedDiary.team_id) }}</p>
          </div>
          <div class="flex gap-2">
            <span :class="[getStatusBadge(selectedDiary.status).class, 'badge']">
              {{ getStatusBadge(selectedDiary.status).text }}
            </span>
            <span v-if="selectedDiary.is_exception" class="badge badge-red">
              {{ selectedDiary.exception_type || '异常' }}
            </span>
          </div>
        </div>

        <div v-if="selectedDiary.is_exception && !selectedDiary.exception_handled" class="card p-4 mb-6 border-red-200 bg-red-50">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-red-900">异常待处理</h3>
              <p class="text-sm text-red-700 mt-1">{{ selectedDiary.exception_reason }}</p>
              <div class="mt-3 flex gap-2">
                <button @click="showHandleModal = true" class="btn-danger text-sm">
                  处理异常
                </button>
                <button @click="createInspection" class="btn-warning text-sm">
                  创建质量检查
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedDiary.is_exception && selectedDiary.exception_handled" class="card p-4 mb-6 border-green-200 bg-green-50">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-green-900">异常已处理</h3>
              <p class="text-sm text-green-700 mt-1">处理人：{{ getUserName(selectedDiary.exception_handler_id) }} · {{ formatDateTime(selectedDiary.exception_handled_at) }}</p>
              <p class="text-sm text-green-600 mt-1">{{ selectedDiary.exception_handle_note }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div class="card p-4">
            <h3 class="detail-section-title">施工信息</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">天气</div>
                <div class="detail-value">{{ selectedDiary.weather }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">完成面积</div>
                <div class="detail-value">{{ formatArea(selectedDiary.completed_area) }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">施工人数</div>
                <div class="detail-value">{{ selectedDiary.worker_count }} 人</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">工作时长</div>
                <div class="detail-value">{{ selectedDiary.work_hours }} 小时</div>
              </div>
            </div>
          </div>

          <div class="card p-4">
            <h3 class="detail-section-title">施工内容</h3>
            <p class="text-sm text-gray-700">{{ selectedDiary.construction_content }}</p>
          </div>

          <div class="card p-4">
            <h3 class="detail-section-title">材料使用</h3>
            <p class="text-sm text-gray-700">{{ selectedDiary.material_used }}</p>
          </div>

          <div class="card p-4">
            <h3 class="detail-section-title">存在问题</h3>
            <p class="text-sm text-gray-700">{{ selectedDiary.problems || '无' }}</p>
          </div>
        </div>

        <div class="card p-4 mt-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="detail-section-title mb-0">关联质量检查</h3>
            <button @click="createInspection" class="btn-primary text-sm">
              + 新增检查
            </button>
          </div>
          <div v-if="relatedInspections.length > 0" class="space-y-3">
            <div v-for="ins in relatedInspections" :key="ins.id"
              class="p-3 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 cursor-pointer"
              @click="goToInspection(ins.id)">
              <div>
                <div class="flex items-center gap-2">
                  <span :class="[getStatusBadge(ins.status).class, 'badge']">
                    {{ getStatusBadge(ins.status).text }}
                  </span>
                  <span v-if="ins.rework_required" class="badge badge-red">需返工</span>
                </div>
                <p class="text-sm text-gray-600 mt-1">{{ ins.inspection_items }}</p>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-900">{{ formatDate(ins.inspection_date) }}</div>
                <div class="text-xs text-gray-500">{{ getUserName(ins.inspector_id) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-6 text-gray-500 text-sm">
            暂无关联质量检查记录
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button v-if="selectedDiary.status === 'submitted'" @click="approveDiary" class="btn-success">
            审核通过
          </button>
          <button v-if="selectedDiary.status === 'submitted'" @click="markException" class="btn-danger">
            标记异常
          </button>
          <button class="btn-secondary">编辑日志</button>
        </div>
      </div>

      <div v-else class="h-full flex items-center justify-center text-gray-500">
        请选择左侧施工日志查看详情
      </div>
    </div>

    <div v-if="showHandleModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="card p-6 w-[500px]">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">处理异常</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">处理说明</label>
            <textarea v-model="handleNote" class="input-field h-32" placeholder="请输入处理说明和解决方案..."></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showHandleModal = false" class="btn-secondary">取消</button>
          <button @click="submitHandle" class="btn-primary">确认处理</button>
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

const diaries = ref<any[]>([])
const selectedDiary = ref<any>(null)
const relatedInspections = ref<any[]>([])
const filterProject = ref<number | null>(null)
const filterStatus = ref('all')
const activeTab = ref('all')
const showHandleModal = ref(false)
const handleNote = ref('')
const loadError = ref('')

const tabs = computed(() => [
  { value: 'all', label: '全部', count: diaries.value.length },
  { value: 'exception', label: '异常', count: diaries.value.filter(d => d.is_exception && !d.exception_handled).length },
  { value: 'pending', label: '待审核', count: diaries.value.filter(d => d.status === 'submitted').length }
])

const filteredDiaries = computed(() => {
  let result = [...diaries.value]
  if (filterProject.value) {
    result = result.filter(d => d.project_id === filterProject.value)
  }
  if (filterStatus.value !== 'all') {
    if (filterStatus.value === 'exception') {
      result = result.filter(d => d.is_exception)
    } else {
      result = result.filter(d => d.status === filterStatus.value)
    }
  }
  if (activeTab.value === 'exception') {
    result = result.filter(d => d.is_exception && !d.exception_handled)
  } else if (activeTab.value === 'pending') {
    result = result.filter(d => d.status === 'submitted')
  }
  return result
})

const getProjectName = (id: number) => appStore.projects.find((p: any) => p.id === id)?.name || '未知项目'
const getTeamName = (id: number) => appStore.teams.find((t: any) => t.id === id)?.name || '未知班组'
const getUserName = (id: number) => appStore.users.find((u: any) => u.id === id)?.name || '未知用户'

const loadDiaries = async () => {
  loadError.value = ''
  try {
    const params = new URLSearchParams()
    if (filterProject.value) params.append('project_id', String(filterProject.value))
    diaries.value = await api.get(`/diaries?${params.toString()}`) as any[]

    if (route.query.diaryId) {
      const diary = diaries.value.find(d => d.id === Number(route.query.diaryId))
      if (diary) {
        selectDiary(diary)
      }
    }
  } catch (e: any) {
    loadError.value = e.message || '加载施工日志失败，请稍后重试'
  }
}

const selectDiary = async (diary: any) => {
  selectedDiary.value = diary
  try {
    relatedInspections.value = await api.get(`/inspections?diary_id=${diary.id}`) as any[]
  } catch (e) {
    relatedInspections.value = []
  }
}

const createInspection = () => {
  router.push(`/quality?diaryId=${selectedDiary.value.id}&projectId=${selectedDiary.value.project_id}`)
}

const goToInspection = (id: number) => {
  router.push(`/quality?inspectionId=${id}`)
}

const approveDiary = async () => {
  if (!selectedDiary.value) return
  await api.put(`/diaries/${selectedDiary.value.id}`, { status: 'approved' })
  selectedDiary.value.status = 'approved'
  await loadDiaries()
}

const markException = async () => {
  if (!selectedDiary.value) return
  await api.put(`/diaries/${selectedDiary.value.id}`, {
    is_exception: true,
    exception_type: '质量问题',
    exception_reason: '审核发现施工质量不达标'
  })
  selectedDiary.value.is_exception = true
  selectedDiary.value.exception_type = '质量问题'
  selectedDiary.value.exception_reason = '审核发现施工质量不达标'
  await loadDiaries()
}

const submitHandle = async () => {
  if (!selectedDiary.value || !handleNote.value) return
  await api.post(`/diaries/${selectedDiary.value.id}/handle-exception`, { note: handleNote.value })
  showHandleModal.value = false
  handleNote.value = ''
  await loadDiaries()
  const updated = await api.get(`/diaries/${selectedDiary.value.id}`)
  selectedDiary.value = updated
}

const retryLoad = () => {
  loadError.value = ''
  appStore.clearError()
  loadAll()
}

const loadAll = async () => {
  await appStore.loadAllBaseData()
  await loadDiaries()
}

onMounted(async () => {
  try {
    appStore.initFromAuth()
    await loadAll()
  } catch (e: any) {
    loadError.value = e.message || '初始化失败，请稍后重试'
  }
})
</script>
