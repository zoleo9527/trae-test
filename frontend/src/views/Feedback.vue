<template>
  <div class="feedback-page">
    <el-row :gutter="20">
      <el-col :span="4">
        <el-card class="stat-card" @click="activeTab = 'all'" :class="{ active: activeTab === 'all' }">
          <div class="stat-content">
            <div class="stat-value">{{ feedbackStore.statistics.total }}</div>
            <div class="stat-label">全部反馈</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card danger" @click="activeTab = 'pending'" :class="{ active: activeTab === 'pending' }">
          <div class="stat-content">
            <div class="stat-value">{{ feedbackStore.statistics.pending }}</div>
            <div class="stat-label">待处理</div>
            <el-badge :value="feedbackStore.statistics.overdue" class="overdue-badge" :hidden="feedbackStore.statistics.overdue === 0">逾期</el-badge>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card warning" @click="activeTab = 'processing'" :class="{ active: activeTab === 'processing' }">
          <div class="stat-content">
            <div class="stat-value">{{ feedbackStore.statistics.processing }}</div>
            <div class="stat-label">处理中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card success" @click="activeTab = 'resolved'" :class="{ active: activeTab === 'resolved' }">
          <div class="stat-content">
            <div class="stat-value">{{ feedbackStore.statistics.resolved }}</div>
            <div class="stat-label">已解决</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ myPendingCount }}</div>
            <div class="stat-label">待我处理</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ todayNewCount }}</div>
            <div class="stat-label">今日新增</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <el-tabs v-model="activeTab" style="margin-bottom: 0">
            <el-tab-pane label="全部反馈" name="all" />
            <el-tab-pane label="待处理" name="pending" />
            <el-tab-pane label="处理中" name="processing" />
            <el-tab-pane label="已解决" name="resolved" />
          </el-tabs>
          <div class="header-actions">
            <el-select v-model="filterType" placeholder="反馈类型" clearable size="small" style="width: 140px">
              <el-option label="设备问题" value="设备问题" />
              <el-option label="环境问题" value="环境问题" />
              <el-option label="排班问题" value="排班问题" />
              <el-option label="读者反馈" value="读者反馈" />
              <el-option label="其他" value="其他" />
            </el-select>
            <el-button type="primary" size="small" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              新建反馈
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredFeedbacks" border stripe style="width: 100%">
        <el-table-column label="反馈类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标题" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="feedback-title" @click="handleViewDetail(row)">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column label="内容" width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.content }}</template>
        </el-table-column>
        <el-table-column label="关联排班" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.scheduleId" type="info" size="small">有</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="提交人" width="80">
          <template #default="{ row }">{{ row.creatorName }}</template>
        </el-table-column>
        <el-table-column label="优先级" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.priority === 'high'" type="danger" size="small">高</el-tag>
            <el-tag v-else-if="row.priority === 'medium'" type="warning" size="small">中</el-tag>
            <el-tag v-else type="info" size="small">低</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前处理人" width="120">
          <template #default="{ row }">
            <el-tag :type="getHandlerTagType(row.currentHandler)" size="small">
              {{ handlerMap[row.currentHandler]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="feedbackStatusMap[row.status]?.type" size="small">
              {{ feedbackStatusMap[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ row.createdAt }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">详情</el-button>
            <el-button
              v-if="row.status !== 'resolved' && row.currentHandler === currentRole"
              type="success"
              link
              size="small"
              @click="handleResolve(row)"
            >
              解决
            </el-button>
            <el-button
              v-if="row.status !== 'resolved'"
              type="warning"
              link
              size="small"
              @click="handleTransfer(row)"
            >
              转派
            </el-button>
            <el-button type="info" link size="small" @click="handleAddRemark(row)">备注</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" :title="currentFeedback?.title" width="700px">
      <div v-if="currentFeedback" class="feedback-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="反馈类型">
            <el-tag size="small">{{ currentFeedback.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag v-if="currentFeedback.priority === 'high'" type="danger" size="small">高</el-tag>
            <el-tag v-else-if="currentFeedback.priority === 'medium'" type="warning" size="small">中</el-tag>
            <el-tag v-else type="info" size="small">低</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交人">{{ currentFeedback.creatorName }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentFeedback.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="当前处理人">
            <el-tag :type="getHandlerTagType(currentFeedback.currentHandler)" size="small">
              {{ handlerMap[currentFeedback.currentHandler]?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="feedbackStatusMap[currentFeedback.status]?.type" size="small">
              {{ feedbackStatusMap[currentFeedback.status]?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="反馈内容" :span="2">
            {{ currentFeedback.content }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentFeedback.resolution" label="解决方案" :span="2">
            <el-tag type="success" style="max-width: 100%; word-break: break-all;">
              {{ currentFeedback.resolution }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="history-section">
          <h4>处理历史</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in currentFeedback.history"
              :key="index"
              :type="getTimelineType(item.action)"
              :timestamp="item.time"
            >
              <div class="timeline-content">
                <span class="action-tag">{{ item.action }}</span>
                <span class="operator">操作人: {{ item.operator }}</span>
                <span v-if="item.target" class="target">转派给: {{ handlerMap[item.target]?.label }}</span>
              </div>
              <div v-if="item.remark" class="timeline-remark">
                {{ item.remark }}
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
          v-if="currentFeedback?.status !== 'resolved' && currentFeedback?.currentHandler === currentRole"
          type="success"
          @click="handleResolve(currentFeedback)"
        >
          标记解决
        </el-button>
        <el-button v-if="currentFeedback?.status !== 'resolved'" type="warning" @click="handleTransfer(currentFeedback)">
          转派处理
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resolveVisible" title="标记解决" width="500px">
      <el-form :model="resolveForm" label-width="100px">
        <el-form-item label="解决方案" required>
          <el-input
            v-model="resolveForm.resolution"
            type="textarea"
            :rows="4"
            placeholder="请输入解决方案"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resolveVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmResolve">确认解决</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="transferVisible" title="转派处理" width="500px">
      <el-form :model="transferForm" label-width="100px">
        <el-form-item label="转派给" required>
          <el-select v-model="transferForm.target" placeholder="选择处理角色" style="width: 100%">
            <el-option label="馆长" value="director" />
            <el-option label="志愿者协调" value="coordinator" />
            <el-option label="活动运营" value="operator" />
          </el-select>
        </el-form-item>
        <el-form-item label="转派说明">
          <el-input
            v-model="transferForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入转派说明（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmTransfer">确认转派</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="remarkVisible" title="添加备注" width="500px">
      <el-form :model="remarkForm" label-width="100px">
        <el-form-item label="备注内容" required>
          <el-input
            v-model="remarkForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入备注内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remarkVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddRemark">添加备注</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="createVisible" title="新建反馈" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="反馈类型" required>
          <el-select v-model="createForm.type" placeholder="选择反馈类型" style="width: 100%">
            <el-option label="设备问题" value="设备问题" />
            <el-option label="环境问题" value="环境问题" />
            <el-option label="排班问题" value="排班问题" />
            <el-option label="读者反馈" value="读者反馈" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="createForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input
            v-model="createForm.content"
            type="textarea"
            :rows="4"
            placeholder="请详细描述问题"
          />
        </el-form-item>
        <el-form-item label="优先级" required>
          <el-radio-group v-model="createForm.priority">
            <el-radio value="high">高</el-radio>
            <el-radio value="medium">中</el-radio>
            <el-radio value="low">低</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="关联排班">
          <el-select v-model="createForm.scheduleId" placeholder="选择关联的排班（可选）" style="width: 100%" clearable>
            <el-option
              v-for="s in recentSchedules"
              :key="s.id"
              :label="`${s.date} ${s.volunteerName} - ${s.type}`"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="初始处理人" required>
          <el-select v-model="createForm.initialHandler" placeholder="选择初始处理人" style="width: 100%">
            <el-option label="志愿者协调" value="coordinator" />
            <el-option label="活动运营" value="operator" />
            <el-option label="馆长" value="director" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreate">提交反馈</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { useFeedbackStore } from '@/stores/feedback'
import { useScheduleStore } from '@/stores/schedule'
import { useUserStore } from '@/stores/user'
import { feedbackStatusMap, handlerMap } from '@/mock/data'

const feedbackStore = useFeedbackStore()
const scheduleStore = useScheduleStore()
const userStore = useUserStore()

const activeTab = ref('all')
const filterType = ref('')

const detailVisible = ref(false)
const resolveVisible = ref(false)
const transferVisible = ref(false)
const remarkVisible = ref(false)
const createVisible = ref(false)

const currentFeedback = ref(null)
const resolveForm = ref({ resolution: '' })
const transferForm = ref({ target: '', remark: '' })
const remarkForm = ref({ content: '' })
const createForm = ref({
  type: '',
  title: '',
  content: '',
  priority: 'medium',
  scheduleId: null,
  initialHandler: 'coordinator'
})

const currentRole = computed(() => userStore.currentRole)

const myPendingCount = computed(() => {
  return feedbackStore.feedbacks.filter(f => 
    f.status !== 'resolved' && f.currentHandler === currentRole.value
  ).length
})

const todayNewCount = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return feedbackStore.feedbacks.filter(f => f.createdAt.startsWith(today)).length
})

const recentSchedules = computed(() => {
  return scheduleStore.schedules
    .filter(s => s.status !== 'pending')
    .slice(0, 10)
})

const filteredFeedbacks = computed(() => {
  let result = [...feedbackStore.feedbacks]
  
  if (activeTab.value !== 'all') {
    result = result.filter(f => f.status === activeTab.value)
  }
  
  if (filterType.value) {
    result = result.filter(f => f.type === filterType.value)
  }
  
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

function getHandlerTagType(handler) {
  const types = {
    director: 'info',
    coordinator: 'primary',
    operator: 'warning'
  }
  return types[handler] || ''
}

function getTimelineType(action) {
  const types = {
    '创建': 'primary',
    '转派': 'warning',
    '解决': 'success',
    '备注': 'info'
  }
  return types[action] || ''
}

function handleViewDetail(row) {
  currentFeedback.value = row
  detailVisible.value = true
}

function handleResolve(row) {
  currentFeedback.value = row
  resolveForm.value = { resolution: '' }
  detailVisible.value = false
  resolveVisible.value = true
}

function confirmResolve() {
  if (!resolveForm.value.resolution) {
    ElMessage.warning('请输入解决方案')
    return
  }
  feedbackStore.resolveFeedback(
    currentFeedback.value.id,
    resolveForm.value.resolution,
    userStore.currentUser?.name
  )
  ElMessage.success('已标记为解决')
  resolveVisible.value = false
}

function handleTransfer(row) {
  currentFeedback.value = row
  transferForm.value = { target: '', remark: '' }
  detailVisible.value = false
  transferVisible.value = true
}

function confirmTransfer() {
  if (!transferForm.value.target) {
    ElMessage.warning('请选择转派对象')
    return
  }
  feedbackStore.transferFeedback(
    currentFeedback.value.id,
    transferForm.value.target,
    userStore.currentUser?.name,
    transferForm.value.remark
  )
  ElMessage.success('转派成功')
  transferVisible.value = false
}

function handleAddRemark(row) {
  currentFeedback.value = row
  remarkForm.value = { content: '' }
  detailVisible.value = false
  remarkVisible.value = true
}

function confirmAddRemark() {
  if (!remarkForm.value.content) {
    ElMessage.warning('请输入备注内容')
    return
  }
  feedbackStore.addRemark(
    currentFeedback.value.id,
    remarkForm.value.content,
    userStore.currentUser?.name
  )
  ElMessage.success('备注已添加')
  remarkVisible.value = false
}

function handleCreate() {
  createForm.value = {
    type: '',
    title: '',
    content: '',
    priority: 'medium',
    scheduleId: null,
    initialHandler: 'coordinator'
  }
  createVisible.value = true
}

function confirmCreate() {
  if (!createForm.value.type || !createForm.value.title || !createForm.value.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  const schedule = scheduleStore.schedules.find(s => s.id === createForm.value.scheduleId)
  
  feedbackStore.addFeedback({
    ...createForm.value,
    volunteerName: schedule?.volunteerName || '',
    creatorName: userStore.currentUser?.name
  })
  
  ElMessage.success('反馈已提交')
  createVisible.value = false
}
</script>

<style scoped>
.feedback-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-card {
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.stat-card:hover,
.stat-card.active {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transform: translateY(-2px);
}

.stat-card.danger {
  border-left: 4px solid #F56C6C;
}

.stat-card.warning {
  border-left: 4px solid #E6A23C;
}

.stat-card.success {
  border-left: 4px solid #67C23A;
}

.stat-content {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.overdue-badge {
  position: absolute;
  top: 8px;
  right: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.feedback-title {
  color: #409EFF;
  cursor: pointer;
}

.feedback-title:hover {
  text-decoration: underline;
}

.text-muted {
  color: #909399;
}

.history-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.history-section h4 {
  margin-bottom: 16px;
  color: #303133;
}

.timeline-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.action-tag {
  font-weight: 600;
  color: #303133;
}

.operator,
.target {
  font-size: 13px;
  color: #606266;
}

.timeline-remark {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}
</style>
