<template>
  <div class="order-detail" v-if="order">
    <div class="detail-header">
      <div>
        <h2>
          订单 {{ order.orderNo }}
          <el-tag :type="orderStatusType(order.status)" size="large">{{ orderStatusLabel(order.status) }}</el-tag>
        </h2>
        <p class="sub-info">
          创建于 {{ formatDateTime(order.createdAt) }}
          <span v-if="order.salesConsultant"> · 销售: {{ order.salesConsultant }}</span>
          <span v-if="order.showroomManager"> · 展厅经理: {{ order.showroomManager }}</span>
          <span v-if="order.installationCoordinator"> · 安装协调: {{ order.installationCoordinator }}</span>
        </p>
      </div>
      <div class="header-actions">
        <el-button @click="goBack">返回</el-button>
        <el-dropdown @command="handleStatusChange">
          <el-button type="primary">
            变更状态 <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="(item, key) in orderStatusMap" :key="key" :command="key" :disabled="order.status === key">
                {{ item.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-steps :active="currentStep" finish-status="success" class="process-steps">
          <el-step title="订单确认" :description="stepDates[0]" />
          <el-step title="生产定制" :description="stepDates[1]" />
          <el-step title="到货" :description="stepDates[2]" />
          <el-step title="安装" :description="stepDates[3]" />
          <el-step title="验收完成" :description="stepDates[4]" />
        </el-steps>

        <el-card class="info-card">
          <template #header>客户信息</template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="客户姓名">{{ order.customer?.name }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ order.customer?.phone }}</el-descriptions-item>
            <el-descriptions-item label="所在小区">{{ order.customer?.community }}</el-descriptions-item>
            <el-descriptions-item label="安装地址" :span="3">{{ order.customer?.address }}</el-descriptions-item>
            <el-descriptions-item label="客户备注" :span="3">{{ order.customer?.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>商品明细</span>
              <span style="font-weight: 600;">合计: ¥{{ order.totalAmount }}</span>
            </div>
          </template>
          <el-table :data="order.items" stripe>
            <el-table-column prop="productName" label="商品名称" />
            <el-table-column prop="productModel" label="型号" width="120" />
            <el-table-column prop="customSpec" label="定制规格" width="180" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="unitPrice" label="单价" width="100">
              <template #default="{ row }">¥{{ row.unitPrice }}</template>
            </el-table-column>
            <el-table-column prop="subtotal" label="小计" width="100">
              <template #default="{ row }">¥{{ row.subtotal }}</template>
            </el-table-column>
            <el-table-column label="发货状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.deliveryStatus === 'delivered'" type="success">已发货</el-tag>
                <el-tag v-else-if="row.deliveryStatus === 'partial'" type="warning">部分发货</el-tag>
                <el-tag v-else type="info">待发货</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>安装预约记录</span>
              <el-button type="primary" size="small" @click="showAppointmentDialog = true" :disabled="order.status !== 'delivered' && order.status !== 'installing'">
                <el-icon><Plus /></el-icon>
                新增预约
              </el-button>
            </div>
          </template>
          <el-empty v-if="!order.appointments?.length" description="暂无安装预约" />
          <div v-else class="timeline-wrapper">
            <el-timeline>
              <el-timeline-item
                v-for="apt in order.appointments"
                :key="apt.id"
                :timestamp="`${apt.appointmentDate} ${apt.timeSlot}`"
                :type="appointmentStatusType(apt.status)"
              >
                <div class="apt-item">
                  <div class="apt-header">
                    <el-tag :type="appointmentStatusType(apt.status)" size="small">
                      {{ appointmentStatusLabel(apt.status) }}
                    </el-tag>
                    <span v-if="apt.installerName">安装师傅: {{ apt.installerName }}</span>
                    <span v-if="apt.teamSize"> ({{ apt.teamSize }}人)</span>
                  </div>
                  <div v-if="apt.customerRemark" class="apt-remark">客户备注: {{ apt.customerRemark }}</div>
                  <div class="apt-actions">
                    <el-button v-if="apt.status === 'pending'" size="small" type="success" @click="confirmAppointment(apt.id)">确认</el-button>
                    <el-button v-if="apt.status === 'confirmed'" size="small" type="warning" @click="startAppointment(apt.id)">开始安装</el-button>
                    <el-button v-if="apt.status === 'in_progress'" size="small" type="success" @click="completeAppointment(apt.id)">安装完成</el-button>
                    <el-button size="small" @click="rescheduleAppointment(apt)">改期</el-button>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>验收回单记录</span>
              <el-button type="primary" size="small" @click="showAcceptanceDialog = true" :disabled="!canCreateAcceptance">
                <el-icon><Plus /></el-icon>
                创建验收
              </el-button>
            </div>
          </template>
          <el-empty v-if="!order.acceptanceRecords?.length" description="暂无验收记录" />
          <div v-else>
            <div v-for="record in order.acceptanceRecords" :key="record.id" class="acceptance-item">
              <div class="acceptance-header">
                <el-tag :type="acceptanceStatusType(record.status)" size="large">
                  {{ acceptanceStatusLabel(record.status) }}
                </el-tag>
                <span class="acceptance-time">{{ formatDateTime(record.inspectionTime) }}</span>
                <span v-if="record.inspectorName">验收人: {{ record.inspectorName }}</span>
                <span v-if="record.satisfactionScore">满意度: {{ record.satisfactionScore }}星</span>
              </div>
              <div v-if="record.overallEvaluation" class="acceptance-content">
                <strong>整体评价:</strong> {{ record.overallEvaluation }}
              </div>
              <div v-if="record.qualityIssues" class="acceptance-content acceptance-issue">
                <strong>质量问题:</strong> {{ record.qualityIssues }}
              </div>
              <div v-if="record.installationIssues" class="acceptance-content acceptance-issue">
                <strong>安装问题:</strong> {{ record.installationIssues }}
              </div>
              <div v-if="record.missingItems" class="acceptance-content acceptance-issue">
                <strong>缺件:</strong> {{ record.missingItems }}
              </div>
              <div v-if="record.rectificationPlan" class="acceptance-content">
                <strong>整改方案:</strong> {{ record.rectificationPlan }}
              </div>
              <div v-if="record.status === 'failed'" class="acceptance-actions">
                <el-button type="primary" size="small" @click="goToException(order.id, record.id)">创建异常单</el-button>
                <el-button size="small" @click="openRectifyDialog(record)">整改完成</el-button>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>异常记录</span>
              <el-button type="danger" size="small" @click="showExceptionDialog = true">
                <el-icon><Plus /></el-icon>
                登记异常
              </el-button>
            </div>
          </template>
          <el-empty v-if="!order.exceptions?.length" description="暂无异常记录" />
          <div v-else>
            <div v-for="exc in order.exceptions" :key="exc.id" class="exception-item">
              <div class="exception-header">
                <el-tag :type="exceptionTypeType(exc.type)" size="small">{{ exceptionTypeLabel(exc.type) }}</el-tag>
                <el-tag :type="exceptionStatusType(exc.status)" size="small">{{ exceptionStatusLabel(exc.status) }}</el-tag>
                <strong class="exception-title">{{ exc.title }}</strong>
              </div>
              <p class="exception-desc">{{ exc.description }}</p>
              <div v-if="exc.repairParts?.length" class="repair-parts">
                <div class="repair-parts-title">补件需求:</div>
                <el-tag v-for="part in exc.repairParts" :key="part.id" size="small" style="margin-right: 4px;">
                  {{ part.partName }} x{{ part.quantity }} - {{ repairPartStatusLabel(part.status) }}
                </el-tag>
              </div>
              <div class="exception-actions">
                <el-button size="small" type="primary" @click="goToExceptionDetail(exc.id)">查看详情</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="side-card">
          <template #header>订单信息</template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="定金">¥{{ order.deposit || 0 }}</el-descriptions-item>
            <el-descriptions-item label="预计交货">{{ formatDate(order.expectedDeliveryDate) }}</el-descriptions-item>
            <el-descriptions-item label="实际交货">{{ formatDate(order.actualDeliveryDate) }}</el-descriptions-item>
            <el-descriptions-item label="定制配置">{{ order.customConfig || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注">{{ order.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="side-card">
          <template #header>样品借出记录</template>
          <el-empty v-if="!order.sampleLoans?.length" description="暂无样品借出" />
          <div v-else>
            <div v-for="loan in order.sampleLoans" :key="loan.id" class="sample-item">
              <div class="sample-header">
                <span>{{ loan.productName }} x{{ loan.quantity }}</span>
                <el-tag :type="sampleStatusType(loan.status)" size="small">{{ sampleStatusLabel(loan.status) }}</el-tag>
              </div>
              <div class="sample-info">借出: {{ formatDate(loan.borrowDate) }}</div>
              <div class="sample-info">预计归还: {{ formatDate(loan.expectedReturnDate) }}</div>
              <div v-if="loan.status === 'overdue'" class="sample-info" style="color: #f56c6c;">
                已逾期 {{ daysOverdue(loan.expectedReturnDate) }} 天
              </div>
              <div class="sample-actions" v-if="loan.status === 'overdue' || loan.status === 'borrowed'">
                <el-button size="small" type="warning" @click="remindSample(loan.id)">催还</el-button>
                <el-button size="small" type="success" @click="markSampleReturned(loan.id)">标记归还</el-button>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="side-card">
          <template #header>操作日志</template>
          <el-empty v-if="activityLogs.length === 0" description="暂无操作记录" />
          <div v-else class="activity-list">
            <div v-for="log in activityLogs" :key="log.id" class="activity-item">
              <div class="activity-time">{{ formatDateTime(log.createdAt) }}</div>
              <div class="activity-content">
                <span class="activity-operator">{{ log.operatorName }}</span>
                <span class="activity-action">{{ log.description }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showAppointmentDialog" title="创建安装预约" width="500px">
      <el-form :model="appointmentForm" label-width="100px">
        <el-form-item label="预约日期">
          <el-date-picker v-model="appointmentForm.appointmentDate" type="date" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="时间段">
          <el-select v-model="appointmentForm.timeSlot" style="width: 100%;">
            <el-option label="09:00-12:00" value="09:00-12:00" />
            <el-option label="10:00-14:00" value="10:00-14:00" />
            <el-option label="14:00-18:00" value="14:00-18:00" />
            <el-option label="09:00-18:00" value="09:00-18:00" />
          </el-select>
        </el-form-item>
        <el-form-item label="安装师傅">
          <el-input v-model="appointmentForm.installerName" />
        </el-form-item>
        <el-form-item label="团队人数">
          <el-input-number v-model="appointmentForm.teamSize" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="客户备注">
          <el-input v-model="appointmentForm.customerRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAppointmentDialog = false">取消</el-button>
        <el-button type="primary" @click="createAppointment">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAcceptanceDialog" title="创建验收回单" width="600px">
      <el-form :model="acceptanceForm" label-width="100px">
        <el-form-item label="整体评价">
          <el-input v-model="acceptanceForm.overallEvaluation" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="质量问题">
          <el-input v-model="acceptanceForm.qualityIssues" type="textarea" :rows="2" placeholder="如有质量问题请描述" />
        </el-form-item>
        <el-form-item label="安装问题">
          <el-input v-model="acceptanceForm.installationIssues" type="textarea" :rows="2" placeholder="如有安装问题请描述" />
        </el-form-item>
        <el-form-item label="缺件情况">
          <el-input v-model="acceptanceForm.missingItems" type="textarea" :rows="2" placeholder="如有缺件请描述" />
        </el-form-item>
        <el-form-item label="整改方案">
          <el-input v-model="acceptanceForm.rectificationPlan" type="textarea" :rows="2" placeholder="如有问题请填写整改方案" />
        </el-form-item>
        <el-form-item label="客户反馈">
          <el-input v-model="acceptanceForm.customerFeedback" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="满意度">
          <el-rate v-model="acceptanceForm.satisfactionScore" />
        </el-form-item>
        <el-form-item label="验收人">
          <el-input v-model="acceptanceForm.inspectorName" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAcceptanceDialog = false">取消</el-button>
        <el-button type="primary" @click="createAcceptance">提交验收</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showExceptionDialog" title="登记异常" width="500px">
      <el-form :model="exceptionForm" label-width="100px">
        <el-form-item label="异常类型">
          <el-select v-model="exceptionForm.type" style="width: 100%;">
            <el-option v-for="(item, key) in exceptionTypeMap" :key="key" :label="item.label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="exceptionForm.title" />
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input v-model="exceptionForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="处理人">
          <el-input v-model="exceptionForm.assignee" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExceptionDialog = false">取消</el-button>
        <el-button type="primary" @click="createException">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRectifyDialog" title="整改完成" width="400px">
      <el-form :model="rectifyForm" label-width="100px">
        <el-form-item label="整改结果">
          <el-input v-model="rectifyForm.rectificationResult" type="textarea" :rows="3" placeholder="请描述整改结果" />
        </el-form-item>
        <el-form-item label="客户满意度">
          <el-rate v-model="rectifyForm.satisfactionScore" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRectifyDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRectification">确认整改完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { orderApi, installationApi, acceptanceApi, exceptionApi, sampleApi } from '@/api'
import {
  orderStatusMap, appointmentStatusMap, acceptanceStatusMap,
  exceptionTypeMap, exceptionStatusMap, sampleStatusMap, repairPartStatusMap,
  formatDate, formatDateTime
} from '@/utils/constants'

const route = useRoute()
const router = useRouter()
const orderId = computed(() => Number(route.params.id))
const order = ref<any>(null)
const activityLogs = ref<any[]>([])

const showAppointmentDialog = ref(false)
const showAcceptanceDialog = ref(false)
const showExceptionDialog = ref(false)
const showRectifyDialog = ref(false)
const currentAcceptanceRecord = ref<any>(null)

const appointmentForm = ref({
  orderId: 0,
  appointmentDate: '',
  timeSlot: '09:00-12:00',
  installerName: '',
  teamSize: 2,
  customerRemark: '',
})

const acceptanceForm = ref({
  orderId: 0,
  appointmentId: null as number | null,
  overallEvaluation: '',
  qualityIssues: '',
  installationIssues: '',
  missingItems: '',
  rectificationPlan: '',
  customerFeedback: '',
  satisfactionScore: 5,
  inspectorName: '',
})

const exceptionForm = ref({
  orderId: 0,
  type: 'other',
  title: '',
  description: '',
  assignee: '',
})

const rectifyForm = ref({
  rectificationResult: '',
  satisfactionScore: 5,
})

const stepOrder = ['pending', 'confirmed', 'producing', 'delivered', 'installing', 'completed']

const currentStep = computed(() => {
  const idx = stepOrder.indexOf(order.value?.status || '')
  return idx >= 0 ? idx : 0
})

const stepDates = computed(() => {
  if (!order.value) return []
  return [
    formatDate(order.value.createdAt),
    order.value.status === 'confirmed' || order.value.status !== 'pending' ? '已确认' : '-',
    formatDate(order.value.actualDeliveryDate) || (order.value.status === 'producing' ? '生产中' : '-'),
    order.value.status === 'installing' || order.value.status === 'completed' ? '进行中/已完成' : '-',
    order.value.status === 'completed' ? '已完成' : '-',
  ]
})

const canCreateAcceptance = computed(() => {
  const hasCompletedInstallation = order.value?.appointments?.some((a: any) => a.status === 'completed')
  return hasCompletedInstallation && (!order.value?.acceptanceRecords?.length || order.value.acceptanceRecords.every((r: any) => r.status !== 'passed'))
})

function orderStatusType(status: string) { return orderStatusMap[status]?.type || 'info' }
function orderStatusLabel(status: string) { return orderStatusMap[status]?.label || status }
function appointmentStatusType(status: string) { return appointmentStatusMap[status]?.type || 'info' }
function appointmentStatusLabel(status: string) { return appointmentStatusMap[status]?.label || status }
function acceptanceStatusType(status: string) { return acceptanceStatusMap[status]?.type || 'info' }
function acceptanceStatusLabel(status: string) { return acceptanceStatusMap[status]?.label || status }
function exceptionTypeType(type: string) { return exceptionTypeMap[type]?.type || 'info' }
function exceptionTypeLabel(type: string) { return exceptionTypeMap[type]?.label || type }
function exceptionStatusType(status: string) { return exceptionStatusMap[status]?.type || 'info' }
function exceptionStatusLabel(status: string) { return exceptionStatusMap[status]?.label || status }
function sampleStatusType(status: string) { return sampleStatusMap[status]?.type || 'info' }
function sampleStatusLabel(status: string) { return sampleStatusMap[status]?.label || status }
function repairPartStatusLabel(status: string) { return repairPartStatusMap[status]?.label || status }

function daysOverdue(date: string) {
  if (!date) return 0
  const diff = Date.now() - new Date(date).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

async function loadOrder() {
  order.value = await orderApi.getDetail(orderId.value)
  activityLogs.value = await orderApi.getActivityLogs(orderId.value)
  appointmentForm.value.orderId = orderId.value
  acceptanceForm.value.orderId = orderId.value
  exceptionForm.value.orderId = orderId.value

  if (route.query.openException === 'true') {
    const recordId = Number(route.query.recordId)
    if (recordId) {
      const record = order.value?.acceptanceRecords?.find((r: any) => r.id === recordId)
      if (record) {
        exceptionForm.value.title = `验收未通过 - ${record.missingItems || record.qualityIssues || record.installationIssues}`.slice(0, 50)
        if (record.missingItems) {
          exceptionForm.value.type = 'missing_parts'
          exceptionForm.value.description = `缺件: ${record.missingItems}`
        } else if (record.qualityIssues) {
          exceptionForm.value.type = 'quality_issue'
          exceptionForm.value.description = `质量问题: ${record.qualityIssues}`
        } else if (record.installationIssues) {
          exceptionForm.value.type = 'installation_issue'
          exceptionForm.value.description = `安装问题: ${record.installationIssues}`
        }
      }
    }
    showExceptionDialog.value = true
  }
}

async function handleStatusChange(status: string) {
  await orderApi.updateStatus(orderId.value, { status })
  ElMessage.success('状态已更新')
  loadOrder()
}

async function confirmAppointment(id: number) {
  await installationApi.update(id, { status: 'confirmed' })
  ElMessage.success('预约已确认')
  loadOrder()
}

async function startAppointment(id: number) {
  await installationApi.start(id)
  ElMessage.success('已开始安装')
  loadOrder()
}

async function completeAppointment(id: number) {
  await installationApi.complete(id)
  ElMessage.success('安装已完成')
  loadOrder()
}

async function rescheduleAppointment(apt: any) {
  ElMessage.info('请在日历页面进行改期操作')
}

async function createAppointment() {
  await installationApi.create(appointmentForm.value)
  ElMessage.success('预约创建成功')
  showAppointmentDialog.value = false
  loadOrder()
}

async function createAcceptance() {
  await acceptanceApi.create(acceptanceForm.value)
  ElMessage.success('验收记录已创建')
  showAcceptanceDialog.value = false
  loadOrder()
}

async function createException() {
  await exceptionApi.create(exceptionForm.value)
  ElMessage.success('异常已登记')
  showExceptionDialog.value = false
  loadOrder()
}

function openRectifyDialog(record: any) {
  currentAcceptanceRecord.value = record
  showRectifyDialog.value = true
}

async function submitRectification() {
  if (!currentAcceptanceRecord.value) return
  await acceptanceApi.rectify(currentAcceptanceRecord.value.id, rectifyForm.value)
  ElMessage.success('整改完成')
  showRectifyDialog.value = false
  loadOrder()
}

function goToException(orderId: number, recordId: number) {
  router.push(`/orders/${orderId}?openException=true&recordId=${recordId}`)
}

function goToExceptionDetail(id: number) {
  router.push(`/exceptions?id=${id}`)
}

async function remindSample(id: number) {
  await sampleApi.remind(id)
  ElMessage.success('催还提醒已发送')
  loadOrder()
}

async function markSampleReturned(id: number) {
  await sampleApi.update(id, { status: 'returned' })
  ElMessage.success('已标记归还')
  loadOrder()
}

function goBack() {
  router.back()
}

onMounted(async () => {
  await loadOrder()
  if (route.query.openAcceptance === 'true') {
    const aptId = Number(route.query.appointmentId)
    if (aptId) {
      acceptanceForm.value.appointmentId = aptId
    }
    showAcceptanceDialog.value = true
  }
})
</script>

<style scoped>
.order-detail {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;

  h2 {
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .sub-info {
    margin: 0;
    color: #909399;
    font-size: 13px;
  }
}

.process-steps {
  margin-bottom: 20px;
}

.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.apt-item {
  .apt-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }
  .apt-remark {
    font-size: 13px;
    color: #606266;
    margin-bottom: 8px;
  }
  .apt-actions {
    display: flex;
    gap: 8px;
  }
}

.acceptance-item {
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;

  .acceptance-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    font-size: 13px;
  }

  .acceptance-content {
    margin-bottom: 8px;
    font-size: 13px;
  }

  .acceptance-issue {
    color: #f56c6c;
  }

  .acceptance-actions {
    margin-top: 12px;
    display: flex;
    gap: 8px;
  }
}

.exception-item {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;

  .exception-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .exception-title {
    font-weight: 500;
  }

  .exception-desc {
    font-size: 13px;
    color: #606266;
    margin-bottom: 8px;
  }

  .repair-parts {
    margin-bottom: 8px;
  }

  .repair-parts-title {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
  }

  .exception-actions {
    display: flex;
    gap: 8px;
  }
}

.side-card {
  margin-bottom: 20px;
}

.sample-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .sample-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    font-weight: 500;
  }

  .sample-info {
    font-size: 12px;
    color: #606266;
    margin-bottom: 4px;
  }

  .sample-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
}

.activity-list {
  .activity-item {
    padding: 8px 0;
    border-bottom: 1px solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    .activity-time {
      font-size: 11px;
      color: #909399;
      margin-bottom: 2px;
    }

    .activity-operator {
      color: #409eff;
      margin-right: 8px;
    }

    .activity-action {
      font-size: 13px;
    }
  }
}

.timeline-wrapper {
  :deep(.el-timeline-item__content) {
    padding-top: 0;
  }
}
</style>
