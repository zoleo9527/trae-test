<template>
  <div class="ws-container">
    <section class="ws-stats">
      <div class="ws-stat-card">
        <div class="label">订单总数</div>
        <div class="value">{{ stats.order_total }}</div>
      </div>
      <div class="ws-stat-card pending">
        <div class="label">待复核</div>
        <div class="value">{{ stats.review_pending }}</div>
      </div>
      <div class="ws-stat-card rejected">
        <div class="label">已驳回</div>
        <div class="value">{{ stats.review_rejected }}</div>
      </div>
      <div class="ws-stat-card recheck">
        <div class="label">需回查</div>
        <div class="value">{{ stats.review_recheck }}</div>
      </div>
      <div class="ws-stat-card unpaid">
        <div class="label">未结清尾款</div>
        <div class="value">{{ stats.balance_unpaid }}</div>
      </div>
    </section>

    <section class="ws-section">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h2>待处理 / 需关注订单</h2>
        <el-button type="primary" @click="refreshAll">刷新</el-button>
      </div>

      <div class="ws-toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索订单号 / 客户姓名"
          style="width:240px"
          clearable
          @input="loadList"
        />
        <el-select v-model="status" placeholder="状态" clearable style="width:140px" @change="loadList">
          <el-option label="已拍摄" value="已拍摄" />
          <el-option label="选片中" value="选片中" />
          <el-option label="修片中" value="修片中" />
          <el-option label="复核中" value="复核中" />
          <el-option label="已完成" value="已完成" />
          <el-option label="已归档" value="已归档" />
        </el-select>
        <el-select v-model="studio" placeholder="门店" clearable style="width:140px" @change="loadList">
          <el-option label="外滩旗舰" value="外滩旗舰" />
          <el-option label="静安会所" value="静安会所" />
        </el-select>
        <el-tag v-if="selectedFocus" :type="focusTagType" effect="light">
          过滤：{{ focusLabel }}
        </el-tag>
      </div>

      <el-table :data="filteredOrders" stripe style="width:100%" row-class-name="ws-order-row">
        <el-table-column prop="order_no" label="订单号" width="140" />
        <el-table-column label="客户">
          <template #default="{ row }">
            <div class="ws-order-main">{{ row.customer_name }} &amp; {{ row.partner_name }}</div>
            <div class="ws-order-sub">{{ row.studio_branch }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="shoot_date" label="拍摄日" width="140">
          <template #default="{ row }">{{ row.shoot_date ? row.shoot_date.slice(0,10) : '-' }}</template>
        </el-table-column>
        <el-table-column label="复核状态">
          <template #default="{ row }">
            <span class="ws-badge" :class="row.latest_batch_status">{{ row.latest_batch_status || '无批次' }}</span>
            <div class="ws-order-sub" style="margin-top:4px">
              待 {{ row.review_pending }} · 驳 {{ row.review_rejected }} · 查 {{ row.review_recheck }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="balance_status" label="尾款" width="90">
          <template #default="{ row }">
            <el-tag :type="row.balance_status === '已结清' ? 'success' : 'warning'" size="small">
              {{ row.balance_status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="负责" width="170">
          <template #default="{ row }">
            <div class="ws-order-sub">店长 {{ row.store_manager }}</div>
            <div class="ws-order-sub">选片 {{ row.selector }}</div>
            <div class="ws-order-sub">修片 {{ row.retoucher }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="goDetail(row)">详情</el-button>
            <el-button size="small" type="primary" @click="goContinuous(row)">连续回查</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface DashboardStats {
  order_total: number
  review_pending: number
  review_rejected: number
  review_recheck: number
  balance_unpaid: number
  updated_at: string
}

interface OrderListItem {
  id: number
  order_no: string
  customer_name: string
  partner_name: string
  studio_branch: string
  shoot_date: string
  status: string
  balance_status: string
  store_manager: string
  selector: string
  retoucher: string
  customer_service: string
  latest_batch_status: string
  review_pending: number
  review_rejected: number
  review_recheck: number
  updated_at: string
}

const api = useWsApi()

const stats = ref<DashboardStats>({
  order_total: 0,
  review_pending: 0,
  review_rejected: 0,
  review_recheck: 0,
  balance_unpaid: 0,
  updated_at: ''
})

const orders = ref<OrderListItem[]>([])
const keyword = ref('')
const status = ref('')
const studio = ref('')
const selectedFocus = ref<string>('')  // 'rejected' | 'recheck' | 'pending' | ''

const focusLabel = computed(() => {
  if (selectedFocus.value === 'rejected') return '已驳回'
  if (selectedFocus.value === 'recheck') return '需回查'
  if (selectedFocus.value === 'pending') return '待复核'
  return ''
})
const focusTagType = computed(() => {
  if (selectedFocus.value === 'rejected') return 'danger'
  if (selectedFocus.value === 'recheck') return 'warning'
  if (selectedFocus.value === 'pending') return ''
  return ''
})

const filteredOrders = computed(() => {
  let list = orders.value
  if (selectedFocus.value === 'rejected') list = list.filter(o => o.review_rejected > 0)
  else if (selectedFocus.value === 'recheck') list = list.filter(o => o.review_recheck > 0)
  else if (selectedFocus.value === 'pending') list = list.filter(o => o.review_pending > 0)
  return list
})

const loadStats = async () => {
  try {
    stats.value = await api.get<DashboardStats>('/dashboard')
  } catch (e) { /* api layer already shows error */ }
}

const loadList = async () => {
  try {
    const params = new URLSearchParams()
    if (status.value) params.set('status', status.value)
    if (studio.value) params.set('studio', studio.value)
    if (keyword.value) params.set('keyword', keyword.value)
    const qs = params.toString()
    orders.value = await api.get<OrderListItem[]>(`/orders${qs ? '?' + qs : ''}`)
  } catch (e) { /* ignore */ }
}

const refreshAll = () => {
  loadStats()
  loadList()
}

const goDetail = (row: OrderListItem) => navigateTo(`/orders/${row.id}`)
const goContinuous = (row: OrderListItem) => navigateTo(`/orders/${row.id}/continuous`)

onMounted(refreshAll)
</script>
