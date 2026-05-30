<template>
  <div class="schedule-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="志愿者">
          <el-select v-model="filterForm.volunteerId" placeholder="选择志愿者" clearable>
            <el-option
              v-for="v in volunteers"
              :key="v.id"
              :label="v.name"
              :value="v.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" clearable>
            <el-option
              v-for="(item, key) in scheduleStatusMap"
              :key="key"
              :label="item.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="action-card">
      <template #header>
        <div class="card-header">
          <span>排班列表</span>
          <div>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增排班
            </el-button>
          </div>
        </div>
      </template>

      <el-alert
        v-if="overdueSchedules.length > 0"
        :title="'有 ' + overdueSchedules.length + ' 个排班已逾期未签到'"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      >
        <template #default>
          <span>请及时处理缺勤记录，避免影响后续排班安排</span>
        </template>
      </el-alert>

      <el-table :data="filteredSchedules" border stripe style="width: 100%">
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
        <el-table-column prop="createdBy" label="排班人" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            <el-button type="info" link size="small" @click="handleViewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="scheduleForm" label-width="100px">
        <el-form-item label="志愿者" required>
          <el-select v-model="scheduleForm.volunteerId" placeholder="选择志愿者" style="width: 100%">
            <el-option
              v-for="v in volunteers"
              :key="v.id"
              :label="v.name"
              :value="v.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" required>
          <el-date-picker
            v-model="scheduleForm.date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-time-picker
            v-model="scheduleForm.startTime"
            placeholder="选择开始时间"
            format="HH:mm"
            value-format="HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" required>
          <el-time-picker
            v-model="scheduleForm.endTime"
            placeholder="选择结束时间"
            format="HH:mm"
            value-format="HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="班次类型" required>
          <el-select v-model="scheduleForm.type" placeholder="选择班次类型" style="width: 100%">
            <el-option label="借阅引导" value="借阅引导" />
            <el-option label="图书整理" value="图书整理" />
            <el-option label="活动协助" value="活动协助" />
            <el-option label="儿童阅读" value="儿童阅读" />
            <el-option label="设备操作" value="设备操作" />
            <el-option label="读者咨询" value="读者咨询" />
            <el-option label="巡馆检查" value="巡馆检查" />
          </el-select>
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="scheduleForm.location" placeholder="请输入地点" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="scheduleForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="排班详情" width="600px">
      <el-descriptions :column="2" border v-if="currentSchedule">
        <el-descriptions-item label="日期">{{ currentSchedule.date }}</el-descriptions-item>
        <el-descriptions-item label="志愿者">{{ currentSchedule.volunteerName }}</el-descriptions-item>
        <el-descriptions-item label="班次类型">{{ currentSchedule.type }}</el-descriptions-item>
        <el-descriptions-item label="地点">{{ currentSchedule.location }}</el-descriptions-item>
        <el-descriptions-item label="时间">
          {{ currentSchedule.startTime }} - {{ currentSchedule.endTime }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="scheduleStatusMap[currentSchedule.status]?.type" size="small">
            {{ scheduleStatusMap[currentSchedule.status]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="签到时间" :span="2">
          {{ currentSchedule.checkInTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="签退时间" :span="2">
          {{ currentSchedule.checkOutTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="排班人">{{ currentSchedule.createdBy }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentSchedule.createdAt }}</el-descriptions-item>
        <el-descriptions-item v-if="currentSchedule.missedRemark" label="缺勤原因" :span="2">
          <el-tag type="danger">{{ currentSchedule.missedRemark }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="历史备注" :span="2">
          <div v-if="currentSchedule.remarks && currentSchedule.remarks.length > 0">
            <div v-for="(remark, index) in currentSchedule.remarks" :key="index" class="remark-item">
              <el-icon size="12" color="#409EFF"><ChatDotRound /></el-icon>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { useScheduleStore } from '@/stores/schedule'
import { useUserStore } from '@/stores/user'
import { mockVolunteers, scheduleStatusMap } from '@/mock/data'

const scheduleStore = useScheduleStore()
const userStore = useUserStore()

const volunteers = ref(mockVolunteers.filter(v => v.status === 'active'))

const filterForm = ref({
  dateRange: [],
  volunteerId: null,
  status: ''
})

const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const currentSchedule = ref(null)

const scheduleForm = ref({
  volunteerId: null,
  volunteerName: '',
  date: '',
  startTime: '',
  endTime: '',
  type: '',
  location: '',
  remark: ''
})

const dialogTitle = computed(() => isEdit.value ? '编辑排班' : '新增排班')

const overdueSchedules = computed(() => scheduleStore.overdueSchedules)

const filteredSchedules = computed(() => {
  let result = [...scheduleStore.schedules]
  
  if (filterForm.value.dateRange && filterForm.value.dateRange.length === 2) {
    const [start, end] = filterForm.value.dateRange
    result = result.filter(s => s.date >= start && s.date <= end)
  }
  
  if (filterForm.value.volunteerId) {
    result = result.filter(s => s.volunteerId === filterForm.value.volunteerId)
  }
  
  if (filterForm.value.status) {
    result = result.filter(s => s.status === filterForm.value.status)
  }
  
  return result.sort((a, b) => b.date.localeCompare(a.date))
})

function handleSearch() {
  ElMessage.success('搜索完成')
}

function handleReset() {
  filterForm.value = {
    dateRange: [],
    volunteerId: null,
    status: ''
  }
}

function handleAdd() {
  isEdit.value = false
  scheduleForm.value = {
    volunteerId: null,
    volunteerName: '',
    date: '',
    startTime: '',
    endTime: '',
    type: '',
    location: '',
    remark: ''
  }
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  currentSchedule.value = row
  scheduleForm.value = {
    ...row,
    remark: ''
  }
  dialogVisible.value = true
}

function handleDelete(row) {
  ElMessageBox.confirm('确定要删除这个排班吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    scheduleStore.deleteSchedule(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function handleViewDetail(row) {
  currentSchedule.value = row
  detailVisible.value = true
}

function handleSave() {
  const volunteer = volunteers.value.find(v => v.id === scheduleForm.value.volunteerId)
  if (!volunteer) {
    ElMessage.warning('请选择志愿者')
    return
  }
  
  const scheduleData = {
    ...scheduleForm.value,
    volunteerName: volunteer.name,
    createdBy: userStore.currentUser?.name
  }
  
  if (isEdit.value) {
    scheduleStore.updateSchedule(currentSchedule.value.id, scheduleData)
    ElMessage.success('更新成功')
  } else {
    scheduleStore.addSchedule(scheduleData)
    ElMessage.success('创建成功')
  }
  
  dialogVisible.value = false
}
</script>

<style scoped>
.schedule-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remark-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
  color: #606266;
}

.text-muted {
  color: #909399;
}
</style>
