<template>
  <div v-if="account" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          @click="navigateTo('/prepaid')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ account.accountNo }}</h1>
          <div class="flex items-center gap-2 mt-1">
            <span :class="getLevelBadgeClass(account.level)">{{ prepaidStore.getLevelLabel(account.level) }}</span>
            <span
              :class="account.status === 'active' ? 'badge bg-green-100 text-green-800' : account.status === 'frozen' ? 'badge bg-yellow-100 text-yellow-800' : 'badge bg-gray-100 text-gray-800'"
            >
              {{ getStatusLabel(account.status) }}
            </span>
            <span class="text-sm text-gray-500">{{ commonStore.formatDateTime(account.createdAt) }} 开户</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="userStore.hasPermission('prepaid:recharge') && account.status === 'active'"
          class="btn btn-primary"
          @click="showRechargeModal = true"
        >
          充值
        </button>
        <button
          v-if="userStore.hasPermission('prepaid:adjust') && account.status === 'active'"
          class="btn btn-outline"
          @click="showAdjustModal = true"
        >
          余额调整
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card p-4">
        <p class="text-sm text-gray-500">账户余额</p>
        <p class="text-2xl font-bold text-primary-600 mt-1">{{ commonStore.formatMoney(account.balance) }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">累计充值</p>
        <p class="text-2xl font-bold text-green-600 mt-1">{{ commonStore.formatMoney(account.totalRecharged) }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">累计消费</p>
        <p class="text-2xl font-bold text-red-600 mt-1">{{ commonStore.formatMoney(account.totalConsumed) }}</p>
      </div>
      <div class="card p-4">
        <p class="text-sm text-gray-500">积分余额</p>
        <p class="text-2xl font-bold text-purple-600 mt-1">{{ account.pointBalance }} 分</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">客户信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">客户姓名</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ account.customerName }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">联系电话</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ account.customerPhone }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">会员等级</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ prepaidStore.getLevelLabel(account.level) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">折扣率</p>
              <p class="text-sm font-medium text-amber-600 mt-1">{{ (account.discountRate * 10).toFixed(1) }}折</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">开户日期</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ commonStore.formatDate(account.createdAt) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">有效期至</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ account.expireDate ? commonStore.formatDate(account.expireDate) : '长期有效' }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">交易记录</h3>
            <div class="flex items-center gap-2">
              <select v-model="transactionFilter" class="input text-sm py-1 px-3">
                <option value="all">全部</option>
                <option value="recharge">充值</option>
                <option value="consume">消费</option>
                <option value="refund">退款</option>
                <option value="adjust">调整</option>
              </select>
            </div>
          </div>
          <div class="space-y-3">
            <div
              v-for="tx in filteredTransactions"
              :key="tx.id"
              class="p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span :class="getTransactionTypeBadgeClass(tx.type)">
                      {{ prepaidStore.getTransactionTypeLabel(tx.type) }}
                    </span>
                    <span class="text-xs text-gray-500">{{ tx.transactionNo }}</span>
                  </div>
                  <p v-if="tx.consumptionDetail" class="text-sm text-gray-700 mb-2">
                    {{ tx.consumptionDetail }}
                  </p>
                  <div class="flex items-center gap-4 text-xs text-gray-500">
                    <span>{{ commonStore.formatDateTime(tx.createdAt) }}</span>
                    <span>操作人：{{ tx.operatorName }}</span>
                    <span v-if="tx.relatedBookingNo">
                      关联预约：
                      <span class="text-primary-600 cursor-pointer hover:underline" @click="navigateTo(`/booking/${tx.relatedBookingId}`)">
                        {{ tx.relatedBookingNo }}
                      </span>
                    </span>
                  </div>
                  <p v-if="tx.remark" class="text-xs text-gray-500 mt-1">备注：{{ tx.remark }}</p>
                </div>
                <div class="text-right ml-4">
                  <p :class="tx.amount >= 0 ? 'text-green-600' : 'text-red-600'" class="text-lg font-bold">
                    {{ tx.amount >= 0 ? '+' : '' }}{{ commonStore.formatMoney(Math.abs(tx.amount)) }}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    余额：{{ commonStore.formatMoney(tx.balanceAfter) }}
                  </p>
                </div>
              </div>
            </div>
            <div v-if="filteredTransactions.length === 0" class="text-center py-8 text-gray-500">
              暂无交易记录
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">状态变更历史</h3>
          </div>
          <StatusTimeline :record-id="account.id" />
        </div>

        <div class="card">
          <RemarkList :record-id="account.id" />
        </div>
      </div>

      <div class="space-y-6">
        <RelatedInfoPanel
          :prepaid-account-id="account.id"
        />

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">消耗口径说明</h3>
          <div class="space-y-3 text-sm">
            <div class="p-3 bg-blue-50 rounded-lg">
              <p class="font-medium text-blue-900 mb-1">可储值抵扣项目</p>
              <p class="text-blue-700">打位费、练习球、教练课程、球杆租赁</p>
            </div>
            <div class="p-3 bg-amber-50 rounded-lg">
              <p class="font-medium text-amber-900 mb-1">不可储值抵扣项目</p>
              <p class="text-amber-700">商品销售、餐饮、违约金、押金</p>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg">
              <p class="font-medium text-gray-900 mb-1">折扣规则</p>
              <ul class="text-gray-700 space-y-1">
                <li>普通会员：无折扣</li>
                <li>银卡会员：9折</li>
                <li>金卡会员：85折</li>
                <li>铂金会员：85折</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">快速统计</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">交易笔数</span>
              <span class="text-sm font-medium text-gray-900">{{ account.transactions.length }} 笔</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">充值笔数</span>
              <span class="text-sm font-medium text-green-600">{{ countByType('recharge') }} 笔</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">消费笔数</span>
              <span class="text-sm font-medium text-red-600">{{ countByType('consume') }} 笔</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">本月消费</span>
              <span class="text-sm font-medium text-amber-600">¥{{ commonStore.formatMoney(monthlyConsumption) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRechargeModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">账户充值</h3>
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500">当前余额</p>
            <p class="text-xl font-bold text-primary-600 mt-1">¥{{ commonStore.formatMoney(account.balance) }}</p>
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
            <p v-if="rechargeAmount > 0" class="text-xs text-gray-500 mt-1">
              预计赠送积分：{{ Math.floor(rechargeAmount / 10) }} 分
            </p>
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

    <div v-if="showAdjustModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">余额调整</h3>
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500">当前余额</p>
            <p class="text-xl font-bold text-primary-600 mt-1">¥{{ commonStore.formatMoney(account.balance) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">调整金额</label>
            <input
              v-model.number="adjustAmount"
              type="number"
              step="1"
              class="input"
              placeholder="正数增加，负数减少"
            />
            <p v-if="adjustAmount !== 0" class="text-xs text-gray-500 mt-1">
              调整后余额：¥{{ commonStore.formatMoney(account.balance + adjustAmount) }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">调整原因 <span class="text-red-500">*</span></label>
            <textarea
              v-model="adjustRemark"
              class="input"
              rows="2"
              placeholder="请说明调整原因"
            />
          </div>
          <div class="flex items-center gap-3 pt-4">
            <button class="btn btn-outline flex-1" @click="showAdjustModal = false">取消</button>
            <button class="btn btn-primary flex-1" @click="handleAdjust">确认调整</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '~/stores/user'
import { useCommonStore } from '~/stores/common'
import { usePrepaidStore } from '~/stores/prepaid'
import { useNotificationStore } from '~/stores/notification'
import StatusTimeline from '~/components/StatusTimeline.vue'
import RemarkList from '~/components/RemarkList.vue'
import RelatedInfoPanel from '~/components/RelatedInfoPanel.vue'
import type { PrepaidAccount } from '~/types'

const route = useRoute()
const userStore = useUserStore()
const commonStore = useCommonStore()
const prepaidStore = usePrepaidStore()
const notificationStore = useNotificationStore()

const account = ref<PrepaidAccount | null>(null)
const transactionFilter = ref('all')
const showRechargeModal = ref(false)
const showAdjustModal = ref(false)
const rechargeAmount = ref(0)
const rechargeRemark = ref('')
const adjustAmount = ref(0)
const adjustRemark = ref('')

const filteredTransactions = computed(() => {
  if (!account.value) return []
  
  let transactions = [...account.value.transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  if (transactionFilter.value !== 'all') {
    transactions = transactions.filter(t => t.type === transactionFilter.value)
  }
  
  return transactions
})

const monthlyConsumption = computed(() => {
  if (!account.value) return 0
  
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  
  return account.value.transactions
    .filter(t => t.type === 'consume' && t.createdAt >= monthStart)
    .reduce((sum, t) => sum + t.amount, 0)
})

function loadAccount() {
  const id = route.params.id as string
  prepaidStore.setCurrentAccount(id)
  account.value = prepaidStore.currentAccount
}

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

function getTransactionTypeBadgeClass(type: string): string {
  const map: Record<string, string> = {
    recharge: 'badge bg-green-100 text-green-800',
    consume: 'badge bg-red-100 text-red-800',
    refund: 'badge bg-blue-100 text-blue-800',
    adjust: 'badge bg-purple-100 text-purple-800',
    freeze: 'badge bg-yellow-100 text-yellow-800',
    unfreeze: 'badge bg-cyan-100 text-cyan-800'
  }
  return map[type] || 'badge bg-gray-100 text-gray-800'
}

function countByType(type: string): number {
  if (!account.value) return 0
  return account.value.transactions.filter(t => t.type === type).length
}

function handleRecharge() {
  if (!account.value || rechargeAmount.value <= 0) {
    notificationStore.showToastMessage('error', '请输入有效的充值金额')
    return
  }

  const success = prepaidStore.recharge(
    account.value.id,
    rechargeAmount.value,
    rechargeRemark.value
  )

  if (success) {
    notificationStore.showToastMessage('success', '充值成功')
    showRechargeModal.value = false
    rechargeAmount.value = 0
    rechargeRemark.value = ''
    loadAccount()
  } else {
    notificationStore.showToastMessage('error', '充值失败')
  }
}

function handleAdjust() {
  if (!account.value) return
  
  if (!adjustRemark.value.trim()) {
    notificationStore.showToastMessage('error', '请填写调整原因')
    return
  }

  const success = prepaidStore.adjust(
    account.value.id,
    adjustAmount.value,
    adjustRemark.value
  )

  if (success) {
    notificationStore.showToastMessage('success', '余额调整成功')
    showAdjustModal.value = false
    adjustAmount.value = 0
    adjustRemark.value = ''
    loadAccount()
  } else {
    notificationStore.showToastMessage('error', '调整失败')
  }
}

onMounted(() => {
  loadAccount()
})

onUnmounted(() => {
  prepaidStore.clearCurrentAccount()
})
</script>
