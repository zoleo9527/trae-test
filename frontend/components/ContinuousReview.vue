<template>
  <div class="h-full flex flex-col">
    <div class="p-4 border-b border-gray-200 bg-white">
      <h2 class="text-xl font-bold text-gray-800">连续回查面板</h2>
      <p class="text-gray-500 text-sm">一站式处理所有胶卷的异常、进度和回查</p>
    </div>
    
    <div class="flex-1 flex overflow-hidden">
      <div class="w-96 border-r border-gray-200 bg-gray-50 overflow-y-auto">
        <div class="p-4">
          <div class="flex gap-2 mb-4">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              @click="activeTab = tab.key"
              :class="[
                'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.key ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              ]"
            >
              {{ tab.name }}
              <span v-if="tab.count > 0" class="ml-1">({{ tab.count }})</span>
            </button>
          </div>
          
          <div class="space-y-3">
            <div
              v-for="roll in displayRolls"
              :key="roll.id"
              @click="selectRoll(roll)"
              :class="[
                'p-4 bg-white rounded-xl cursor-pointer transition-all border-2',
                selectedRoll?.id === roll.id ? 'border-amber-500 shadow-md' : 'border-transparent hover:shadow-sm'
              ]"
            >
              <div class="flex items-start justify-between mb-2">
                <span class="font-mono text-sm font-bold text-gray-900">{{ roll.registration_number }}</span>
                <div class="flex gap-1">
                  <span
                    v-for="tag in roll.tags.slice(0, 2)"
                    :key="tag"
                    class="px-2 py-0.5 text-xs rounded-full"
                    :class="getTagClass(tag)"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
              <p class="text-sm font-medium text-gray-700">{{ roll.customer_name }}</p>
              <p class="text-xs text-gray-500">{{ roll.film_brand }}</p>
              
              <div v-if="roll.exceptions?.length > 0" class="mt-3 space-y-2">
                <div
                  v-for="exc in roll.exceptions.filter((e: any) => !e.resolved)"
                  :key="exc.id"
                  class="p-2 bg-red-50 rounded-lg border border-red-200"
                >
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-xs rounded-full" :class="getSeverityClass(exc.severity)">
                      {{ getSeverityName(exc.severity) }}
                    </span>
                    <span class="text-xs font-medium text-red-800">{{ exc.type }}</span>
                  </div>
                  <p class="text-xs text-red-600 mt-1 line-clamp-2">{{ exc.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex-1 flex flex-col bg-white overflow-hidden">
        <div v-if="selectedRoll" class="flex-1 overflow-y-auto">
          <div class="p-6 border-b border-gray-100">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-xl font-bold text-gray-900">{{ selectedRoll.registration_number }}</h3>
                <p class="text-gray-500">{{ selectedRoll.customer_name }} · {{ selectedRoll.customer_phone }}</p>
              </div>
              <span
                class="inline-flex px-3 py-1 text-sm font-medium rounded-full"
                :class="getStatusClass(selectedRoll.status)"
              >
                {{ getStatusName(selectedRoll.status) }}
              </span>
            </div>
            
            <div class="grid grid-cols-4 gap-4 mt-4">
              <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500">胶卷型号</p>
                <p class="text-sm font-medium">{{ selectedRoll.film_brand }}</p>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500">冲洗工艺</p>
                <p class="text-sm font-medium">{{ selectedRoll.development_type }}</p>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500">扫描分辨率</p>
                <p class="text-sm font-medium">{{ selectedRoll.scan_resolution }}</p>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500">预计交付</p>
                <p class="text-sm font-medium">{{ formatDate(selectedRoll.estimated_delivery) }}</p>
              </div>
            </div>
            
            <div class="mt-4">
              <p class="text-xs text-gray-500 mb-1">特殊要求</p>
              <p class="text-sm">{{ selectedRoll.special_instructions || '无' }}</p>
            </div>
          </div>
          
          <div class="flex border-b border-gray-200">
            <button
              v-for="section in sections"
              :key="section.key"
              @click="activeSection = section.key"
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeSection === section.key ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              ]"
            >
              {{ section.name }}
              <span v-if="section.key === 'exceptions' && unresolvedExceptions.length > 0" class="ml-1 text-red-500">
                {{ unresolvedExceptions.length }}
              </span>
            </button>
          </div>
          
          <div class="p-6">
            <div v-if="activeSection === 'timeline'" class="space-y-4">
              <div class="flex gap-2 mb-4 pb-4 border-b border-gray-100">
                <button
                  v-for="tab in timelineFilterTabs"
                  :key="tab.key"
                  @click="timelineFilter = tab.key"
                  :class="[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                    timelineFilter === tab.key
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  ]"
                >
                  <span>{{ tab.icon }}</span>
                  {{ tab.name }}
                  <span
                    v-if="tab.key !== 'all' && selectedRoll?.history"
                    class="ml-1 text-xs px-1.5 py-0.5 rounded-full"
                    :class="timelineFilter === tab.key ? 'bg-white/20' : 'bg-gray-200'"
                  >
                    {{ selectedRoll.history.filter((e: any) => getEventCategory(e) === tab.key).length }}
                  </span>
                </button>
              </div>
              
              <div
                v-for="(event, index) in filteredHistory"
                :key="index"
                class="flex gap-4"
              >
                <div class="flex flex-col items-center">
                  <div class="w-3 h-3 rounded-full" :class="getEventBg(event.action)"></div>
                  <div v-if="index < filteredHistory.length - 1" class="w-0.5 h-full bg-gray-200 mt-1"></div>
                </div>
                <div class="flex-1 pb-4">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-medium text-gray-900">{{ event.action }}</span>
                    <template v-if="isStatusTransition(event)">
                      <span class="inline-flex items-center gap-1 text-xs">
                        <span
                          class="px-2 py-0.5 rounded-full font-medium"
                          :class="getStatusClass(event.from_status)"
                        >
                          {{ getStatusName(event.from_status) }}
                        </span>
                        <span class="text-gray-400">→</span>
                        <span
                          class="px-2 py-0.5 rounded-full font-medium"
                          :class="getStatusClass(event.to_status)"
                        >
                          {{ getStatusName(event.to_status) }}
                        </span>
                      </span>
                    </template>
                    <span class="text-xs text-gray-400">{{ event.operator }}</span>
                    <span class="text-xs text-gray-400 ml-auto">{{ formatDateTime(event.timestamp) }}</span>
                  </div>
                  <p class="text-sm text-gray-600 mt-1">{{ event.description }}</p>
                </div>
              </div>
              
              <div v-if="filteredHistory.length === 0" class="text-center py-8 text-gray-400">
                <p class="text-3xl mb-2">📭</p>
                <p>该分类下暂无记录</p>
              </div>
            </div>
            
            <div v-if="activeSection === 'exceptions'" class="space-y-4">
              <div
                v-for="exc in selectedRoll.exceptions"
                :key="exc.id"
                class="p-4 rounded-xl border"
                :class="exc.resolved ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'"
              >
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-xs rounded-full" :class="getSeverityClass(exc.severity)">
                      {{ getSeverityName(exc.severity) }}
                    </span>
                    <span class="font-medium">{{ exc.type }}</span>
                    <span class="text-xs text-gray-400">{{ exc.reported_by }} · {{ formatDateTime(exc.timestamp) }}</span>
                  </div>
                  <span v-if="exc.resolved" class="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">已处理</span>
                  <span v-else class="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">待处理</span>
                </div>
                <p class="text-sm text-gray-700">{{ exc.description }}</p>
                
                <div v-if="exc.resolved" class="mt-3 pt-3 border-t border-gray-200">
                  <p class="text-xs text-gray-500">处理结果：{{ exc.resolved_by }} · {{ formatDateTime(exc.resolved_at) }}</p>
                  <p class="text-sm text-gray-700 mt-1">{{ exc.resolution }}</p>
                </div>
                
                <div v-if="!exc.resolved" class="mt-3 flex gap-2">
                  <input
                    v-model="exceptionResolution"
                    type="text"
                    placeholder="输入处理方案..."
                    class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <button
                    @click="resolveException(exc.id)"
                    class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                  >
                    标记已处理
                  </button>
                </div>
              </div>
              
              <div class="mt-6 pt-4 border-t border-gray-200">
                <h4 class="font-medium text-gray-800 mb-3">登记新异常</h4>
                <div class="space-y-3">
                  <div class="grid grid-cols-2 gap-3">
                    <select v-model="newException.type" class="px-3 py-2 text-sm border border-gray-300 rounded-lg">
                      <option value="">异常类型</option>
                      <option value="胶卷混号">胶卷混号</option>
                      <option value="交付版本错发">交付版本错发</option>
                      <option value="片基划伤">片基划伤</option>
                      <option value="冲洗异常">冲洗异常</option>
                      <option value="扫描质量问题">扫描质量问题</option>
                      <option value="其他">其他</option>
                    </select>
                    <select v-model="newException.severity" class="px-3 py-2 text-sm border border-gray-300 rounded-lg">
                      <option value="low">轻微</option>
                      <option value="medium">中等</option>
                      <option value="high">严重</option>
                    </select>
                  </div>
                  <textarea
                    v-model="newException.description"
                    placeholder="详细描述异常情况..."
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    rows="2"
                  ></textarea>
                  <button
                    @click="addException"
                    class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                  >
                    登记异常
                  </button>
                </div>
              </div>
            </div>
            
            <div v-if="activeSection === 'notes'" class="space-y-4">
              <div
                v-for="note in selectedRoll.notes"
                :key="note.id"
                class="p-4 bg-gray-50 rounded-xl"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-medium text-sm">{{ note.author }}</span>
                  <span class="text-xs text-gray-400">{{ formatDateTime(note.timestamp) }}</span>
                  <span v-if="note.type !== 'normal'" class="px-2 py-0.5 text-xs rounded-full bg-gray-200">
                    {{ note.type }}
                  </span>
                </div>
                <p class="text-sm text-gray-700">{{ note.content }}</p>
              </div>
              
              <div class="mt-6 pt-4 border-t border-gray-200">
                <h4 class="font-medium text-gray-800 mb-3">添加备注</h4>
                <div class="space-y-3">
                  <textarea
                    v-model="newNote.content"
                    placeholder="输入备注内容..."
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    rows="2"
                  ></textarea>
                  <div class="flex gap-3">
                    <select v-model="newNote.type" class="px-3 py-2 text-sm border border-gray-300 rounded-lg">
                      <option value="normal">普通备注</option>
                      <option value="internal">内部沟通</option>
                      <option value="customer">客户沟通</option>
                      <option value="urgent">紧急事项</option>
                    </select>
                    <button
                      @click="addNote"
                      class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors"
                    >
                      添加备注
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="activeSection === 'actions'" class="space-y-6">
              <div>
                <h4 class="font-medium text-gray-800 mb-3">更新工序进度</h4>
                <div class="flex gap-2 flex-wrap">
                  <button
                    v-for="(step, i) in steps"
                    :key="i"
                    @click="updateStatus(step.key, i)"
                    :class="[
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      selectedRoll.current_step === i ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    ]"
                  >
                    {{ step.name }}
                  </button>
                </div>
              </div>
              
              <div class="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <h4 class="font-medium text-orange-800 mb-3">返工确认</h4>
                <p class="text-sm text-orange-700 mb-3">当前返工次数：{{ selectedRoll.rework_count }} 次</p>
                <div class="space-y-3">
                  <input
                    v-model="reworkReason"
                    type="text"
                    placeholder="返工原因..."
                    class="w-full px-3 py-2 text-sm border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <select v-model="reworkScope" class="w-full px-3 py-2 text-sm border border-orange-300 rounded-lg">
                    <option value="redevelop">重新冲洗</option>
                    <option value="rescan">重新扫描</option>
                    <option value="full">全部返工</option>
                  </select>
                  <button
                    @click="requestRework"
                    class="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors"
                  >
                    确认返工
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="flex-1 flex items-center justify-center text-gray-400">
          <div class="text-center">
            <p class="text-4xl mb-2">🔍</p>
            <p>从左侧选择一个胶卷查看详情</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  initialRollId?: string | null
}>()

