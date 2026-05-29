<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon orders">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total_orders || 0 }}</div>
              <div class="stat-label">总订单数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pending_orders || 0 }}</div>
              <div class="stat-label">待处理订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover" @click="goToOverdueOrders">
          <div class="stat-content">
            <div class="stat-icon overdue">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value overdue-value">{{ stats.overdue_orders || 0 }}</div>
              <div class="stat-label">逾期订单</div>
            </div>
          </div>
          <div class="drill-hint" v-if="stats.overdue_orders > 0">点击查看详情 →</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon receivable">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatMoney(stats.total_receivable) }}</div>
              <div class="stat-label">应收账款</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="6">
        <el-card class="stat-card small" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon today">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value small-value">¥{{ formatMoney(stats.today_collections) }}</div>
              <div class="stat-label">今日回款</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card small" shadow="hover" @click="goToReminders">
          <div class="stat-content">
            <div class="stat-icon reminders">
              <el-icon><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value small-value reminder-value">{{ stats.pending_reminders || 0 }}</div>
              <div class="stat-label">待办催办</div>
            </div>
          </div>
          <div class="drill-hint" v-if="stats.pending_reminders > 0">点击处理 →</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>订单趋势</span>
              <el-radio-group v-model="trendDays" size="small" @change="loadOrderTrend">
                <el-radio-button :label="7">近7天</el-radio-button>
                <el-radio-button :label="30">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <Line :data="chartData" :options="chartOptions" height="280" />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>
            <span>逾期客户排名</span>
          </template>
          <el-table :data="overdueCustomers" size="small" @row-click="goToCustomerOrders">
            <el-table-column prop="customer_name" label="客户名称" />
            <el-table-column prop="order_count" label="逾期单数" width="80" align="center" />
            <el-table-column prop="unpaid_amount" label="逾期金额" width="120" align="right">
              <template #default="{ row }">
                <span class="overdue-amount">¥{{ formatMoney(row.unpaid_amount) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>销售业绩统计</span>
          </template>
          <el-table :data="salesPerformance" size="small">
            <el-table-column type="index" label="排名" width="60" align="center" />
            <el-table-column prop="sales_name" label="销售员" />
            <el-table-column prop="order_count" label="订单数" width="100" align="center" />
            <el-table-column prop="total_amount" label="销售总额" width="150" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.total_amount) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-link type="primary" @click="goToSalesOrders(row.sales_id)">查看订单</el-link>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { getDashboardStats, getOrderTrend, getOverdueByCustomer, getSalesPerformance } from '../api/endpoints'
import { Document, Clock, Warning, Money, Calendar, Bell } from '@element-plus/icons-vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const router = useRouter()

const stats = ref({})
const trendDays = ref(7)
const orderTrend = ref([])
const overdueCustomers = ref([])
const salesPerformance = ref([])

const chartData = ref({
  labels: [],
  datasets: [{
    label: '订单数',
    data: [],
    borderColor: '#409EFF',
    backgroundColor: 'rgba(64, 158, 255, 0.1)',
    fill: true,
    tension: 0.4
  }]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { beginAtZero: true }
  }
}

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const loadStats = async () => {
  stats.value = await getDashboardStats()
}

const loadOrderTrend = async () => {
  orderTrend.value = await getOrderTrend(trendDays.value)
  chartData.value.labels = orderTrend.value.map(item => item.date.slice(5))
  chartData.value.datasets[0].data = orderTrend.value.map(item => item.count)
}

const loadOverdueCustomers = async () => {
  overdueCustomers.value = (await getOverdueByCustomer()).sort((a, b) => b.unpaid_amount - a.unpaid_amount).slice(0, 8)
}

const loadSalesPerformance = async () => {
  salesPerformance.value = (await getSalesPerformance()).sort((a, b) => b.total_amount - a.total_amount)
}

const goToOverdueOrders = () => {
  router.push('/orders?is_overdue=true')
}

const goToReminders = () => {
  router.push('/reminders?status=PENDING')
}

const goToCustomerOrders = (row) => {
  router.push(`/orders?customer_id=${row.customer_id}`)
}

const goToSalesOrders = (salesId) => {
  router.push(`/orders?sales_id=${salesId}`)
}

onMounted(() => {
  loadStats()
  loadOrderTrend()
  loadOverdueCustomers()
  loadSalesPerformance()
})
</script>

<style scoped>
.dashboard {
  padding-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.small {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  margin-right: 16px;
}

.stat-icon.orders { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-icon.pending { background: linear-gradient(135deg, #f093fb, #f5576c); }
.stat-icon.overdue { background: linear-gradient(135deg, #ff6b6b, #ee5a24); }
.stat-icon.receivable { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.stat-icon.today { background: linear-gradient(135deg, #43e97b, #38f9d7); }
.stat-icon.reminders { background: linear-gradient(135deg, #fa709a, #fee140); }

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.stat-value.small-value {
  font-size: 22px;
}

.stat-value.overdue-value {
  color: #f56c6c;
}

.stat-value.reminder-value {
  color: #e6a23c;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.drill-hint {
  font-size: 12px;
  color: #409EFF;
  text-align: right;
  margin-top: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overdue-amount {
  color: #f56c6c;
  font-weight: 500;
}
</style>
