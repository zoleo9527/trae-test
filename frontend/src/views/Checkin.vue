<template>
  <div class="checkin-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon pending">
              <el-icon :size="28"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ visiblePendingCount }}</div>
              <div class="stat-label">{{ rolePendingLabel }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon checked">
              <el-icon :size="28"><SuccessFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ scheduleStore.statistics.checkedIn }}</div>
              <div class="stat-label">已签到</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon missed">
              <el-icon :size="28"><CloseBold /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ scheduleStore.statistics.missed }}</div>
              <div class="stat-label">缺勤</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" v-if="canViewOverdue">
          <div class="stat-content">
            <div class="stat-icon overdue">
              <el-icon :size="28"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overdueSchedules.length }}</div>
              <div class="stat-label">逾期未处理</div>
            </div>
          </div>
        </el-card>
        <el-card class="stat-card" v-else>
          <div class="stat-content">
            <div class="stat-icon completed">
              <el-icon :size="28"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ scheduleStore.statistics.completed }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="today-card" v-if="todaySchedules.length > 0">
      <template #header>
        <div class="card-header">
          <span>今日排班</span>
          <el-tag type="primary">共 {{ todaySchedules.length }} 个班次</el-tag>
        </div>
      </template>

      <el-table :data="todaySchedules" border stripe>
        <el-table-column prop="volunteerName" label="志愿者" width="100" />
        <el-table-column prop="type" label="班次类型" width="120" />
        <el-table-column label="时间" width="140">
          <template #default="{ row }">
            {{ row.startTime }} - {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地点" width="140" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="scheduleStatusMap[row.status]?.type" size="small">
              {{ scheduleStatusMap[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="签到时间" width="160">
          <template #default="{ row }">
            {{ row.checkInTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" v-if="canCheckIn">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="primary"
              size="small"
              @click="handleCheckIn(row)"
            >
              <el-icon><SuccessFilled /></el-icon>
              签到
            </el-button>
            <el-button
              v-if="row.status === 'checkedIn'"
              type="success"
              size="small"
              @click="handleCheckOut(row)"
            >
              <el-icon><SwitchButton /></el-icon>
              签退
            </el-button>
            <el-button
              v-if="row.status === 'pending' && canMarkMissed"
              type="danger"
              size="small"
              @click="handleMarkMissed(row)"
            >
              <el-icon><CloseBold /></el-icon>
              标记缺勤
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="overdue-card" v-if="canViewOverdue && overdueSchedules.length > 0">
      <template #header>
        <div class="card-header warning">
          <el-icon><WarningFilled /></el-icon>
          <span>逾期未处理排班</span>
          <el-tag type="danger">需立即处理</el-tag>
        </div>
      </template>

      <el-table :data="overdueSchedules" border stripe>
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="volunteerName" label="志愿者" width="100" />
        <el-table-column prop="type" label="班次类型" width="120" />
        <el-table-column label="时间" width="140">
          <template #default="{ row }">
            {{ row.startTime }} - {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地点" width="140" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag type="warning" size="small">已逾期</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="逾期时长" width="120">
          <template #default="{ row }">
            <el-tag type="danger" size="small">{{ getOverdueTime(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleCheckIn(row)" v-if="canCheckIn">补签到</el-button>
            <el-button type="danger" size="small" @click="handleMarkMissed(row)" v-if="canMarkMissed">标记缺勤</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="history-card">
      <template #header>
        <div class="card-header">
          <span>签到历史</span>
          <el-date-picker
            v-model="historyDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            size="small"
          />
        </div>
      </template>

      <el-table :data="historySchedules" border stripe>
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="volunteerName" label="志愿者" width="100" />
        <el-table-column prop="type" label="班次类型" width="120" />
        <el-table-column label="时间" width="140">
          <template #default="{ row }">
            {{ row.startTime }} - {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地点" width="140" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="scheduleStatusMap[row.status]?.type" size="small">
              {{ scheduleStatusMap[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="签到时间" width="160">
          <template #default="{ row }">
            {{ row.checkInTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="签退时间" width="160">
          <template #default="{ row }">
            {{ row.checkOutTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="missedDialogVisible" title="标记缺勤" width="500px">
      <el-form :model="missedForm" label-width="100px">
        <el-form-item label="志愿者">
          <el-input v-model="missedForm.volunteerName" disabled />
        </el-form-item>
        <el-form-item label="缺勤原因" required>
          <el-input
            v-model="missedForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入缺勤原因，如：临时请假、未联系上、迟到超过1小时等"
          />
        </el-form-item>
        <el-form-item label="是否需要补班">
          <el-radio-group v-model="missedForm.needMakeup">
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="补班负责人" v-if="missedForm.needMakeup">
          <el-select v-model="missedForm.makeupAssignedTo" placeholder="选择补班负责人" style="width: 100%">
            <el-option label="志愿者协调" value="coordinator" />
            <el-option label="馆长" value="director" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="missedDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMarkMissed">确认标记</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="签到详情" width="600px">
      <el-descriptions :column="2" border v-if="currentSchedule">
        <el-descriptions-item label="日期">{{ currentSchedule.date }}</el-descriptions-item>
        <el-descriptions-item label="志愿者">{{ currentSchedule.volunteerName }}</el-descriptions-item>
        <el-descriptions-item label="班次类型">{{ currentSchedule.type }}</el-descriptions-item>
        <el-descriptions-item label="地点">{{ currentSchedule.location }}</el-descriptions-item>
        <el-descriptions-item label="签到时间" :span="2">
          {{ currentSchedule.checkInTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="签退时间" :span="2">
          {{ currentSchedule.checkOutTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentSchedule.missedRemark" label="缺勤原因" :span="2">
          <el-tag type="danger">{{ currentSchedule.missedRemark }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentSchedule.needMakeup" label="补班状态" :span="2">
          <el-tag :type="currentSchedule.makeupStatus === 'pending' ? 'warning' : 'success'" size="small">
            {{ currentSchedule.makeupStatus === 'pending' ? '待安排' : '已安排' }}
          </el-tag>
          <span v-if="currentSchedule.makeupAssignedTo" style="margin-left: 8px; color: #909399">
            负责人：{{ { director: '馆长', coordinator: '志愿者协调', operator: '活动运营' }[currentSchedule.makeupAssignedTo] || currentSchedule.makeupAssignedTo }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentSchedule.missedBy" label="缺勤标记人" :span="2">
          {{ currentSchedule.missedBy }}
        </el-descriptions-item>
        <el-descriptions-item label="历史备注" :span="2">
          <div v-if="currentSchedule.remarks && currentSchedule.remarks.length > 0">
            <div v-for="(remark, index) in currentSchedule.remarks" :key="index" class="remark-item">
              <span>{{ remark }}</span>
            </div>
          </div>
          <span v-else class="text-muted">暂无备注</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { useScheduleStore } from '@/stores/schedule'
import { useUserStore } from '@/stores/user'
import { scheduleStatusMap } from '@/mock/data'

const scheduleStore = useScheduleStore()
const userStore = useUserStore()

const historyDate = ref(dayjs().subtract(1, 'day').format('YYYY-MM-DD'))
const missedDialogVisible = ref(false)
const detailVisible = ref(false)
const currentSchedule = ref(null)
const missedForm = ref({
  volunteerName: '',
  remark: '',
  needMakeup: false,
  makeupAssignedTo: 'coordinator'
})

const role = computed(() => userStore.currentRole)

const canViewOverdue = computed(() => role.value === 'director' || role.value === 'coordinator')
const canCheckIn = computed(() => role.value === 'director' || role.value === 'coordinator' || role.value === 'operator')
const canMarkMissed = computed(() => role.value === 'director' || role.value === 'coordinator')

const visiblePendingCount = computed(() => {
  if (role.value === 'operator') return scheduleStore.todaySchedules.filter(s => s.status === 'pending').length
  return scheduleStore.statistics.pending
})

const rolePendingLabel = computed(() => {
  return role.value === 'operator' ? '今日待签到' : '待签到'
})

const todaySchedules = computed(() => {
  if (role.value === 'operator') {
    return scheduleStore.todaySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }
  return scheduleStore.todaySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime))
})

const overdueSchedules = computed(() => scheduleStore.overdueSchedules)

const historySchedules = computed(() => {
  return scheduleStore.getSchedulesByDate(historyDate.value)
})

function getOverdueTime(row) {
  const endTime = dayjs(`${row.date} ${row.endTime}`)
  const hours = dayjs().diff(endTime, 'hour')
  const minutes = dayjs().diff(endTime, 'minute') % 60
  
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}天${hours % 24}小时`
  }
  return `${hours}小时${minutes}分`
}

function handleCheckIn(row) {
  scheduleStore.checkIn(row.id)
  ElMessage.success(`${row.volunteerName} 签到成功`)
}

function handleCheckOut(row) {
  scheduleStore.checkOut(row.id)
  ElMessage.success(`${row.volunteerName} 签退成功`)
}

function handleMarkMissed(row) {
  currentSchedule.value = row
  missedForm.value = {
    volunteerName: row.volunteerName,
    remark: '',
    needMakeup: false,
    makeupAssignedTo: 'coordinator'
  }
  missedDialogVisible.value = true
}

function confirmMarkMissed() {
  if (!missedForm.value.remark) {
    ElMessage.warning('请输入缺勤原因')
    return
  }
  const operatorName = userStore.currentUser?.name || '系统'
  scheduleStore.markAsMissed(
    currentSchedule.value.id,
    missedForm.value.remark,
    missedForm.value.needMakeup,
    operatorName
  )
  ElMessage.success('已标记为缺勤')
  missedDialogVisible.value = false
}

function handleViewDetail(row) {
  currentSchedule.value = row
  detailVisible.value = true
}
</script>

<style scoped>
.checkin-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.checked {
  background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
}

.stat-icon.missed {
  background: linear-gradient(135deg, #F56C6C 0%, #E6A23C 100%);
}

.stat-icon.overdue {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #67C23A 0%, #409EFF 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header.warning {
  color: #E6A23C;
  gap: 8px;
}

.remark-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.text-muted {
  color: #909399;
}
</style>
