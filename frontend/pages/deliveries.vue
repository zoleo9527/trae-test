<template>
  <div class="h-full flex">
    <div class="w-[420px] border-r border-gray-200 bg-white flex flex-col">
      <div class="p-4 border-b border-gray-200">
        <h1 class="text-xl font-bold text-gray-900 mb-4">材料管理</h1>
        <div class="flex gap-2 mb-4">
          <select v-model="filterProject" class="select-field flex-1 text-sm">
            <option :value="null">全部项目</option>
            <option v-for="p in appStore.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <select v-model="filterStatus" class="select-field w-36 text-sm">
            <option value="all">全部状态</option>
            <option value="has_issue">有质量问题</option>
            <option value="received">已签收</option>
            <option value="partial_return">部分退货</option>
          </select>
        </div>
        <div class="flex gap-2">
          <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
            class="px-3 py-1.5 text-sm rounded-lg transition-colors"
            :class="activeTab === tab.value ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100'">
            {{ tab.label }}
            <span v-if="tab.count > 0" class="ml-1 text-xs">({{ tab.count }})</span>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto">
        <div v-for="d in filteredDeliveries" :key="d.id"
          @click="selectDelivery(d)"
          class="p-4 border-b border-gray-100 cursor-pointer transition-colors"
          :class="selectedDelivery?.id === d.id ? 'bg-purple-50' : 'hover:bg-gray-50'">
          <div class="flex items-start justify-between mb-2">
            <div>
              <div class="font-medium text-gray-900">{{ d.material_name }}</div>
              <div class="text-sm text-gray-500">{{ getProjectName(d.project_id) }}</div>
            </div>
            <span :class="[getStatusBadge(d.status).class, 'badge']">
              {{ getStatusBadge(d.status).text }}
            </span>
          </div>
          <div class="flex items-center gap-4 text-xs text-gray-500 mt-2">
            <span>{{ formatDate(d.delivery_date) }}</span>
            <span>{{ d.actual_quantity }} {{ d.unit }}</span>
            <span>{{ d.supplier }}</span>
          </div>
          <div v-if="d.has_quality_issue" class="mt-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
            ⚠️ {{ d.quality_issue_note }}
          </div>
        </div>
        <div v-if="filteredDeliveries.length === 0" class="text-center py-12 text-gray-500">
          暂无材料配送记录
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

      <div v-else-if="selectedDelivery" class="p-6">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h2 class="text-xl font-bold text-gray-900">{{ selectedDelivery.material_name }}</h2>
            <p class="text-gray-500 mt-1">{{ getProjectName(selectedDelivery.project_id) }} · {{ formatDate(selectedDelivery.delivery_date) }}</p>
          </div>
          <div class="flex gap-2">
            <span :class="[getStatusBadge(selectedDelivery.status).class, 'badge']">
              {{ getStatusBadge(selectedDelivery.status).text }}
            </span>
            <span v-if="selectedDelivery.has_quality_issue" class="badge badge-orange">质量问题</span>
          </div>
        </div>

        <div v-if="selectedDelivery.has_quality_issue" class="card p-4 mb-6 border-orange-200 bg-orange-50">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-orange-900">材料质量问题</h3>
              <p class="text-sm text-orange-700 mt-1">{{ selectedDelivery.quality_issue_note }}</p>
              <p v-if="selectedDelivery.return_quantity > 0" class="text-sm text-orange-600 mt-1">
                退货数量：{{ selectedDelivery.return_quantity }} {{ selectedDelivery.unit }}
              </p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div class="card p-4">
            <h3 class="detail-section-title">配送信息</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">材料规格</div>
                <div class="detail-value">{{ selectedDelivery.specification }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">供应商</div>
                <div class="detail-value">{{ selectedDelivery.supplier }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">批号</div>
                <div class="detail-value">{{ selectedDelivery.batch_number || '-' }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">接收人</div>
                <div class="detail-value">{{ getUserName(selectedDelivery.receiver_id) }}</div>
              </div>
            </div>
          </div>

          <div class="card p-4">
            <h3 class="detail-section-title">数量信息</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">计划数量</div>
                <div class="detail-value">{{ selectedDelivery.planned_quantity }} {{ selectedDelivery.unit }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">实际数量</div>
                <div class="detail-value">{{ selectedDelivery.actual_quantity }} {{ selectedDelivery.unit }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">差异</div>
                <div class="detail-value" :class="selectedDelivery.actual_quantity - selectedDelivery.planned_quantity < 0 ? 'text-red-600' : 'text-green-600'">
                  {{ (selectedDelivery.actual_quantity - selectedDelivery.planned_quantity).toFixed(2) }} {{ selectedDelivery.unit }}
                </div>
              </div>
              <div v-if="selectedDelivery.return_quantity > 0" class="detail-item">
                <div class="detail-label">退货数量</div>
                <div class="detail-value text-red-600">{{ selectedDelivery.return_quantity }} {{ selectedDelivery.unit }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button class="btn-secondary">编辑配送单</button>
        </div>
      </div>

      <div v-else class="h-full flex items-center justify-center text-gray-500">
        请选择左侧材料配送记录查看详情
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useAPI()
const appStore = useAppStore()
const route = useRoute()
const router = useRouter()

const deliveries = ref<any[]>([])
const selectedDelivery = ref<any>(null)
const filterProject = ref<number | null>(null)
const filterStatus = ref('all')
const activeTab = ref('all')
const loadError = ref('')

const tabs = computed(() => [
  { value: 'all', label: '全部', count: deliveries.value.length },
  { value: 'issue', label: '质量问题', count: deliveries.value.filter(d => d.has_quality_issue).length }
])

const filteredDeliveries = computed(() => {
  let result = [...deliveries.value]
  if (filterProject.value) {
    result = result.filter(d => d.project_id === filterProject.value)
  }
  if (filterStatus.value === 'has_issue') {
    result = result.filter(d => d.has_quality_issue)
  } else if (filterStatus.value !== 'all') {
    result = result.filter(d => d.status === filterStatus.value)
  }
  if (activeTab.value === 'issue') {
    result = result.filter(d => d.has_quality_issue)
  }
  return result
})

const getProjectName = (id: number) => appStore.projects.find((p: any) => p.id === id)?.name || '未知项目'
const getUserName = (id: number) => appStore.users.find((u: any) => u.id === id)?.name || '未知用户'

const selectDelivery = (d: any) => {
  selectedDelivery.value = d
}

const loadDeliveries = async () => {
  loadError.value = ''
  try {
    const params = new URLSearchParams()
    if (filterProject.value) params.append('project_id', String(filterProject.value))
    deliveries.value = await api.get(`/deliveries?${params.toString()}`) as any[]

    if (route.query.deliveryId) {
      const d = deliveries.value.find(x => x.id === Number(route.query.deliveryId))
      if (d) {
        selectDelivery(d)
      }
    }
  } catch (e: any) {
    loadError.value = e.message || '加载材料配送数据失败，请稍后重试'
  }
}

const retryLoad = () => {
  loadError.value = ''
  appStore.clearError()
  loadAll()
}

const loadAll = async () => {
  appStore.initFromAuth()
  await appStore.loadAllBaseData()
  await loadDeliveries()
}

onMounted(async () => {
  try {
    await loadAll()
  } catch (e: any) {
    loadError.value = e.message || '初始化失败，请稍后重试'
  }
})
</script>
