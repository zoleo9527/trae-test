<template>
  <div class="transactions-page">
    <div class="page-header">
      <div class="filter-bar">
        <select v-model="filterType" class="select" style="width: 120px;">
          <option value="">全部类型</option>
          <option value="recharge">充值</option>
          <option value="consume">消费</option>
          <option value="refund">退款</option>
        </select>
        <select v-model="filterMember" class="select" style="width: 200px;">
          <option :value="null">全部会员</option>
          <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }} ({{ m.member_no }})</option>
        </select>
      </div>
      <div class="header-actions">
        <div class="total-recharge">
          <span class="label">今日充值:</span>
          <span class="value">¥{{ todayRecharge.toFixed(2) }}</span>
        </div>
        <button class="btn btn-primary" @click="showRechargeModal = true">
          + 会员充值
        </button>
      </div>
    </div>
    
    <div class="members-section card">
      <div class="card-header">
        <h3>会员概览</h3>
      </div>
      <div class="members-grid">
        <div v-for="member in members" :key="member.id" class="member-card" @click="filterMember = member.id">
          <div class="member-avatar">{{ member.name[0] }}</div>
          <div class="member-info">
            <div class="member-name">{{ member.name }}</div>
            <div class="member-no">{{ member.member_no }}</div>
          </div>
          <div class="member-balance">
            <div class="balance-label">余额</div>
            <div class="balance-value">¥{{ member.balance.toFixed(2) }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="transactions-list card">
      <div class="card-header">
        <h3>交易记录</h3>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>时间</th>
            <th>会员</th>
            <th>类型</th>
            <th>金额</th>
            <th>变动后余额</th>
            <th>操作人</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in filteredTransactions" :key="tx.id">
            <td>{{ formatDateTime(tx.created_at) }}</td>
            <td>{{ tx.member_name || '-' }}</td>
            <td>
              <span class="badge" :class="typeClass(tx.type)">
                {{ typeLabels[tx.type] }}
              </span>
            </td>
            <td :class="tx.type === 'recharge' ? 'amount-positive' : 'amount-negative'">
              {{ tx.type === 'recharge' ? '+' : '-' }}¥{{ Math.abs(tx.amount).toFixed(2) }}
            </td>
            <td>¥{{ tx.balance_after.toFixed(2) }}</td>
            <td>{{ tx.operator_name || '-' }}</td>
            <td>{{ tx.note || '-' }}</td>
          </tr>
          <tr v-if="!filteredTransactions.length">
            <td colspan="7">
              <div class="empty-state">
                <div class="empty-icon">💰</div>
                <div class="empty-text">暂无交易记录</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-if="showRechargeModal" class="modal-overlay" @click.self="showRechargeModal = false">
      <div class="modal" style="width: 440px;">
        <div class="modal-header">
          <div class="modal-title">会员充值</div>
          <button class="btn-ghost" @click="showRechargeModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="label">选择会员</label>
            <select v-model="rechargeForm.member_id" class="select">
              <option :value="null">请选择会员</option>
              <option v-for="m in members" :key="m.id" :value="m.id">
                {{ m.name }} (当前余额: ¥{{ m.balance }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">充值金额</label>
            <div class="amount-options">
              <button
                v-for="amt in [500, 1000, 2000, 5000]"
                :key="amt"
                class="amount-btn"
                :class="{ active: rechargeForm.amount === amt }"
                @click="rechargeForm.amount = amt"
              >
                ¥{{ amt }}
              </button>
            </div>
            <input
              v-model.number="rechargeForm.amount"
              type="number"
              class="input"
              style="margin-top: 10px;"
              placeholder="或输入自定义金额"
            />
          </div>
          <div class="form-group">
            <label class="label">备注</label>
            <input v-model="rechargeForm.note" type="text" class="input" placeholder="可选" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showRechargeModal = false">取消</button>
          <button class="btn btn-primary" @click="handleRecharge" :disabled="!canRecharge">
            确认充值
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dbApi from '@/db'
import { useUserStore } from '@/store/user'
import dayjs from 'dayjs'

const userStore = useUserStore()

const transactions = ref<any[]>([])
const members = ref<any[]>([])
const filterType = ref('')
const filterMember = ref<number | null>(null)
const showRechargeModal = ref(false)

const rechargeForm = ref({
  member_id: null as number | null,
  amount: 0,
  note: ''
})

const typeLabels: Record<string, string> = {
  recharge: '充值',
  consume: '消费',
  refund: '退款'
}

const filteredTransactions = computed(() => {
  return transactions.value.filter(t => {
    if (filterType.value && t.type !== filterType.value) return false
    if (filterMember.value && t.member_id !== filterMember.value) return false
    return true
  })
})

const todayRecharge = computed(() => {
  const todayStart = dayjs().startOf('day').valueOf()
  return transactions.value
    .filter(t => t.type === 'recharge' && t.created_at >= todayStart)
    .reduce((sum, t) => sum + t.amount, 0)
})

const canRecharge = computed(() => {
  return rechargeForm.value.member_id && rechargeForm.value.amount > 0
})

function typeClass(type: string): string {
  const map: Record<string, string> = {
    recharge: 'badge-success',
    consume: 'badge-warning',
    refund: 'badge-error'
  }
  return map[type] || 'badge-muted'
}

function formatDateTime(ts: number): string {
  return dayjs(ts).format('MM-DD HH:mm:ss')
}

async function handleRecharge() {
  if (!canRecharge.value || !userStore.currentUser) return
  
  await dbApi.updateMemberBalance(
    rechargeForm.value.member_id!,
    rechargeForm.value.amount,
    userStore.currentUser.id,
    rechargeForm.value.note || '前台充值'
  )
  
  showRechargeModal.value = false
  rechargeForm.value = { member_id: null, amount: 0, note: '' }
  await loadData()
}

async function loadData() {
  transactions.value = await dbApi.getTransactions()
  members.value = await dbApi.getMembers()
}

onMounted(loadData)
</script>

<style scoped>
.transactions-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.total-recharge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.total-recharge .label {
  color: #64748b;
}

.total-recharge .value {
  color: #4ade80;
  font-weight: 600;
}

.members-section {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.card-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.members-grid {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.member-card:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(59, 130, 246, 0.3);
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #e2e8f0;
  margin-bottom: 2px;
}

.member-no {
  font-size: 11px;
  color: #64748b;
}

.member-balance {
  text-align: right;
  flex-shrink: 0;
}

.balance-label {
  font-size: 10px;
  color: #64748b;
  margin-bottom: 2px;
}

.balance-value {
  font-size: 15px;
  font-weight: 600;
  color: #4ade80;
}

.transactions-list {
  padding: 0;
}

.amount-positive {
  color: #4ade80;
  font-weight: 500;
}

.amount-negative {
  color: #f87171;
  font-weight: 500;
}

.amount-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.amount-btn {
  padding: 10px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 6px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.amount-btn:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(59, 130, 246, 0.3);
  color: #e2e8f0;
}

.amount-btn.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
  color: #fff;
}

.form-group {
  margin-bottom: 16px;
}
</style>
