<template>
  <div class="inspection-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>⚠️ 巡店问题追踪</span>
          <el-button 
            v-if="canCreateIssue" 
            type="primary" 
            @click="showCreateDialog = true"
          >
            <el-icon><Plus /></el-icon>
            上报问题
          </el-button>
        </div>
      </template>

      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-statistic title="待处理" :value="pendingCount" value-style="{ color: '#f56c6c' }" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="处理中" :value="processingCount" value-style="{ color: '#e6a23c' }" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="已解决" :value="resolvedCount" value-style="{ color: '#67c23a' }" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="已关闭" :value="closedCount" value-style="{ color: '#909399' }" />
        </el-col>
      </el-row>

      <el-table :data="filteredIssues">
        <el-table-column label="问题类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getIssueTypeColor(row.type)">
              {{ getIssueTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="问题标题" width="200" />
        <el-table-column prop="storeName" label="门店" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusColor(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reporterName" label="上报人" width="100" />
        <el-table-column prop="handlerName" label="处理人" width="100">
          <template #default="{ row }">
            {{ row.handlerName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="上报时间" width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewDetail(row)">
              详情
            </el-button>
            <el-button 
              v-if="canAccept(row)" 
              type="success" 
              size="small" 
              link
              @click="handleAccept(row)"
            >
              接单处理
            </el-button>
            <el-button 
              v-if="canResolve(row)" 
              type="warning" 
              size="small" 
              link
              @click="showResolveDialog = true; selectedIssue = row"
            >
              标记解决
            </el-button>
            <el-button 
              v-if="canClose(row)"
              type="info" 
              size="small" 
              link
              @click="handleClose(row)"
            >
              关闭
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="filteredIssues.length === 0" description="暂无问题" :image-size="100" />
    </el-card>

    <el-dialog v-model="showCreateDialog" title="上报问题" width="500px">
      <el-alert 
        title="只有店长可以上报巡店问题" 
        type="info" 
        :closable="false"
        show-icon
        style="margin-bottom: 15px;"
      />
      <el-form :model="issueForm" label-width="100px">
        <el-form-item label="问题类型">
          <el-select v-model="issueForm.type" placeholder="请选择问题类型">
            <el-option label="库存问题" value="stock" />
            <el-option label="陈列问题" value="display" />
            <el-option label="服务问题" value="service" />
            <el-option label="其他问题" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="问题标题">
          <el-input v-model="issueForm.title" placeholder="请简要描述问题" />
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input v-model="issueForm.description" type="textarea" :rows="4" placeholder="请详细描述问题" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitIssue">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="问题详情" width="600px">
      <div v-if="selectedIssue" class="issue-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="问题类型">
            <el-tag size="small" :type="getIssueTypeColor(selectedIssue.type)">
              {{ getIssueTypeText(selectedIssue.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag size="small" :type="getStatusColor(selectedIssue.status)">
              {{ getStatusText(selectedIssue.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="门店">{{ selectedIssue.storeName }}</el-descriptions-item>
          <el-descriptions-item label="上报人">{{ selectedIssue.reporterName }}</el-descriptions-item>
          <el-descriptions-item label="处理人">{{ selectedIssue.handlerName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="上报时间">{{ selectedIssue.createTime }}</el-descriptions-item>
          <el-descriptions-item v-if="selectedIssue.acceptTime" label="接单时间">
            {{ selectedIssue.acceptTime }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedIssue.resolveTime" label="解决时间">
            {{ selectedIssue.resolveTime }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedIssue.closeTime" label="关闭时间">
            {{ selectedIssue.closeTime }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedIssue.closerName" label="关闭人">
            {{ selectedIssue.closerName }}
          </el-descriptions-item>
          <el-descriptions-item label="问题标题" :span="2">{{ selectedIssue.title }}</el-descriptions-item>
          <el-descriptions-item label="详细描述" :span="2">{{ selectedIssue.description }}</el-descriptions-item>
          <el-descriptions-item v-if="selectedIssue.remark" label="处理备注" :span="2">
            {{ selectedIssue.remark }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <el-dialog v-model="showResolveDialog" title="标记问题已解决" width="500px">
      <el-alert 
        v-if="selectedIssue"
        :title="`正在处理：${selectedIssue.title}`"
        type="info" 
        :closable="false"
        show-icon
        style="margin-bottom: 15px;"
      />
      <el-form :model="resolveForm" label-width="100px">
        <el-form-item label="解决说明">
          <el-input 
            v-model="resolveForm.remark" 
            type="textarea" 
            :rows="4" 
            placeholder="请描述问题的解决方案" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResolveDialog = false">取消</el-button>
        <el-button type="primary" @click="submitResolve">确认解决</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore, useOrderStore } from '@/stores'
import { UserRole, type InspectionIssue } from '@/types'

const authStore = useAuthStore()
const orderStore = useOrderStore()

const allIssues = computed(() => orderStore.inspectionIssues)

const filteredIssues = computed(() => {
  const user = authStore.currentUser
  if (!user) return allIssues.value
  if (user.role === UserRole.STORE_MANAGER && user.storeId) {
    return allIssues.value.filter(i => i.storeId === user.storeId)
  }
  return allIssues.value
})

const pendingCount = computed(() => filteredIssues.value.filter(i => i.status === 'pending').length)
const processingCount = computed(() => filteredIssues.value.filter(i => i.status === 'processing').length)
const resolvedCount = computed(() => filteredIssues.value.filter(i => i.status === 'resolved').length)
const closedCount = computed(() => filteredIssues.value.filter(i => i.status === 'closed').length)

const canCreateIssue = computed(() => {
  return authStore.currentUser?.role === UserRole.STORE_MANAGER
})

const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showResolveDialog = ref(false)
const selectedIssue = ref<InspectionIssue | null>(null)

const issueForm = ref({
  type: 'stock' as 'stock' | 'display' | 'service' | 'other',
  title: '',
  description: ''
})

const resolveForm = ref({
  remark: ''
})

const getIssueTypeText = (type: string) => {
  const texts: Record<string, string> = {
    'stock': '库存问题',
    'display': '陈列问题',
    'service': '服务问题',
    'other': '其他问题'
  }
  return texts[type] || type
}

const getIssueTypeColor = (type: string) => {
  const colors: Record<string, any> = {
    'stock': 'danger',
    'display': 'warning',
    'service': 'primary',
    'other': 'info'
  }
  return colors[type] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'pending': '待处理',
    'processing': '处理中',
    'resolved': '已解决',
    'closed': '已关闭'
  }
  return texts[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, any> = {
    'pending': 'danger',
    'processing': 'warning',
    'resolved': 'success',
    'closed': 'info'
  }
  return colors[status] || 'info'
}

const canAccept = (issue: InspectionIssue) => {
  const user = authStore.currentUser
  if (!user) return false
  if (issue.status !== 'pending') return false
  if (user.role === UserRole.STORE_MANAGER && user.storeId && issue.storeId !== user.storeId) return false
  return true
}

const canResolve = (issue: InspectionIssue) => {
  const user = authStore.currentUser
  if (!user) return false
  if (issue.status !== 'processing') return false
  if (issue.handlerId !== user.id) return false
  return true
}

const canClose = (issue: InspectionIssue) => {
  const user = authStore.currentUser
  if (!user) return false
  if (issue.status !== 'resolved') return false
  if (issue.reporterId === user.id) return true
  if (user.role === UserRole.STORE_MANAGER && user.storeId === issue.storeId) return true
  if (user.role === UserRole.PLANNER) return true
  return false
}

const viewDetail = (issue: InspectionIssue) => {
  selectedIssue.value = issue
  showDetailDialog.value = true
}

const submitIssue = () => {
  const user = authStore.currentUser
  if (!user) return
  
  if (!issueForm.value.title || !issueForm.value.description) {
    ElMessage.warning('请填写完整信息')
    return
  }

  const result = orderStore.createIssue(
    issueForm.value.type,
    issueForm.value.title,
    issueForm.value.description,
    user
  )

  if (result.success) {
    ElMessage.success('问题已上报')
    showCreateDialog.value = false
    issueForm.value = { type: 'stock', title: '', description: '' }
  } else {
    ElMessage.error(result.message || '上报失败')
  }
}

const handleAccept = (issue: InspectionIssue) => {
  const user = authStore.currentUser
  if (!user) return

  const result = orderStore.acceptIssue(issue.id, user)
  if (result.success) {
    ElMessage.success('已接单处理')
  } else {
    ElMessage.error(result.message || '接单失败')
  }
}

const submitResolve = () => {
  const user = authStore.currentUser
  if (!user || !selectedIssue.value) return

  if (!resolveForm.value.remark) {
    ElMessage.warning('请填写解决说明')
    return
  }

  const result = orderStore.resolveIssue(
    selectedIssue.value.id,
    resolveForm.value.remark,
    user
  )

  if (result.success) {
    ElMessage.success('问题已解决')
    showResolveDialog.value = false
    resolveForm.value = { remark: '' }
  } else {
    ElMessage.error(result.message || '操作失败')
  }
}

const handleClose = (issue: InspectionIssue) => {
  const user = authStore.currentUser
  if (!user) return

  const result = orderStore.closeIssue(issue.id, user)
  if (result.success) {
    ElMessage.success('问题已关闭')
  } else {
    ElMessage.error(result.message || '关闭失败')
  }
}
</script>

<style scoped>
.inspection-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.issue-detail {
  padding: 10px 0;
}
</style>
