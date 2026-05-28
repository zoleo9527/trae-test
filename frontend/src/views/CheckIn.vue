<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          style="width: 200px"
          value-format="YYYY-MM-DD"
        />
        <el-input
          v-model="searchKeyword"
          placeholder="搜索营员姓名"
          style="width: 200px"
          :prefix-icon="Search"
          clearable
        />
      </div>
      <el-button type="primary" :icon="Plus" @click="showBatchCreate = true">
        批量创建签到
      </el-button>
    </div>

    <el-card shadow="hover">
      <div class="mb-4 flex items-center gap-4">
        <el-statistic title="总人数" :value="checkInList.length" />
        <el-statistic title="已签到" :value="checkedInCount" />
        <el-statistic title="未签到" :value="checkInList.length - checkedInCount" />
        <el-progress
          :percentage="checkInRate"
          style="flex: 1; margin-left: 20px"
          :color="checkInRate >= 90 ? '#67c23a' : checkInRate >= 70 ? '#e6a23c' : '#f56c6c'"
        />
      </div>
      <el-table :data="filteredList" stripe>
        <el-table-column label="营员" width="150">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                :class="row.camper?.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'"
              >
                {{ row.camper?.name?.charAt(0) }}
              </div>
              <span>{{ row.camper?.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="activity" label="活动名称" width="150" />
        <el-table-column prop="activityDate" label="活动日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.activityDate) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.checkedIn ? 'success' : 'warning'" size="small">
              {{ row.checkedIn ? '已签到' : '未签到' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="checkedInAt" label="签到时间" width="160">
          <template #default="{ row }">
            {{ row.checkedInAt ? formatTime(row.checkedInAt) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="checkedInBy" label="签到人" width="100" />
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.checkedIn"
              link
              type="primary"
              @click="showCheckInDialog(row)"
            >
              签到
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showBatchCreate" title="批量创建签到" width="600px">
      <el-form :model="batchForm" label-width="100px">
        <el-form-item label="活动名称">
          <el-input v-model="batchForm.activity" />
        </el-form-item>
        <el-form-item label="活动日期">
          <el-date-picker
            v-model="batchForm.activityDate"
            type="date"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="选择营员">
          <el-select
            v-model="batchForm.camperIds"
            multiple
            placeholder="选择营员"
            style="width: 100%"
          >
            <el-option
              v-for="camper in campers"
              :key="camper.id"
              :label="camper.name"
              :value="camper.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchCreate = false">取消</el-button>
        <el-button type="primary" @click="batchCreate">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCheckIn" title="签到确认" width="500px">
      <el-form label-width="100px">
        <el-form-item label="营员">
          <el-input :value="selectedRow?.camper?.name" disabled />
        </el-form-item>
        <el-form-item label="活动">
          <el-input :value="selectedRow?.activity" disabled />
        </el-form-item>
        <el-form-item label="签到人">
          <el-input v-model="operator" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="checkInRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCheckIn = false">取消</el-button>
        <el-button type="primary" @click="confirmCheckIn">确认签到</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { checkInApi, camperApi } from '@/api'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const checkInList = ref<any[]>([])
const campers = ref<any[]>([])
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const searchKeyword = ref('')
const showBatchCreate = ref(false)
const showCheckIn = ref(false)
const selectedRow = ref<any>(null)
const operator = ref('')
const checkInRemark = ref('')
const batchForm = ref<any>({
  activity: '',
  activityDate: dayjs().format('YYYY-MM-DD'),
  camperIds: [],
})

const checkedInCount = computed(() => {
  return checkInList.value.filter((item) => item.checkedIn).length
})

const checkInRate = computed(() => {
  if (checkInList.value.length === 0) return 0
  return Math.round((checkedInCount.value / checkInList.value.length) * 100)
})

const filteredList = computed(() => {
  if (!searchKeyword.value) return checkInList.value
  return checkInList.value.filter((item) =>
    item.camper?.name?.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const loadData = async () => {
  try {
    checkInList.value = await checkInApi.getList(selectedDate.value)
    campers.value = await camperApi.getList()
  } catch (e) {
    console.error('Failed to load data', e)
  }
}

const showCheckInDialog = (row: any) => {
  selectedRow.value = row
  checkInRemark.value = ''
  showCheckIn.value = true
}

const confirmCheckIn = async () => {
  try {
    await checkInApi.checkIn(selectedRow.value.id, {
      checkedInBy: operator.value,
      remark: checkInRemark.value,
    })
    ElMessage.success('签到成功')
    showCheckIn.value = false
    loadData()
  } catch (e) {
    ElMessage.error('签到失败')
  }
}

const batchCreate = async () => {
  try {
    await checkInApi.batchCreate(batchForm.value)
    ElMessage.success('创建成功')
    showBatchCreate.value = false
    loadData()
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
