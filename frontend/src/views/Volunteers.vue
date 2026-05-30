<template>
  <div class="volunteers-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon active">
              <el-icon :size="24"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ activeCount }}</div>
              <div class="stat-label">活跃志愿者</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon :size="24"><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ volunteers.length }}</div>
              <div class="stat-label">总人数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon hours">
              <el-icon :size="24"><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalHours }}</div>
              <div class="stat-label">累计服务时长</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon schedule">
              <el-icon :size="24"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalSchedules }}</div>
              <div class="stat-label">本月排班次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <span>志愿者库</span>
          <div>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索志愿者姓名"
              style="width: 200px; margin-right: 12px"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增志愿者
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredVolunteers" border stripe style="width: 100%">
        <el-table-column label="姓名" width="100">
          <template #default="{ row }">
            <div class="volunteer-name">
              <el-avatar :size="32" :style="{ backgroundColor: getAvatarColor(row.id) }">
                {{ row.name.charAt(0) }}
              </el-avatar>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="140" />
        <el-table-column label="技能标签" width="200">
          <template #default="{ row }">
            <el-tag
              v-for="(skill, index) in row.skills"
              :key="index"
              size="small"
              style="margin-right: 4px; margin-bottom: 4px"
            >
              {{ skill }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalHours" label="累计时长" width="120">
          <template #default="{ row }">
            <span class="hours-text">{{ row.totalHours }} 小时</span>
          </template>
        </el-table-column>
        <el-table-column prop="joinDate" label="加入时间" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '活跃' : '暂停' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="本月排班" width="100">
          <template #default="{ row }">
            <el-tag type="primary" size="small">
              {{ getVolunteerScheduleCount(row.id) }} 次
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">详情</el-button>
            <el-button type="success" link size="small" @click="handleSchedule(row)">排班</el-button>
            <el-button type="warning" link size="small" @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" :title="currentVolunteer?.name" width="600px">
      <div v-if="currentVolunteer" class="volunteer-detail">
        <div class="detail-header">
          <el-avatar :size="64" :style="{ backgroundColor: getAvatarColor(currentVolunteer.id) }">
            {{ currentVolunteer.name.charAt(0) }}
          </el-avatar>
          <div class="detail-info">
            <h3>{{ currentVolunteer.name }}</h3>
            <el-tag :type="currentVolunteer.status === 'active' ? 'success' : 'info'">
              {{ currentVolunteer.status === 'active' ? '活跃' : '暂停' }}
            </el-tag>
          </div>
        </div>

        <el-descriptions :column="2" border style="margin-top: 20px">
          <el-descriptions-item label="联系电话">{{ currentVolunteer.phone }}</el-descriptions-item>
          <el-descriptions-item label="加入时间">{{ currentVolunteer.joinDate }}</el-descriptions-item>
          <el-descriptions-item label="累计服务时长" :span="2">
            <span class="highlight">{{ currentVolunteer.totalHours }} 小时</span>
          </el-descriptions-item>
          <el-descriptions-item label="技能标签" :span="2">
            <el-tag
              v-for="(skill, index) in currentVolunteer.skills"
              :key="index"
              style="margin-right: 8px"
            >
              {{ skill }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="schedule-section">
          <h4>近期排班记录</h4>
          <el-table :data="getVolunteerSchedules(currentVolunteer.id)" border stripe size="small">
            <el-table-column prop="date" label="日期" width="120" />
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
          </el-table>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="scheduleDialogVisible" title="为志愿者排班" width="500px">
      <el-form :model="scheduleForm" label-width="100px">
        <el-form-item label="志愿者">
          <el-input :value="currentVolunteer?.name" disabled />
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
      </el-form>
      <template #footer>
        <el-button @click="scheduleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSchedule">确认排班</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { mockVolunteers, scheduleStatusMap } from '@/mock/data'
import { useScheduleStore } from '@/stores/schedule'
import { useUserStore } from '@/stores/user'

const scheduleStore = useScheduleStore()
const userStore = useUserStore()

const volunteers = ref([...mockVolunteers])
const searchKeyword = ref('')

const detailVisible = ref(false)
const scheduleDialogVisible = ref(false)
const currentVolunteer = ref(null)

const scheduleForm = ref({
  date: '',
  startTime: '',
  endTime: '',
  type: '',
  location: ''
})

const activeCount = computed(() => {
  return volunteers.value.filter(v => v.status === 'active').length
})

const totalHours = computed(() => {
  return volunteers.value.reduce((sum, v) => sum + v.totalHours, 0)
})

const totalSchedules = computed(() => {
  const thisMonth = dayjs().format('YYYY-MM')
  return scheduleStore.schedules.filter(s => s.date.startsWith(thisMonth)).length
})

const filteredVolunteers = computed(() => {
  if (!searchKeyword.value) return volunteers.value
  return volunteers.value.filter(v => 
    v.name.includes(searchKeyword.value)
  )
})

function getAvatarColor(id) {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9b59b6']
  return colors[id % colors.length]
}

function getVolunteerScheduleCount(volunteerId) {
  const thisMonth = dayjs().format('YYYY-MM')
  return scheduleStore.schedules.filter(s => 
    s.volunteerId === volunteerId && s.date.startsWith(thisMonth)
  ).length
}

function getVolunteerSchedules(volunteerId) {
  return scheduleStore.getSchedulesByVolunteer(volunteerId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
}

function handleViewDetail(row) {
  currentVolunteer.value = row
  detailVisible.value = true
}

function handleSchedule(row) {
  currentVolunteer.value = row
  scheduleForm.value = {
    date: '',
    startTime: '',
    endTime: '',
    type: '',
    location: ''
  }
  scheduleDialogVisible.value = true
}

function confirmSchedule() {
  if (!scheduleForm.value.date || !scheduleForm.value.startTime || 
      !scheduleForm.value.endTime || !scheduleForm.value.type) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  scheduleStore.addSchedule({
    ...scheduleForm.value,
    volunteerId: currentVolunteer.value.id,
    volunteerName: currentVolunteer.value.name,
    createdBy: userStore.currentUser?.name
  })
  
  ElMessage.success('排班成功')
  scheduleDialogVisible.value = false
}

function handleEdit(row) {
  ElMessage.info('编辑功能演示中')
}

function handleAdd() {
  ElMessage.info('新增功能演示中')
}
</script>

<style scoped>
.volunteers-page {
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
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.active {
  background: linear-gradient(135deg, #67C23A 0%, #52c41a 100%);
}

.stat-icon.total {
  background: linear-gradient(135deg, #409EFF 0%, #1890ff 100%);
}

.stat-icon.hours {
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
}

.stat-icon.schedule {
  background: linear-gradient(135deg, #E6A23C 0%, #fa8c16 100%);
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

.volunteer-name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hours-text {
  color: #409EFF;
  font-weight: 500;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.detail-info h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: #303133;
}

.highlight {
  color: #409EFF;
  font-weight: 600;
  font-size: 16px;
}

.schedule-section {
  margin-top: 20px;
}

.schedule-section h4 {
  margin-bottom: 12px;
  color: #303133;
}
</style>
