<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">胶卷队列</h2>
        <p class="text-gray-500">查看和管理所有胶卷冲扫进度</p>
      </div>
      <div class="flex gap-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索单号、客户名、电话..."
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent w-64"
        />
        <select
          v-model="statusFilter"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        >
          <option value="">全部状态</option>
          <option value="registered">已登记</option>
          <option value="developing">冲洗中</option>
          <option value="scanning">扫描中</option>
          <option value="quality_check">质检中</option>
          <option value="rework">返工中</option>
          <option value="completed">已完成</option>
        </select>
      </div>
    </div>
    
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">单号</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">胶卷信息</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">工序</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">标签</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="roll in filteredRolls" :key="roll.id" class="hover:bg-gray-50">
            <td class="px-4 py-4">
              <span class="font-mono text-sm font-medium text-gray-900">{{ roll.registration_number }}</span>
            </td>
            <td class="px-4 py-4">
              <div>
                <p class="text-sm font-medium text-gray-900">{{ roll.customer_name }}</p>
                <p class="text-xs text-gray-500">{{ roll.customer_phone }}</p>
              </div>
            </td>
            <td class="px-4 py-4">
              <div>
                <p class="text-sm text-gray-900">{{ roll.film_brand }}</p>
                <p class="text-xs text-gray-500">{{ roll.film_type }} / {{ roll.frame_count }}张 / {{ roll.scan_resolution }}</p>
              </div>
            </td>
            <td class="px-4 py-4">
              <div class="flex items-center gap-1">
                <div
                  v-for="(_, i) in 5"
                  :key="i"
                  class="w-6 h-2 rounded-full"
                  :class="i <= roll.current_step ? 'bg-amber-500' : 'bg-gray-200'"
                ></div>
              </div>
              <p class="text-xs text-gray-500 mt-1">{{ stepNames[roll.current_step] }}</p>
            </td>
            <td class="px-4 py-4">
              <span
                class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                :class="getStatusClass(roll.status)"
              >
                {{ getStatusName(roll.status) }}
              </span>
            </td>
            <td class="px-4 py-4">
              <div class="flex gap-1 flex-wrap">
                <span
                  v-for="tag in roll.tags"
                  :key="tag"
                  class="inline-flex px-2 py-0.5 text-xs rounded-full"
                  :class="getTagClass(tag)"
                >
                  {{ tag }}
                </span>
              </div>
            </td>
            <td class="px-4 py-4">
              <button
                @click="$emit('selectRoll', roll)"
                class="text-amber-600 hover:text-amber-800 text-sm font-medium"
              >
                查看详情
              </button>
            </td>
          </tr>
          <tr v-if="filteredRolls.length === 0">
            <td colspan="7" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const { token } = useAuth()
const config = useRuntimeConfig()

defineEmits(['selectRoll'])

const searchQuery = ref('')
const statusFilter = ref('')
const rolls = ref<any[]>([])

const stepNames = ['已登记', '冲洗中', '扫描中', '质检中', '已完成']

const filteredRolls = computed(() => {
  let result = rolls.value
  if (statusFilter.value) {
    result = result.filter(r => r.status === statusFilter.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(r => 
      r.registration_number.toLowerCase().includes(q) ||
      r.customer_name.toLowerCase().includes(q) ||
      r.customer_phone.includes(q)
    )
  }
  return result
})

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

const getTagClass = (tag: string) => {
  if (tag === '异常') return 'bg-red-100 text-red-800'
  if (tag === '返工') return 'bg-orange-100 text-orange-800'
  if (tag === '加急') return 'bg-yellow-100 text-yellow-800'
  return 'bg-gray-100 text-gray-800'
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

onMounted(() => {
  loadRolls()
})
</script>