const emit = defineEmits<{
  (e: 'roll-selected', id: string | null): void
}>()

const { token, user } = useAuth()
const config = useRuntimeConfig()

const activeTab = ref('all')
const activeSection = ref('timeline')
const selectedRoll = ref<any>(null)
const rolls = ref<any[]>([])
const exceptionResolution = ref('')
const newException = ref({ type: '', severity: 'medium', description: '' })
const newNote = ref({ content: '', type: 'normal' })
const reworkReason = ref('')
const reworkScope = ref('rescan')
const timelineFilter = ref('all')

const timelineFilterTabs = [
  { key: 'all', name: '全部', icon: '📋' },
  { key: 'process', name: '工序', icon: '⚙️' },
  { key: 'exception', name: '异常', icon: '⚠️' },
  { key: 'rework', name: '返工', icon: '🔄' },
  { key: 'note', name: '备注', icon: '📝' }
]

const sections = [
  { key: 'timeline', name: '时间线' },
  { key: 'exceptions', name: '异常记录' },
  { key: 'notes', name: '备注沟通' },
  { key: 'actions', name: '操作处理' }
]

const steps = [
  { key: 'registered', name: '已登记' },
  { key: 'developing', name: '冲洗中' },
  { key: 'scanning', name: '扫描中' },
  { key: 'quality_check', name: '质检中' },
  { key: 'completed', name: '已完成' }
]

