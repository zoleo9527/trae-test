<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-sm text-gray-500">器材总数</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ equipmentStore.equipment.length }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">可租借</p>
        <p class="text-2xl font-bold text-green-600 mt-1">{{ equipmentStore.availableCount }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">已借出</p>
        <p class="text-2xl font-bold text-amber-600 mt-1">{{ equipmentStore.borrowedCount }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">维修中</p>
        <p class="text-2xl font-bold text-red-600 mt-1">{{ equipmentStore.maintenanceCount }}</p>
      </div>
    </div>

    <div v-if="equipmentStore.overdueCount > 0" class="card bg-red-50 border-red-200">
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p class="font-medium text-red-900">逾期提醒</p>
          <p class="text-sm text-red-700">有 {{ equipmentStore.overdueCount }} 件器材已逾期未归还，请及时跟进处理</p>
        </div>
        <button class="btn btn-sm btn-red ml-auto" @click="showOverdueOnly = !showOverdueOnly">
          {{ showOverdueOnly ? '显示全部' : '查看逾期' }}
        </button>
      </div>
    </div>

    <FilterBar
      :show-category="true"
      :show-status="true"
      :show-assignee="false"
      :category-options="categoryOptions"
      :status-options="statusOptions"
      @filter="handleFilter"
    >
      <template #actions>
        <button
          v-if="userStore.hasPermission('equipment:create')"
          class="btn btn-primary"
          @click="showCreateModal = true"
        >
          新增器材
        </button>
      </template>
    </FilterBar>

    <div class="card p-0 overflow-hidden">
      <div class="table-container border-0 rounded-none">
        <table class="table">
          <thead>
            <tr>
              <th>器材编号</th>
              <th>器材名称</th>
              <th>分类</th>
              <th>品牌/型号</th>
              <th>状态</th>
              <th>成色</th>
              <th>租借费</th>
              <th>押金</th>
              <th>当前借用人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="equip in pagedEquipment"
              :key="equip.id"
              class="cursor-pointer"
              :class="isOverdue(equip) ? 'bg-red-50' : ''"
              @click="navigateTo(`/equipment/${equip.id}`)"
            >
              <td class="font-medium text-primary-600">{{ equip.equipmentNo }}</td>
              <td>
                <div>
                  <p class="font-medium text-gray-900">{{ equip.name }}</p>
                  <p v-if="equip.notes" class="text-xs text-gray-500">{{ equip.notes }}</p>
                </div>
              </td>
              <td>
                <span class="badge bg-blue-100 text-blue-800">{{ equipmentStore.getCategoryLabel(equip.category) }}</span>
              </td>
              <td>
                <p class="text-sm text-gray-900">{{ equip.brand || '--' }}</p>
                <p class="text-xs text-gray-500">{{ equip.model || '--' }}</p>
              </td>
              <td>
                <span
                  :class="getStatusBadgeClass(equip.status)"
                  class="inline-flex items-center gap-1"
                >
                  <span v-if="isOverdue(equip)" class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                  {{ equipmentStore.getStatusLabel(equip.status) }}
                </span>
              </td>
              <td>
                <span :class="getConditionBadgeClass(equip.condition)">
                  {{ equipmentStore.getConditionLabel(equip.condition) }}
                </span>
              </td>
              <td class="font-medium">¥{{ equip.rentalFee }}/次</td>
              <td>¥{{ equip.deposit }}</td>
              <td>
                <div v-if="equip.currentBorrowerName">
                  <p class="text-sm text-gray-900">{{ equip.currentBorrowerName }}</p>
                  <p v-if="getActiveBorrow(equip)?.expectedReturnDate" class="text-xs" :class="isOverdue(equip) ? 'text-red-600' : 'text-gray-500'">
                    应还：{{ commonStore.formatDate(getActiveBorrow(equip)!.expectedReturnDate) }}
                  </p>
                </div>
                <span v-else class="text-gray-400">--</span>
              </td>
              <td @click.stop>
                <div class="flex items-center gap-2">
                  <button
                    v-if="equip.status === 'borrowed' && userStore.hasPermission('equipment:return')"
                    class="text-sm text-green-600 hover:text-green-700"
                    @click="openReturnModal(equip)"
                  >
                    归还
                  </button>
                  <button
                    v-if="equip.status === 'available' && userStore.hasPermission('equipment:lend')"
                    class="text-sm text-primary-600 hover:text-primary-700"
                    @click="openLendModal(equip)"
                  >
                    借出
                  </button>
                  <button
                    class="text-sm text-gray-500 hover:text-gray-700"
                    @click="navigateTo(`/equipment/${equip.id}`)"
                  >
                    详情
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-model:page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="filteredEquipment.length"
        @change="handlePageChange"
      />
    </div>

    <div v-if="showReturnModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">器材归还验收</h3>
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500">器材</p>
            <p class="text-sm font-medium text-gray-900 mt-1">
              {{ returnEquipment?.name }} ({{ returnEquipment?.equipmentNo }})
            </p>
          </div>
          <div v-if="returnEquipment?.currentBorrowerName">
            <p class="text-sm text-gray-500">借用人</p>
            <p class="text-sm font-medium text-gray-900 mt-1">
              {{ returnEquipment.currentBorrowerName }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">归还状态 <span class="text-red-500">*</span></label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="option in returnConditionOptions"
                :key="option.value"
                :class="['py-2 px-3 rounded-lg border text-sm font-medium transition-colors', returnCondition === option.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300']"
                @click="returnCondition = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">备注说明</label>
            <textarea
              v-model="returnRemark"
              class="input"
              rows="2"
              :placeholder="returnCondition === 'damaged' ? '请详细描述损坏情况' : returnCondition === 'poor' ? '请说明具体状况' : '可选'"
            />
          </div>
          <div v-if="returnCondition === 'damaged'" class="p-3 bg-amber-50 rounded-lg">
            <p class="text-sm text-amber-800 font-medium">押金处理</p>
            <p class="text-xs text-amber-600 mt-1">器材损坏，押金将不予退还，并自动创建维修单</p>
          </div>
          <div v-if="returnCondition === 'poor'" class="p-3 bg-orange-50 rounded-lg">
            <p class="text-sm text-orange-800 font-medium">押金处理</p>
            <p class="text-xs text-orange-600 mt-1">器材状况较差，将根据实际情况扣除部分押金</p>
          </div>
          <div class="flex items-center gap-3 pt-4">
            <button class="btn btn-outline flex-1" @click="showReturnModal = false">取消</button>
            <button class="btn btn-primary flex-1" @click="handleReturn">确认归还</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showLendModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">器材借出</h3>
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500">器材</p>
            <p class="text-sm font-medium text-gray-900 mt-1">
              {{ lendEquipment?.name }} ({{ lendEquipment?.equipmentNo }})
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">租借费</p>
            <p class="text-sm font-medium text-primary-600 mt-1">¥{{ lendEquipment?.rentalFee }}/次</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">押金</p>
            <p class="text-sm font-medium text-amber-600 mt-1">¥{{ lendEquipment?.deposit }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">借用人姓名 <span class="text-red-500">*</span></label>
            <input v-model="lendBorrowerName" type="text" class="input" placeholder="请输入借用人姓名" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">联系电话 <span class="text-red-500">*</span></label>
            <input v-model="lendBorrowerPhone" type="tel" class="input" placeholder="请输入联系电话" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">预计归还日期</label>
            <input v-model="lendExpectedReturn" type="date" class="input" />
          </div>
          <div class="flex items-center gap-3 pt-4">
            <button class="btn btn-outline flex-1" @click="showLendModal = false">取消</button>
            <button class="btn btn-primary flex-1" @click="handleLend">确认借出</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">新增器材</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">器材名称 <span class="text-red-500">*</span></label>
            <input v-model="newEquipment.name" type="text" class="input" placeholder="请输入器材名称" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">器材分类</label>
              <select v-model="newEquipment.category" class="select">
                <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.value">
                  {{ cat.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">成色</label>
              <select v-model="newEquipment.condition" class="select">
                <option value="new">全新</option>
                <option value="good">良好</option>
                <option value="fair">一般</option>
                <option value="poor">较差</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">品牌</label>
              <input v-model="newEquipment.brand" type="text" class="input" placeholder="可选" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">型号</label>
              <input v-model="newEquipment.model" type="text" class="input" placeholder="可选" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">租借费（元/次）</label>
              <input v-model.number="newEquipment.rentalFee" type="number" min="0" class="input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">押金（元）</label>
              <input v-model.number="newEquipment.deposit" type="number" min="0" class="input" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea v-model="newEquipment.notes" class="input" rows="2" placeholder="可选" />
          </div>
          <div class="flex items-center gap-3 pt-4">
            <button class="btn btn-outline flex-1" @click="showCreateModal = false">取消</button>
            <button class="btn btn-primary flex-1" @click="handleCreateEquipment">创建器材</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useUserStore } from '~/stores/user'
import { useCommonStore } from '~/stores/common'
import { useEquipmentStore } from '~/stores/equipment'
import { useNotificationStore } from '~/stores/notification'
import FilterBar from '~/components/FilterBar.vue'
import Pagination from '~/components/Pagination.vue'
import type { Equipment, BorrowRecord, EquipmentCategory } from '~/types'

const userStore = useUserStore()
const commonStore = useCommonStore()
const equipmentStore = useEquipmentStore()
const notificationStore = useNotificationStore()

const filters = reactive({
  keyword: '',
  startDate: '',
  endDate: '',
  status: '',
  category: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const showOverdueOnly = ref(false)
const showCreateModal = ref(false)
const showReturnModal = ref(false)
const showLendModal = ref(false)
const returnEquipment = ref<Equipment | null>(null)
const lendEquipment = ref<Equipment | null>(null)
const returnCondition = ref<'new' | 'good' | 'fair' | 'poor' | 'damaged'>('good')
const returnRemark = ref('')
const lendBorrowerName = ref('')
const lendBorrowerPhone = ref('')
const lendExpectedReturn = ref('')

const newEquipment = reactive({
  name: '',
  category: 'club' as EquipmentCategory,
  condition: 'good' as 'new' | 'good' | 'fair' | 'poor',
  brand: '',
  model: '',
  rentalFee: 50,
  deposit: 200,
  notes: ''
})

function resetNewEquipment() {
  newEquipment.name = ''
  newEquipment.category = 'club'
  newEquipment.condition = 'good'
  newEquipment.brand = ''
  newEquipment.model = ''
  newEquipment.rentalFee = 50
  newEquipment.deposit = 200
  newEquipment.notes = ''
}

function handleCreateEquipment() {
  if (!newEquipment.name.trim()) {
    notificationStore.showToastMessage('error', '请输入器材名称')
    return
  }

  const equip = equipmentStore.createEquipment({
    name: newEquipment.name,
    category: newEquipment.category,
    condition: newEquipment.condition,
    brand: newEquipment.brand || undefined,
    model: newEquipment.model || undefined,
    rentalFee: newEquipment.rentalFee,
    deposit: newEquipment.deposit,
    notes: newEquipment.notes || undefined
  })

  notificationStore.showToastMessage('success', '器材创建成功')
  showCreateModal.value = false
  resetNewEquipment()

  navigateTo(`/equipment/${equip.id}`)
}

const returnConditionOptions: { value: 'new' | 'good' | 'fair' | 'poor' | 'damaged'; label: string }[] = [
  { value: 'good', label: '完好' },
  { value: 'fair', label: '一般' },
  { value: 'poor', label: '较差' },
  { value: 'damaged', label: '损坏' }
]

const categoryOptions = [
  { value: 'club', label: '球杆' },
  { value: 'bag', label: '球包' },
  { value: 'cart', label: '球车' },
  { value: 'range_finder', label: '测距仪' },
  { value: 'umbrella', label: '雨伞' },
  { value: 'other', label: '其他' }
]

const statusOptions = [
  { value: 'available', label: '可租借' },
  { value: 'borrowed', label: '已借出' },
  { value: 'maintenance', label: '维修中' },
  { value: 'lost', label: '已遗失' },
  { value: 'damaged', label: '已损坏' }
]

const filteredEquipment = computed(() => {
  let result = equipmentStore.equipment.filter(equip => {
    if (showOverdueOnly.value && !isOverdue(equip)) return false
    
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      if (!equip.equipmentNo.toLowerCase().includes(keyword) &&
          !equip.name.toLowerCase().includes(keyword) &&
          !equip.brand?.toLowerCase().includes(keyword)) {
        return false
      }
    }

    if (filters.status && equip.status !== filters.status) return false
    if (filters.category && equip.category !== filters.category) return false

    return true
  })

  return result.sort((a, b) => {
    if (isOverdue(a) && !isOverdue(b)) return -1
    if (!isOverdue(a) && isOverdue(b)) return 1
    return a.equipmentNo.localeCompare(b.equipmentNo)
  })
})

const pagedEquipment = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  return filteredEquipment.value.slice(start, start + pagination.pageSize)
})

function isOverdue(equip: Equipment): boolean {
  if (equip.status !== 'borrowed') return false
  const activeBorrow = getActiveBorrow(equip)
  if (!activeBorrow) return false
  return new Date(activeBorrow.expectedReturnDate) < new Date()
}

function getActiveBorrow(equip: Equipment): BorrowRecord | undefined {
  return equip.borrowHistory.find(b => b.status === 'active')
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    available: 'badge bg-green-100 text-green-800',
    borrowed: 'badge bg-amber-100 text-amber-800',
    maintenance: 'badge bg-red-100 text-red-800',
    lost: 'badge bg-gray-100 text-gray-800',
    damaged: 'badge bg-red-100 text-red-800'
  }
  return map[status] || 'badge bg-gray-100 text-gray-800'
}

function getConditionBadgeClass(condition: string): string {
  const map: Record<string, string> = {
    new: 'badge bg-green-100 text-green-800',
    good: 'badge bg-blue-100 text-blue-800',
    fair: 'badge bg-yellow-100 text-yellow-800',
    poor: 'badge bg-orange-100 text-orange-800',
    damaged: 'badge bg-red-100 text-red-800'
  }
  return map[condition] || 'badge bg-gray-100 text-gray-800'
}

function handleFilter(newFilters: typeof filters) {
  Object.assign(filters, newFilters)
  pagination.page = 1
}

function handlePageChange() {}

function openReturnModal(equip: Equipment) {
  returnEquipment.value = equip
  returnCondition.value = 'good'
  returnRemark.value = ''
  showReturnModal.value = true
}

function openLendModal(equip: Equipment) {
  lendEquipment.value = equip
  lendBorrowerName.value = ''
  lendBorrowerPhone.value = ''
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  lendExpectedReturn.value = tomorrow.toISOString().split('T')[0]
  showLendModal.value = true
}

function handleReturn() {
  if (!returnEquipment.value) return

  const success = equipmentStore.returnEquipment(
    returnEquipment.value.id,
    returnCondition.value,
    returnRemark.value
  )

  if (success) {
    notificationStore.showToastMessage('success', '器材归还成功')
    showReturnModal.value = false
  } else {
    notificationStore.showToastMessage('error', '归还失败')
  }
}

function handleLend() {
  if (!lendEquipment.value) return

  if (!lendBorrowerName.value.trim() || !lendBorrowerPhone.value.trim()) {
    notificationStore.showToastMessage('error', '请填写借用人信息')
    return
  }

  const borrowerId = `temp-${Date.now()}`
  const success = equipmentStore.lendEquipment(
    lendEquipment.value.id,
    {
      id: borrowerId,
      name: lendBorrowerName.value,
      phone: lendBorrowerPhone.value
    },
    undefined,
    undefined,
    lendExpectedReturn.value || undefined
  )

  if (success) {
    notificationStore.showToastMessage('success', '器材借出成功')
    showLendModal.value = false
  } else {
    notificationStore.showToastMessage('error', '借出失败')
  }
}
</script>
