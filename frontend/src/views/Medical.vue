<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <el-tabs v-model="activeTab" class="flex-1">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="待处理" name="pending" />
        <el-tab-pane label="已处理" name="handled" />
      </el-tabs>
      <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
        上报医疗事件
      </el-button>
    </div>

    <el-card shadow="hover">
      <el-table :data="filteredReports" stripe>
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
        <el-table-column prop="symptom" label="症状" width="120" />
        <el-table-column prop="description" label="详情" show-overflow-tooltip />
        <el-table-column prop="reportType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.reportType === 'emergency' ? 'danger' : 'warning'" size="small">
              {{ getReportTypeText(row.reportType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reportedBy" label="上报人" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'handled' ? 'success' : 'warning'" size="small">
              {{ row.status === 'handled' ? '已处理' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="上报时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 'pending'"
              link
              type="success"
              @click="showHandleDialog(row)"
            >
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="上报医疗事件" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="营员">
          <el-select v-model="createForm.camperId" placeholder="选择营员" style="width: 100%">
            <el-option
              v-for="camper in campers"
              :key="camper.id"
              :label="camper.name"
              :value="camper.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="症状">
          <el-input v-model="createForm.symptom" />
        </el-form-item>
        <el-form-item label="事件类型">
          <el-select v-model="createForm.reportType" placeholder="选择类型" style="width: 100%">
            <el-option label="过敏反应" value="allergy" />
            <el-option label="慢性病发作" value="chronic" />
            <el-option label="外伤" value="injury" />
            <el-option label="紧急情况" value="emergency" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input v-model="createForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="上报人">
          <el-input v-model="createForm.reportedBy" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReport">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showHandle" title="处理医疗事件" width="600px">
      <div class="space-y-4 mb-4">
        <div class="p-4 bg-gray-50 rounded-lg">
          <p><strong>营员：</strong>{{ selectedReport?.camper?.name }}</p>
          <p><strong>症状：</strong>{{ selectedReport?.symptom }}</p>
          <p><strong>描述：</strong>{{ selectedReport?.description }}</p>
        </div>
      </div>
      <el-form label-width="100px">
        <el-form-item label="处理说明">
          <el-input v-model="handlingNote" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="家长通知">
          <el-switch v-model="parentNotified" active-text="已通知" inactive-text="未通知" />
        </el-form-item>
        <el-form-item v-if="parentNotified" label="通知内容">
          <el-input v-model="parentNotification" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="处理人">
          <el-input v-model="operator" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showHandle = false">取消</el-button>
        <el-button type="primary" @click="confirmHandle">确认处理</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="医疗事件详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="营员">
          {{ detailReport?.camper?.name }}
        </el-descriptions-item>
        <el-descriptions-item label="症状">
          {{ detailReport?.symptom }}
        </el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="detailReport?.reportType === 'emergency' ? 'danger' : 'warning'" size="small">
            {{ getReportTypeText(detailReport?.reportType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailReport?.status === 'handled' ? 'success' : 'warning'" size="small">
            {{ detailReport?.status === 'handled' ? '已处理' : '待处理' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="详细描述" :span="2">
          {{ detailReport?.description }}
        </el-descriptions-item>
        <el-descriptions-item v-if="detailReport?.handledBy" label="处理人">
          {{ detailReport?.handledBy }}
        </el-descriptions-item>
        <el-descriptions-item v-if="detailReport?.handledBy" label="家长通知">
          <el-tag :type="detailReport?.parentNotified ? 'success' : 'info'" size="small">
            {{ detailReport?.parentNotified ? '已通知' : '未通知' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="detailReport?.handlingNote" label="处理说明" :span="2">
          {{ detailReport?.handlingNote }}
        </el-descriptions-item>
        <el-descriptions-item v-if="detailReport?.parentNotification" label="通知内容" :span="2">
          {{ detailReport?.parentNotification }}
        </el-descriptions-item>
        <el-descriptions-item label="上报时间" :span="2">
          {{ formatTime(detailReport?.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { medicalApi, camperApi } from '@/api'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const reports = ref<any[]>([])
const campers = ref<any[]>([])
const activeTab = ref('all')
const showCreateDialog = ref(false)
const showHandle = ref(false)
const showDetail = ref(false)
const selectedReport = ref<any>(null)
const detailReport = ref<any>(null)
const operator = ref('')
const handlingNote = ref('')
const parentNotified = ref(false)
const parentNotification = ref('')

const createForm = ref<any>({
  camperId: '',
  symptom: '',
  reportType: '',
  description: '',
  reportedBy: '',
})

const filteredReports = computed(() => {
  if (activeTab.value === 'all') return reports.value
  return reports.value.filter((r) => r.status === activeTab.value)
})

const getReportTypeText = (type: string) => {
  const texts: Record<string, string> = {
    allergy: '过敏反应',
    chronic: '慢性病',
    injury: '外伤',
    emergency: '紧急',
    other: '其他',
  }
  return texts[type] || type
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const loadData = async () => {
  try {
    reports.value = await medicalApi.getList()
    campers.value = await camperApi.getList()
  } catch (e) {
    console.error('Failed to load data', e)
  }
}

const viewDetail = async (row: any) => {
  detailReport.value = await medicalApi.getDetail(row.id)
  showDetail.value = true
}

const showHandleDialog = (row: any) => {
  selectedReport.value = row
  handlingNote.value = ''
  parentNotified.value = false
  parentNotification.value = ''
  showHandle.value = true
}

const submitReport = async () => {
  try {
    await medicalApi.create(createForm.value)
    ElMessage.success('上报成功')
    showCreateDialog.value = false
    loadData()
  } catch (e) {
    ElMessage.error('上报失败')
  }
}

const confirmHandle = async () => {
  try {
    await medicalApi.handle(selectedReport.value.id, {
      handledBy: operator.value,
      handlingNote: handlingNote.value,
      parentNotified: parentNotified.value,
      parentNotification: parentNotification.value,
    })
    ElMessage.success('处理成功')
    showHandle.value = false
    loadData()
  } catch (e) {
    ElMessage.error('处理失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