const tabs = computed(() => [
  { key: 'all', name: '全部', count: rolls.value.length },
  { key: 'exceptions', name: '有异常', count: rolls.value.filter(r => r.exceptions?.some((e: any) => !e.resolved)).length },
  { key: 'rework', name: '返工中', count: rolls.value.filter(r => r.status === 'rework').length }
])

const displayRolls = computed(() => {
  if (activeTab.value === 'exceptions') {
    return rolls.value.filter(r => r.exceptions?.some((e: any) => !e.resolved))
  }
  if (activeTab.value === 'rework') {
    return rolls.value.filter(r => r.status === 'rework')
  }
  return rolls.value
})

const unresolvedExceptions = computed(() => {
  return selectedRoll.value?.exceptions?.filter((e: any) => !e.resolved) || []
})

const getEventCategory = (event: any): string => {
  const action = event.action || ''
  if (action.includes('异常')) return 'exception'
  if (action.includes('返工')) return 'rework'
  if (action.includes('备注') || action.includes('沟通') || action.includes('事项')) return 'note'
  if (action.includes('登记') && event.from_status === undefined && event.to_status === undefined) {
    return 'process'
  }
  if (event.from_status !== undefined || event.to_status !== undefined) return 'process'
  if (['开始冲洗', '开始扫描', '质量检查', '完成'].includes(action)) return 'process'
  return 'process'
}

