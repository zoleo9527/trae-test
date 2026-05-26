<template>
  <div>
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon blue">
              <el-icon size="28"><Scale /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayWeighings }}</div>
              <div class="stat-label">今日过磅单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon green">
              <el-icon size="28"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ stats.todayAmount.toFixed(2) }}</div>
              <div class="stat-label">今日结算金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon orange">
              <el-icon size="28"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingSettlements }}</div>
              <div class="stat-label">待复核结算</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon red">
              <el-icon size="28"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.unresolvedExceptions }}</div>
              <div class="stat-label">未处理异常</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近过磅记录</span>
              <el-button link type="primary" @click="$router.push('/weighing')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentWeighings" size="small">
            <el-table-column prop="weighing_no" label="磅单号" width="140" />
            <el-table-column prop="plate_number" label="车牌号" width="90" />
            <el-table-column prop="material_name" label="物料" width="80" />
            <el-table-column prop="net_weight" label="净重" width="90" />
            <el-table-column prop="total_amount" label="金额" width="100">
              <template #default="{ row }">
                <span style="color: #f56c6c">¥{{ row.total_amount.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <span :class="['status-tag', 'status-' + row.status]">
                  {{ statusText[row.status] }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>待处理异常</span>
              <el-button link type="primary" @click="$router.push('/exceptions')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentExceptions" size="small">
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag :type="row.severity === 'warning' ? 'warning' : 'danger'" size="small">
                  {{ exceptionTypeText[row.type] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="created_at" label="时间" width="160" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>快捷操作</span>
      </template>
      <div style="display: flex; gap: 15px">
        <el-button 
          v-if="showWeighing" 
          type="primary" 
          size="large" 
          @click="$router.push('/weighing')"
        >
          <el-icon><Plus /></el-icon>
          新增过磅
        </el-button>
        <el-button 
          v-if="showSettlement" 
          type="success" 
          size="large" 
          @click="$router.push('/settlement')"
        >
          <el-icon><Money /></el-icon>
          批量结算
        </el-button>
        <el-button type="info" size="large" @click="$router.push('/trace')">
          <el-icon><Search /></el-icon>
          追踪溯源
        </el-button>
        <el-button type="warning" size="large" @click="$router.push('/env-records')">
          <el-icon><Document /></el-icon>
          环保台账
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import db from '@/utils/db'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const stats = ref({
  todayWeighings: 0,
  todayAmount: 0,
  pendingSettlements: 0,
  unresolvedExceptions: 0
})

const recentWeighings = ref([])
const recentExceptions = ref([])

const showWeighing = computed(() => ['owner', 'weigher'].includes(authStore.user?.role))
const showSettlement = computed(() => ['owner', 'accountant'].includes(authStore.user?.role))

const statusText = {
  pending: '待结算',
  settled: '已结算',
  cancelled: '已作废'
}

const exceptionTypeText = {
  price_deviation: '价格异常',
  deduction: '扣款记录',
  weight_anomaly: '重量异常',
  other: '其他'
}

async function loadStats() {
  const today = dayjs().format('YYYY-MM-DD')
  
  const todayResult = await db.query(
    `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount 
     FROM weighings WHERE DATE(created_at) = ?`,
    [today]
  )
  if (todayResult.success) {
    stats.value.todayWeighings = todayResult.data[0].count
    stats.value.todayAmount = todayResult.data[0].amount
  }
  
  const pendingResult = await db.query(
    `SELECT COUNT(*) as count FROM settlements WHERE status = 'pending'`
  )
  if (pendingResult.success) {
    stats.value.pendingSettlements = pendingResult.data[0].count
  }
  
  const exceptionResult = await db.query(
    `SELECT COUNT(*) as count FROM exceptions WHERE resolved = 0`
  )
  if (exceptionResult.success) {
    stats.value.unresolvedExceptions = exceptionResult.data[0].count
  }
}

async function loadRecentWeighings() {
  const result = await db.query(`
    SELECT w.*, v.plate_number, m.name as material_name
    FROM weighings w
    LEFT JOIN vehicles v ON w.vehicle_id = v.id
    LEFT JOIN materials m ON w.material_id = m.id
    ORDER BY w.created_at DESC LIMIT 10
  `)
  if (result.success) {
    recentWeighings.value = result.data
  }
}

async function loadRecentExceptions() {
  const result = await db.query(`
    SELECT * FROM exceptions WHERE resolved = 0 ORDER BY created_at DESC LIMIT 10
  `)
  if (result.success) {
    recentExceptions.value = result.data
  }
}

onMounted(() => {
  loadStats()
  loadRecentWeighings()
  loadRecentExceptions()
})
</script>

<style scoped>
.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.red {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
