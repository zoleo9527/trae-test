<template>
  <div class="reminders-page">
    <el-card>
      <template #header>
        <div class="page-header">
          <span>催办任务</span>
          <el-button type="primary" @click="showCreateDialog" v-if="isBoss">
            <el-icon><Plus /></el-icon>新建催办
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部" style="width: 140px" @change="loadReminders">
            <el-option label="待处理" value="PENDING" />
            <el-option label="处理中" value="IN_PROGRESS" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="filters.priority" clearable placeholder="全部" style="width: 120px" @change="loadReminders">
            <el-option label="低" value="LOW" />
            <el-option label="中" value="MEDIUM" />
            <el-option label="高" value="HIGH" />
            <el-option label="紧急" value="URGENT" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="reminders" v-loading="loading" @row-click="viewDetail">
        <el-table-column width="60" align="center">
          <template #default="{ row }">
            <el-icon :class="`priority-${row.priority.toLowerCase()}`"><Flag /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="customer_name" label="客户" width="140" />
        <el-table-column prop="unpaid_amount" label="未回款" width="120" align="right">
          <template #default="{ row }">¥{{ formatMoney(row.unpaid_amount) }}</template>
        </el-table-column>
        <el-table-column prop="assignee_name" label="责任人" width="100" />
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column prop="priority_display" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">{{ row.priority_display }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status_display" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status_display }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="截止日" width="110" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="viewDetail(row)">详情</el-button>
            <el-button link type="warning" @click.stop="handleStartReminder(row)" v-if="row.status === 'PENDING'">开始</el-button>
            <el-button link type="success" @click.stop="showCompleteDialog(row)" v-if="row.status === 'IN_PROGRESS'">完成</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="催办详情" width="600px">
      <div v-if="currentReminder">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="标题">{{ currentReminder.title }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ currentReminder.customer_name }}</el-descriptions-item>
          <el-descriptions-item label="责任人">{{ currentReminder.assignee_name }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityType(currentReminder.priority)" size="small">{{ currentReminder.priority_display }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentReminder.status)" size="small">{{ currentReminder.status_display }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="截止日">{{ currentReminder.due_date || '-' }}</el-descriptions-item>
          <el-descriptions-item label="内容" :span="2">{{ currentReminder.content }}</el-descriptions-item>
          <el-descriptions-item label="处理结果" :span="2" v-if="currentReminder.result">
            {{ currentReminder.result }}
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px;">
          <h4>跟进记录</h4>
          <div class="remark-list">
            <div v-for="remark in currentReminder.remarks" :key="remark.id" class="remark-item">
              <div class="remark-header">
                <span class="remark-author">{{ remark.author_name }}</span>
                <span class="remark-time">{{ formatDate(remark.created_at) }}</span>
              </div>
              <div class="remark-content">{{ remark.content }}</div>
            </div>
          </div>
          <div style="margin-top: 10px;">
            <el-input v-model="detailRemark" placeholder="添加跟进记录..." />
            <el-button type="primary" size="small" style="margin-top: 10px" @click="addDetailRemark" :disabled="!detailRemark">
              添加
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="completeDialogVisible" title="完成催办" width="400px">
      <el-form label-width="80px">
        <el-form-item label="处理结果">
          <el-input v-model="completeResult" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitComplete">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="createDialogVisible" title="新建催办" width="500px">
      <el-form :model="newReminder" label-width="80px">
        <el-form-item label="订单">
          <el-select v-model="newReminder.order_id" style="width: 100%" filterable>
            <el-option v-for="o in overdueOrders" :key="o.id" :label="o.order_no" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="责任人">
          <el-select v-model="newReminder.assignee_id" style="width: 100%">
            <el-option v-for="sales in salesList" :key="sales.id" :label="sales.name" :value="sales.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="newReminder.title" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="newReminder.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="newReminder.priority">
            <el-radio value="LOW">低</el-radio>
            <el-radio value="MEDIUM">中</el-radio>
            <el-radio value="HIGH">高</el-radio>
            <el-radio value="URGENT">紧急</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../store/auth'
import { getReminders, getReminder, startReminder as apiStartReminder, completeReminder as apiCompleteReminder, createReminder as apiCreateReminder, addReminderRemark as apiAddReminderRemark, getOrders, getSalesList } from '../api/endpoints'
import { Plus, Flag } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isBoss = computed(() => authStore.isBoss)

const reminders = ref([])
const loading = ref(false)
const filters = ref({
  status: route.query.status || '',
  priority: ''
})

const detailDialogVisible = ref(false)
const currentReminder = ref(null)
const detailRemark = ref('')

const completeDialogVisible = ref(false)
const completingReminder = ref(null)
const completeResult = ref('')

const createDialogVisible = ref(false)
const newReminder = ref({ order_id: null, assignee_id: null, title: '', content: '', priority: 'MEDIUM' })
const overdueOrders = ref([])
const salesList = ref([])

const formatMoney = (value) => Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
const formatDate = (date) => date ? new Date(date).toLocaleString('zh-CN') : '-'

const getPriorityType = (p) => ({ LOW: 'info', MEDIUM: '', HIGH: 'warning', URGENT: 'danger' }[p] || '')
const getStatusType = (s) => ({ PENDING: 'warning', IN_PROGRESS: 'primary', COMPLETED: 'success', CANCELLED: 'info' }[s] || '')

const loadReminders = async () => {
  loading.value = true
  const params = { ...filters.value }
  if (!params.status) delete params.status
  if (!params.priority) delete params.priority
  reminders.value = await getReminders(params)
  loading.value = false
}

const loadOverdueOrders = async () => {
  overdueOrders.value = await getOrders({ is_overdue: 'true' })
}

const loadSalesList = async () => {
  try {
    const users = await getSalesList()
    salesList.value = users.map(u => ({ id: u.id, name: `${u.first_name}${u.last_name}` }))
  } catch {
    salesList.value = []
  }
}

const resetFilters = () => {
  filters.value = { status: '', priority: '' }
  loadReminders()
}

const viewDetail = async (row) => {
  currentReminder.value = await getReminder(row.id)
  detailDialogVisible.value = true
}

const handleStartReminder = async (row) => {
  await apiStartReminder(row.id)
  ElMessage.success('已开始处理')
  loadReminders()
}

const showCompleteDialog = (row) => {
  completingReminder.value = row
  completeResult.value = ''
  completeDialogVisible.value = true
}

const submitComplete = async () => {
  await apiCompleteReminder(completingReminder.value.id, completeResult.value)
  ElMessage.success('已完成')
  completeDialogVisible.value = false
  loadReminders()
}

const showCreateDialog = () => {
  newReminder.value = { order_id: null, assignee_id: null, title: '', content: '', priority: 'MEDIUM' }
  loadOverdueOrders()
  loadSalesList()
  createDialogVisible.value = true
}

const submitCreate = async () => {
  await apiCreateReminder(newReminder.value)
  ElMessage.success('创建成功')
  createDialogVisible.value = false
  loadReminders()
}

const addDetailRemark = async () => {
  await apiAddReminderRemark(currentReminder.value.id, detailRemark.value)
  detailRemark.value = ''
  ElMessage.success('已添加')
  viewDetail({ id: currentReminder.value.id })
}

onMounted(() => {
  loadReminders()
  loadSalesList()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-form {
  margin-bottom: 20px;
}

.priority-urgent { color: #f56c6c; }
.priority-high { color: #e6a23c; }
.priority-medium { color: #409EFF; }
.priority-low { color: #909399; }

.remark-list {
  max-height: 300px;
  overflow-y: auto;
}

.remark-item {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.remark-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.remark-author { font-weight: 500; }
.remark-time { font-size: 12px; color: #999; }
.remark-content { color: #606266; }
</style>