const filteredHistory = computed(() => {
  if (!selectedRoll.value?.history) return []
  if (timelineFilter.value === 'all') return selectedRoll.value.history
  return selectedRoll.value.history.filter((e: any) => getEventCategory(e) === timelineFilter.value)
})

const isStatusTransition = (event: any): boolean => {
  return event.from_status !== undefined && event.to_status !== undefined
}

const getTagClass = (tag: string) => {
  if (tag === '异常') return 'bg-red-100 text-red-800'
  if (tag === '返工') return 'bg-orange-100 text-orange-800'
  if (tag === '加急') return 'bg-yellow-100 text-yellow-800'
  return 'bg-gray-100 text-gray-800'
}

const getSeverityClass = (severity: string) => {
  if (severity === 'high') return 'bg-red-100 text-red-800'
  if (severity === 'medium') return 'bg-orange-100 text-orange-800'
  return 'bg-yellow-100 text-yellow-800'
}

const getSeverityName = (severity: string) => {
  if (severity === 'high') return '严重'
  if (severity === 'medium') return '中等'
  return '轻微'
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    registered: 'bg-gray-100 text-gray-800',
    developing: 'bg-blue-100 text-blue-800',
    scanning: 'bg-amber-100 text-amber-800',
    quality_check: 'bg-purple-100 text-purple-800',
    rework: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusName = (status: string) => {
  const names: Record<string, string> = {
    registered: '已登记',
    developing: '冲洗中',
    scanning: '扫描中',
    quality_check: '质检中',
    rework: '返工中',
    completed: '已完成'
  }
  return names[status] || status
}

const getEventBg = (action: string) => {
  if (action.includes('异常')) return 'bg-red-500'
  if (action.includes('返工')) return 'bg-orange-500'
  if (action.includes('完成')) return 'bg-green-500'
  return 'bg-amber-500'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const loadRolls = async () => {
  try {
    const data: any = await $fetch(`${config.public.apiBase}/api/film-rolls`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    rolls.value = data.rolls || []
  } catch (e) {
    console.error('加载胶卷列表失败', e)
  }
}

const resolveException = async (exceptionId: string) => {
  if (!selectedRoll.value || !exceptionResolution.value) return
  
  try {
    await $fetch(`${config.public.apiBase}/api/film-rolls/${selectedRoll.value.id}/exceptions/${exceptionId}/resolve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        resolution: exceptionResolution.value,
        resolved_by: user.value.full_name
      }
    })
    exceptionResolution.value = ''
    await loadRolls()
    await loadSelectedRoll()
  } catch (e) {
    console.error('处理异常失败', e)
  }
}

const addException = async () => {
  if (!selectedRoll.value || !newException.value.type || !newException.value.description) return
  
  try {
    await $fetch(`${config.public.apiBase}/api/film-rolls/${selectedRoll.value.id}/exceptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        ...newException.value,
        reported_by: user.value.full_name
      }
    })
    newException.value = { type: '', severity: 'medium', description: '' }
    await loadRolls()
    await loadSelectedRoll()
  } catch (e) {
    console.error('添加异常失败', e)
  }
}

const addNote = async () => {
  if (!selectedRoll.value || !newNote.value.content) return
  
  try {
    await $fetch(`${config.public.apiBase}/api/film-rolls/${selectedRoll.value.id}/notes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        content: newNote.value.content,
        type: newNote.value.type,
        author: user.value.full_name
      }
    })
    newNote.value = { content: '', type: 'normal' }
    await loadSelectedRoll()
  } catch (e) {
    console.error('添加备注失败', e)
  }
}

const updateStatus = async (status: string, step: number) => {
  if (!selectedRoll.value) return
  
  try {
    await $fetch(`${config.public.apiBase}/api/film-rolls/${selectedRoll.value.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        status,
        current_step: step,
        note: `更新状态为：${getStatusName(status)}`,
        operator: user.value.full_name
      }
    })
    await loadRolls()
    await loadSelectedRoll()
  } catch (e) {
    console.error('更新状态失败', e)
  }
}

