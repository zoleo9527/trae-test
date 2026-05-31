<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-sm text-gray-500">账户总数</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ prepaidStore.accounts.length }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">活跃账户</p>
        <p class="text-2xl font-bold text-green-600 mt-1">{{ prepaidStore.activeCount }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">总余额</p>
        <p class="text-2xl font-bold text-primary-600 mt-1">¥{{ commonStore.formatMoney(prepaidStore.totalBalance) }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">本月消费</p>
        <p class="text-2xl font-bold text-amber-600 mt-1">¥{{ commonStore.formatMoney(monthlyConsumption) }}</p>
      </div>
    </div>

    <FilterBar
      :show-category="true"
      :show-assignee="false"
      :category-options="levelOptions"
      @filter="handleFilter"
    >
      <template #actions>
        <button
          v-if="userStore.hasPermission('prepaid:create')"
          class="btn btn-primary"
          @click="showCreateModal = true"
        >
          新建账户
        </button>
      </template>
    </FilterBar>

    <div class="card p-0 overflow-hidden">
      <div class="table-container border-0 rounded-none">
        <table class="table">
          <thead>
            <tr>
              <th>账户编号</th>
              <th>客户</th>
              <th>会员等级</th>
              <th>折扣率</th>
              <th>账户余额</th>
              <th>总充值</th>
              <th>总消费</th>
              <th>积分</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="account in pagedAccounts"
              :key="account.id"
              class="cursor-pointer"
              @click="navigateTo(`/prepaid/${account.id}`)"
            >
              <td class="font-medium text-primary-600">{{ account.accountNo }}</td>
              <td>
                <div>
                  <p class="font-medium text-gray-900">{{ account.customerName }}</p>
                  <p class="text-xs text-gray-500">{{ account.customerPhone }}</p>
                </div>
              </td>
              <td>
                <span :class="getLevelBadgeClass(account.level)">{{ prepaidStore.getLevelLabel(account.level) }}</span>
              </td>
              <td class="font-medium text-amber-600">{{ (account.discountRate * 10).toFixed(1) }}折</td>
              <td class="font-medium text-gray-900">¥{{ commonStore.formatMoney(account.balance) }}</td>
              <td class="text-green-600">¥{{ commonStore.formatMoney(account.totalRecharged) }}</td>
              <td class="text-red-600">¥{{ commonStore.formatMoney(account.totalConsumed) }}</td>
              <td class="text-purple-600">{{ account.pointBalance }} 分</td>
              <td>
                <span
                  :class="account.status === 'active' ? 'badge bg-green-100 text-green-800' : account.status === 'frozen' ? 'badge bg-yellow-100 text-yellow-800' : 'badge bg-gray-100 text-gray-800'"
                >
                  {{ getStatusLabel(account.status) }}
                </span>
              </td>
              <td @click.stop>
                <div class="flex items-center gap-2">
                  <button
                    v-if="userStore.hasPermission('prepaid:recharge') && account.status === 'active'"
                    class="text-sm text-green-600 hover:text-green-700"
                    @click="openRechargeModal(account)"
                  >
                    充值
                  </button>
                  <button
                    class="text-sm text-gray-500 hover:text-gray-700"
                    @click="navigateTo(`/prepaid/${account.id}`)"
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
        :total="filteredAccounts.length"
        @change="handlePageChange"
      />
    </div>

    <div v-if="showRechargeModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">账户充值</h3>
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500">账户</p>
            <p class="text-sm font-medium text-gray-900 mt-1">
              {{ rechargeAccount?.customerName }} ({{ rechargeAccount?.accountNo }})
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">充值金额</label>
            <input
              v-model.number="rechargeAmount"
              type="number"
              min="0"
              step="100"
              class="input"
              placeholder="请输入充值金额"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              v-model="rechargeRemark"
              class="input"
              rows="2"
              placeholder="可选"
            />
          </div>
          <div class="flex items-center gap-3 pt-4">
            <button class="btn btn-outline flex-1" @click="showRechargeModal = false">取消</button>
            <button class="btn btn-primary flex-1" @click="handleRecharge">确认充值</button>
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
import { usePrepaidStore } from '~/stores/prepaid'
import { useNotificationStore } from '~/stores/notification'
import FilterBar from '~/components/FilterBar.vue'
import Pagination from '~/components/Pagination.vue'
import type { PrepaidAccount } from '~/types'

const userStore = useUserStore()
const commonStore = useCommonStore()
const prepaidStore = usePrepaidStore()
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

const showCreateModal = ref(false)
const showRechargeModal = ref(false)
const rechargeAccount = ref<PrepaidAccount | null>(null)
const rechargeAmount = ref(0)
const rechargeRemark = ref('')

const levelOptions = [
  { value: 'normal', label: '普通会员' },
  { value: 'silver', label: '银卡会员' },
  { value: 'gold', label: '金卡会员' },
  { value: 'platinum', label: '铂金会员' }
]

const filteredAccounts = computed(() => {
  return prepaidStore.accounts.filter(account => {
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      if (!account.accountNo.toLowerCase().includes(keyword) &&
          !account.customerName.toLowerCase().includes(keyword) &&
          !account.customerPhone.includes(keyword)) {
        return false
      }
    }

    if (filters.status && account.status !== filters.status) return false
    if (filters.category && account.level !== filters.category) return false

    return true
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})

const pagedAccounts = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  return filteredAccounts.value.slice(start, start + pagination.pageSize)
})

const monthlyConsumption = computed(() => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  
  return prepaidStore.accounts.reduce((sum, account) => {
    const monthTransactions = account.transactions.filter(
      t => t.type === 'consume' && t.createdAt >= monthStart
    )
    return sum + monthTransactions.reduce((s, t) => s + t.amount, 0)
  }, 0)
})

function handleFilter(newFilters: typeof filters) {
  Object.assign(filters, newFilters)
  pagination.page = 1
}

function handlePageChange() {}

function getLevelBadgeClass(level: string): string {
  const map: Record<string, string> = {
    normal: 'badge bg-gray-100 text-gray-800',
    silver: 'badge bg-gray-200 text-gray-800',
    gold: 'badge bg-yellow-100 text-yellow-800',
    platinum: 'badge bg-purple-100 text-purple-800'
  }
  return map[level] || 'badge bg-gray-100 text-gray-800'
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: '正常',
    frozen: '已冻结',
    closed: '已注销'
  }
  return map[status] || status
}

function openRechargeModal(account: PrepaidAccount) {
  rechargeAccount.value = account
  rechargeAmount.value = 0
  rechargeRemark.value = ''
  showRechargeModal.value = true
}

function handleRecharge() {
  if (!rechargeAccount.value || rechargeAmount.value <= 0) {
    notificationStore.showToastMessage('error', '请输入有效的充值金额')
    return
  }

  const success = prepaidStore.recharge(
    rechargeAccount.value.id,
    rechargeAmount.value,
    rechargeRemark.value
  )

  if (success) {
    notificationStore.showToastMessage('success', '充值成功')
    showRechargeModal.value = false
  } else {
    notificationStore.showToastMessage('error', '充值失败')
  }
}
</script>
