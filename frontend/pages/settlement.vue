<template>
  <div class="h-full flex">
    <div class="w-[420px] border-r border-gray-200 bg-white flex flex-col">
      <div class="p-4 border-b border-gray-200">
        <h1 class="text-xl font-bold text-gray-900 mb-4">班组结算</h1>
        <div class="flex gap-2 mb-4">
          <select v-model="filterProject" class="select-field flex-1 text-sm">
            <option :value="null">全部项目</option>
            <option v-for="p in appStore.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <select v-model="filterTeam" class="select-field w-36 text-sm">
            <option :value="null">全部班组</option>
            <option v-for="t in appStore.teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div class="flex gap-2">
          <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
            class="px-3 py-1.5 text-sm rounded-lg transition-colors"
            :class="activeTab === tab.value ? 'bg-orange-100 text-orange-700 font-medium' : 'text-gray-600 hover:bg-gray-100'">
            {{ tab.label }}
            <span v-if="tab.count > 0" class="ml-1 text-xs">({{ tab.count }})</span>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto">
        <div v-for="s in filteredSettlements" :key="s.id"
          @click="selectSettlement(s)"
          class="p-4 border-b border-gray-100 cursor-pointer transition-colors"
          :class="selectedSettlement?.id === s.id ? 'bg-orange-50' : 'hover:bg-gray-50'">
          <div class="flex items-start justify-between mb-2">
            <div>
              <div class="font-medium text-gray-900">{{ getProjectName(s.project_id) }}</div>
              <div class="text-sm text-gray-500">{{ getTeamName(s.team_id) }} · {{ s.settlement_period }}</div>
            </div>
            <span :class="[getStatusBadge(s.status).class, 'badge']">
              {{ getStatusBadge(s.status).text }}
            </span>
          </div>
          <div class="flex items-center justify-between mt-3">
            <div>
              <div class="text-lg font-bold text-gray-900">{{ formatCurrency(s.final_amount) }}</div>
              <div class="text-xs text-gray-500">完成面积：{{ formatArea(s.total_completed_area) }}</div>
            </div>
            <div v-if="s.rework_deduction > 0 || s.material_loss_deduction > 0" class="text-right">
              <div class="text-sm text-red-600">扣款：{{ formatCurrency(s.rework_deduction + s.material_loss_deduction) }}</div>
            </div>
          </div>
          <div v-if="s.has_dispute && !s.dispute_resolved" class="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            ⚠️ {{ s.dispute_reason }}
          </div>
        </div>
        <div v-if="filteredSettlements.length === 0" class="text-center py-12 text-gray-500">
          暂无结算单
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

      <div v-else-if="selectedSettlement" class="p-6">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h2 class="text-xl font-bold text-gray-900">{{ getProjectName(selectedSettlement.project_id) }}</h2>
            <p class="text-gray-500 mt-1">{{ getTeamName(selectedSettlement.team_id) }} · {{ selectedSettlement.settlement_period }}</p>
          </div>
          <div class="flex gap-2">
            <span :class="[getStatusBadge(selectedSettlement.status).class, 'badge']">
              {{ getStatusBadge(selectedSettlement.status).text }}
            </span>
            <span v-if="selectedSettlement.has_dispute" class="badge badge-red">有争议</span>
          </div>
        </div>

        <div v-if="selectedSettlement.has_dispute && !selectedSettlement.dispute_resolved" class="card p-4 mb-6 border-red-200 bg-red-50">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-red-900">存在结算争议</h3>
              <p class="text-sm text-red-700 mt-1">争议原因：{{ selectedSettlement.dispute_reason }}</p>
              <div class="mt-3 flex gap-2">
                <button @click="showResolveModal = true" class="btn-danger text-sm">
                  处理争议
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedSettlement.dispute_resolved" class="card p-4 mb-6 border-green-200 bg-green-50">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-green-900">争议已解决</h3>
              <p class="text-sm text-green-700 mt-1">解决方案：{{ selectedSettlement.dispute_resolution }}</p>
            </div>
          </div>
        </div>

        <div class="card p-4 mb-6">
          <h3 class="detail-section-title">结算明细</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
              <span class="text-gray-600">完成面积</span>
              <span class="font-medium">{{ formatArea(selectedSettlement.total_completed_area) }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
              <span class="text-gray-600">单价</span>
              <span class="font-medium">{{ formatCurrency(selectedSettlement.unit_price) }} / ㎡</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
              <span class="text-gray-600">基础金额</span>
              <span class="font-medium text-lg">{{ formatCurrency(selectedSettlement.base_amount) }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100 text-red-600">
              <span>返工扣款</span>
              <span class="font-medium">- {{ formatCurrency(selectedSettlement.rework_deduction) }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100 text-red-600">
              <span>材料损耗扣款</span>
              <span class="font-medium">- {{ formatCurrency(selectedSettlement.material_loss_deduction) }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100" :class="selectedSettlement.other_adjustment < 0 ? 'text-red-600' : 'text-green-600'">
              <span>其他调整</span>
              <span class="font-medium">{{ selectedSettlement.other_adjustment >= 0 ? '+' : '' }} {{ formatCurrency(selectedSettlement.other_adjustment) }}</span>
            </div>
            <div class="flex justify-between items-center py-3">
              <span class="text-lg font-semibold text-gray-900">最终结算金额</span>
              <span class="text-2xl font-bold text-blue-600">{{ formatCurrency(selectedSettlement.final_amount) }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div class="card p-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="detail-section-title mb-0">返工扣款明细</h3>
              <span class="text-red-600 font-medium">- {{ formatCurrency(selectedSettlement.rework_deduction) }}</span>
            </div>
            <div v-if="deductionDetails.filter(d => d.deduction_type === '返工扣款').length > 0" class="space-y-3">
              <div v-for="detail in deductionDetails.filter(d => d.deduction_type === '返工扣款')" :key="detail.id"
                class="p-3 bg-red-50 rounded-lg">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="text-sm font-medium text-red-900">{{ detail.description }}</div>
                    <div class="text-xs text-red-600 mt-1">
                      来源：{{ detail.source_type === 'inspection' ? '质检记录' : detail.source_type }}
                      <span v-if="detail.area > 0"> · 面积：{{ formatArea(detail.area) }}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-red-700">{{ formatCurrency(detail.amount) }}</div>
                    <button v-if="detail.source_type === 'inspection'" 
                      @click="goToSource(detail)" 
                      class="text-xs text-blue-600 hover:underline mt-1">
                      查看来源 →
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-6 text-gray-500 text-sm">
              本期无返工扣款
            </div>
          </div>

          <div class="card p-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="detail-section-title mb-0">材料损耗明细</h3>
              <span class="text-red-600 font-medium">- {{ formatCurrency(selectedSettlement.material_loss_deduction) }}</span>
            </div>
            <div v-if="deductionDetails.filter(d => d.deduction_type === '材料损耗').length > 0" class="space-y-3">
              <div v-for="detail in deductionDetails.filter(d => d.deduction_type === '材料损耗')" :key="detail.id"
                class="p-3 bg-orange-50 rounded-lg">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="text-sm font-medium text-orange-900">{{ detail.description }}</div>
                    <div class="text-xs text-orange-600 mt-1">
                      来源：{{ detail.source_type === 'inspection' ? '质检记录' : detail.source_type === 'delivery' ? '材料配送' : detail.source_type }}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-orange-700">{{ formatCurrency(detail.amount) }}</div>
                    <button v-if="detail.source_type === 'inspection' || detail.source_type === 'delivery'"
                      @click="goToSource(detail)" 
                      class="text-xs text-blue-600 hover:underline mt-1">
                      查看来源 →
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-6 text-gray-500 text-sm">
              本期无材料损耗扣款
            </div>
          </div>
        </div>

        <div v-if="selectedSettlement.settlement_note" class="card p-4 mt-6">
          <h3 class="detail-section-title">备注说明</h3>
          <p class="text-sm text-gray-700">{{ selectedSettlement.settlement_note }}</p>
        </div>

        <div class="flex gap-3 mt-6">
          <button v-if="selectedSettlement.status === 'pending'" class="btn-success">审核通过</button>
          <button v-if="selectedSettlement.status === 'pending'" class="btn-danger">驳回</button>
          <button class="btn-secondary">编辑结算</button>
        </div>
      </div>

      <div v-else class="h-full flex items-center justify-center text-gray-500">
        请选择左侧结算单查看详情
      </div>
    </div>

    <div v-if="showResolveModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="card p-6 w-[550px]">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">处理结算争议</h3>
        <div class="space-y-4">
          <div class="p-3 bg-gray-50 rounded-lg">
            <div class="text-sm font-medium text-gray-700 mb-1">争议原因</div>
            <p class="text-sm text-gray-600">{{ selectedSettlement?.dispute_reason }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">最终结算金额</label>
            <input v-model.number="finalAmount" type="number" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">解决方案</label>
            <textarea v-model="resolutionText" class="input-field h-32" placeholder="请输入解决方案和双方协商结果..."></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showResolveModal = false" class="btn-secondary">取消</button>
          <button @click="submitResolution" class="btn-primary">确认解决</button>
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

const settlements = ref<any[]>([])
const selectedSettlement = ref<any>(null)
const deductionDetails = ref<any[]>([])
const filterProject = ref<number | null>(null)
const filterTeam = ref<number | null>(null)
const activeTab = ref('all')
const showResolveModal = ref(false)
const resolutionText = ref('')
const finalAmount = ref(0)
const loadError = ref('')

const tabs = computed(() => [
  { value: 'all', label: '全部', count: settlements.value.length },
  { value: 'dispute', label: '有争议', count: settlements.value.filter(s => s.has_dispute && !s.dispute_resolved).length },
  { value: 'pending', label: '待审核', count: settlements.value.filter(s => s.status === 'pending').length }
])

const filteredSettlements = computed(() => {
  let result = [...settlements.value]
  if (filterProject.value) {
    result = result.filter(s => s.project_id === filterProject.value)
  }
  if (filterTeam.value) {
    result = result.filter(s => s.team_id === filterTeam.value)
  }
  if (activeTab.value === 'dispute') {
    result = result.filter(s => s.has_dispute && !s.dispute_resolved)
  } else if (activeTab.value === 'pending') {
    result = result.filter(s => s.status === 'pending')
  }
  return result
})

const getProjectName = (id: number) => appStore.projects.find((p: any) => p.id === id)?.name || '未知项目'
const getTeamName = (id: number) => appStore.teams.find((t: any) => t.id === id)?.name || '未知班组'

const loadSettlements = async () => {
  loadError.value = ''
  try {
    const params = new URLSearchParams()
    if (filterProject.value) params.append('project_id', String(filterProject.value))
    if (filterTeam.value) params.append('team_id', String(filterTeam.value))
    settlements.value = await api.get(`/settlements?${params.toString()}`) as any[]

    if (route.query.settlementId) {
      const s = settlements.value.find(x => x.id === Number(route.query.settlementId))
      if (s) {
        selectSettlement(s)
      }
    }
  } catch (e: any) {
    loadError.value = e.message || '加载结算数据失败，请稍后重试'
  }
}

const selectSettlement = async (s: any) => {
  selectedSettlement.value = s
  finalAmount.value = s.final_amount
  try {
    deductionDetails.value = await api.get(`/settlements/${s.id}/deduction-details`) as any[]
  } catch (e) {
    deductionDetails.value = []
  }
}

const goToSource = (detail: any) => {
  if (detail.source_type === 'inspection') {
    router.push(`/quality?inspectionId=${detail.source_id}`)
  } else if (detail.source_type === 'delivery') {
    router.push(`/deliveries?deliveryId=${detail.source_id}`)
  }
}

const submitResolution = async () => {
  if (!selectedSettlement.value || !resolutionText.value) return
  await api.post(`/settlements/${selectedSettlement.value.id}/resolve-dispute`, {
    resolution: resolutionText.value,
    final_amount: finalAmount.value
  })
  showResolveModal.value = false
  resolutionText.value = ''
  await loadSettlements()
  const updated = await api.get(`/settlements/${selectedSettlement.value.id}`)
  selectedSettlement.value = updated
}

const retryLoad = () => {
  loadError.value = ''
  loadSettlements()
}

onMounted(async () => {
  try {
    await appStore.loadProjects()
    await appStore.loadTeams()
    await appStore.loadUsers()
    appStore.initFromAuth()
    await loadSettlements()
  } catch (e: any) {
    loadError.value = e.message || '初始化失败，请稍后重试'
  }
})
</script>