const requestRework = async () => {
  if (!selectedRoll.value || !reworkReason.value) return
  
  try {
    await $fetch(`${config.public.apiBase}/api/film-rolls/${selectedRoll.value.id}/rework`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        reason: reworkReason.value,
        confirmed_by: user.value.full_name,
        rework_scope: reworkScope.value
      }
    })
    reworkReason.value = ''
    await loadRolls()
    await loadSelectedRoll()
  } catch (e) {
    console.error('申请返工失败', e)
  }
}

const loadSelectedRoll = async () => {
  if (!selectedRoll.value) return
  
  try {
    const data: any = await $fetch(`${config.public.apiBase}/api/film-rolls/${selectedRoll.value.id}`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    selectedRoll.value = data
  } catch (e) {
    console.error('加载胶卷详情失败', e)
  }
}

const selectRoll = async (roll: any) => {
  selectedRoll.value = roll
  timelineFilter.value = 'all'
  activeSection.value = 'timeline'
  emit('roll-selected', roll.id)
  await loadSelectedRoll()
}

const trySelectInitialRoll = () => {
  if (props.initialRollId && rolls.value.length > 0) {
    const roll = rolls.value.find(r => r.id === props.initialRollId)
    if (roll) {
      selectRoll(roll)
    }
  }
}

watch(() => props.initialRollId, (newId) => {
  if (newId) {
    trySelectInitialRoll()
  }
})

onMounted(async () => {
  await loadRolls()
  trySelectInitialRoll()
})
</script>
