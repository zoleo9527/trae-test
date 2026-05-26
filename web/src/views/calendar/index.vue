<template>
  <div class="calendar-page">
    <div class="calendar-header">
      <div class="calendar-nav">
        <el-button-group>
          <el-button @click="changeMonth(-1)">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <el-button @click="goToToday">今天</el-button>
          <el-button @click="changeMonth(1)">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>
        <span class="current-month">{{ currentMonthLabel }}</span>
      </div>
      <div class="calendar-legend">
        <span class="legend-item"><span class="legend-dot pending"></span>待确认</span>
        <span class="legend-item"><span class="legend-dot confirmed"></span>已确认</span>
        <span class="legend-item"><span class="legend-dot progress"></span>进行中</span>
        <span class="legend-item"><span class="legend-dot completed"></span>已完成</span>
        <span class="legend-item"><span class="legend-dot exception"></span>异常</span>
      </div>
      <div class="calendar-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建预约
        </el-button>
      </div>
    </div>

    <div class="calendar-container">
      <div class="calendar-grid">
        <div class="calendar-weekday" v-for="day in weekDays" :key="day">{{ day }}</div>
        <div
          v-for="(day, idx) in calendarDays"
          :key="idx"
          class="calendar-day"
          :class="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'selected': selectedDate === day.dateStr
          }"
          @click="selectDate(day)"
        >
          <div class="day-number">{{ day.day }}</div>
          <div class="day-events">
            <div
              v-for="event in day.events"
              :key="event.id"
              class="day-event"
              :class="event.status"
              @click.stop="showEventDetail(event)"
            >
              <span class="event-time">{{ event.timeSlot }}</span>
              <span class="event-title">{{ event.order?.customer?.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-drawer v-model="showDayDetail" title="当日详情" size="500px">
      <div class="day-detail">
        <div class="detail-header">
          <h3>{{ selectedDate }}</h3>
          <el-tag type="primary">{{ selectedDayEvents.length }} 个预约</el-tag>
        </div>
        <div class="detail-list">
          <div
            v-for="event in selectedDayEvents"
            :key="event.id"
            class="detail-item"
            @click="showEventDetail(event)"
          >
            <div class="detail-time">{{ event.timeSlot }}</div>
            <div class="detail-content">
              <div class="detail-title">
                {{ event.order?.customer?.name }}
                <el-tag :type="appointmentStatusType(event.status)" size="small">
                  {{ appointmentStatusLabel(event.status) }}
                </el-tag>
              </div>
              <div class="detail-desc">{{ event.order?.customer?.address }}</div>
              <div class="detail-meta">
                <span>安装师傅: {{ event.installerName || '未指派' }}</span>
                <span v-if="event.teamSize">团队: {{ event.teamSize }}人</span>
              </div>
              <div class="detail-actions">
                <el-button size="small" type="primary" @click.stop="goToOrder(event.orderId)">查看订单</el-button>
                <el-button v-if="event.status === 'pending'" size="small" type="success" @click.stop="confirmAppointment(event)">确认</el-button>
                <el-button v-if="event.status === 'confirmed'" size="small" type="warning" @click.stop="startAppointment(event)">开始安装</el-button>
                <el-button size="small" @click.stop="rescheduleAppointment(event)">改期</el-button>
              </div>
            </div>
          </div>
          <el-empty v-if="selectedDayEvents.length === 0" description="当日无预约" />
        </div>
      </div>
    </el-drawer>

    <el-drawer v-model="showEventDetailDrawer" title="预约详情" size="500px">
      <div v-if="currentEvent" class="event-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="预约日期">{{ currentEvent.appointmentDate }}</el-descriptions-item>
          <el-descriptions-item label="时间段">{{ currentEvent.timeSlot }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="appointmentStatusType(currentEvent.status)">{{ appointmentStatusLabel(currentEvent.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="客户">{{ currentEvent.order?.customer?.name }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentEvent.order?.customer?.phone }}</el-descriptions-item>
          <el-descriptions-item label="安装地址">{{ currentEvent.order?.customer?.address }}</el-descriptions-item>
          <el-descriptions-item label="安装师傅">{{ currentEvent.installerName || '未指派' }}</el-descriptions-item>
          <el-descriptions-item label="师傅电话">{{ currentEvent.installerPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="团队人数">{{ currentEvent.teamSize || '-' }}人</el-descriptions-item>
          <el-descriptions-item label="客户备注">{{ currentEvent.customerRemark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="内部备注">{{ currentEvent.internalRemark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预检项">{{ currentEvent.preCheckItems || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实际开始">{{ formatDateTime(currentEvent.actualStartTime) }}</el-descriptions-item>
          <el-descriptions-item label="实际结束">{{ formatDateTime(currentEvent.actualEndTime) }}</el-descriptions-item>
        </el-descriptions>

        <div class="event-actions" style="margin-top: 20px;">
          <el-button type="primary" @click="goToOrder(currentEvent.orderId)">查看订单详情</el-button>
          <el-button v-if="currentEvent.status === 'pending'" type="success" @click="confirmAppointment(currentEvent)">确认预约</el-button>
          <el-button v-if="currentEvent.status === 'confirmed'" type="warning" @click="startAppointment(currentEvent)">开始安装</el-button>
          <el-button v-if="currentEvent.status === 'in_progress'" type="success" @click="completeAppointment(currentEvent)">安装完成</el-button>
          <el-button @click="rescheduleAppointment(currentEvent)">改期</el-button>
        </div>

        <div v-if="currentEvent.status === 'completed'" class="next-step">
          <el-alert title="安装已完成，请安排验收" type="success" :closable="false">
            <template #default>
              <el-button type="primary" size="small" @click="goToCreateAcceptance(currentEvent.orderId)">创建验收回单</el-button>
            </template>
          </el-alert>
        </div>
      </div>
    </el-drawer>

    <el-dialog v-model="showCreateDialog" title="新建安装预约" width="500px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="关联订单">
          <el-select v-model="createForm.orderId" placeholder="请选择订单" style="width: 100%;">
            <el-option
              v-for="order in availableOrders"
              :key="order.id"
              :label="`${order.orderNo} - ${order.customer?.name}`"
              :value="order.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预约日期">
          <el-date-picker v-model="createForm.appointmentDate" type="date" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="时间段">
          <el-select v-model="createForm.timeSlot" style="width: 100%;">
            <el-option label="09:00-12:00" value="09:00-12:00" />
            <el-option label="10:00-14:00" value="10:00-14:00" />
            <el-option label="14:00-18:00" value="14:00-18:00" />
            <el-option label="09:00-18:00" value="09:00-18:00" />
          </el-select>
        </el-form-item>
        <el-form-item label="安装师傅">
          <el-input v-model="createForm.installerName" placeholder="请输入安装师傅姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="createForm.installerPhone" placeholder="请输入师傅电话" />
        </el-form-item>
        <el-form-item label="团队人数">
          <el-input-number v-model="createForm.teamSize" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="客户备注">
          <el-input v-model="createForm.customerRemark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="内部备注">
          <el-input v-model="createForm.internalRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createAppointment">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRescheduleDialog" title="改期" width="400px">
      <el-form :model="rescheduleForm" label-width="100px">
        <el-form-item label="新日期">
          <el-date-picker v-model="rescheduleForm.appointmentDate" type="date" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="时间段">
          <el-select v-model="rescheduleForm.timeSlot" style="width: 100%;">
            <el-option label="09:00-12:00" value="09:00-12:00" />
            <el-option label="10:00-14:00" value="10:00-14:00" />
            <el-option label="14:00-18:00" value="14:00-18:00" />
            <el-option label="09:00-18:00" value="09:00-18:00" />
          </el-select>
        </el-form-item>
        <el-form-item label="改期原因">
          <el-input v-model="rescheduleForm.reason" type="textarea" :rows="3" placeholder="请填写改期原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRescheduleDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReschedule">确认改期</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { installationApi, orderApi } from '@/api'
import { appointmentStatusMap, formatDateTime } from '@/utils/constants'

const router = useRouter()
const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const currentDate = ref(dayjs())
const selectedDate = ref('')
const showDayDetail = ref(false)
const showEventDetailDrawer = ref(false)
const showCreateDialog = ref(false)
const showRescheduleDialog = ref(false)
const currentEvent = ref<any>(null)
const events = ref<any[]>([])
const availableOrders = ref<any[]>([])
const reschedulingEvent = ref<any>(null)

const createForm = ref({
  orderId: null as number | null,
  appointmentDate: '',
  timeSlot: '09:00-12:00',
  installerName: '',
  installerPhone: '',
  teamSize: 2,
  customerRemark: '',
  internalRemark: '',
})

const rescheduleForm = ref({
  appointmentDate: '',
  timeSlot: '09:00-12:00',
  reason: '',
})

const currentMonthLabel = computed(() => currentDate.value.format('YYYY年MM月'))

const calendarDays = computed(() => {
  const startOfMonth = currentDate.value.startOf('month')
  const endOfMonth = currentDate.value.endOf('month')
  const startDay = startOfMonth.day()
  const daysInMonth = currentDate.value.daysInMonth()
  
  const days: any[] = []
  
  const prevMonth = currentDate.value.subtract(1, 'month')
  const prevMonthDays = prevMonth.daysInMonth()
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const dateStr = prevMonth.date(day).format('YYYY-MM-DD')
    days.push({
      day,
      dateStr,
      isCurrentMonth: false,
      isToday: false,
      events: getEventsForDate(dateStr),
    })
  }
  
  const today = dayjs().format('YYYY-MM-DD')
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = currentDate.value.date(i).format('YYYY-MM-DD')
    days.push({
      day: i,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === today,
      events: getEventsForDate(dateStr),
    })
  }
  
  const remaining = 42 - days.length
  const nextMonth = currentDate.value.add(1, 'month')
  for (let i = 1; i <= remaining; i++) {
    const dateStr = nextMonth.date(i).format('YYYY-MM-DD')
    days.push({
      day: i,
      dateStr,
      isCurrentMonth: false,
      isToday: false,
      events: getEventsForDate(dateStr),
    })
  }
  
  return days
})

const selectedDayEvents = computed(() => {
  return events.value.filter(e => e.appointmentDate === selectedDate.value)
})

function getEventsForDate(dateStr: string) {
  return events.value.filter(e => e.appointmentDate === dateStr)
}

function changeMonth(delta: number) {
  currentDate.value = currentDate.value.add(delta, 'month')
  loadEvents()
}

function goToToday() {
  currentDate.value = dayjs()
  loadEvents()
}

function selectDate(day: any) {
  selectedDate.value = day.dateStr
  showDayDetail.value = true
}

function showEventDetail(event: any) {
  currentEvent.value = event
  showEventDetailDrawer.value = true
}

function appointmentStatusType(status: string) {
  return appointmentStatusMap[status]?.type || 'info'
}

function appointmentStatusLabel(status: string) {
  return appointmentStatusMap[status]?.label || status
}

async function loadEvents() {
  const start = currentDate.value.startOf('month').format('YYYY-MM-DD')
  const end = currentDate.value.endOf('month').format('YYYY-MM-DD')
  try {
    const res = await installationApi.getCalendar({ startDate: start, endDate: end })
    events.value = res || []
  } catch (e) {}
}

async function loadAvailableOrders() {
  try {
    const res = await orderApi.getList({ pageSize: 100, status: 'delivered' })
    availableOrders.value = res.items || []
  } catch (e) {}
}

async function confirmAppointment(event: any) {
  await installationApi.update(event.id, { status: 'confirmed' })
  ElMessage.success('预约已确认')
  loadEvents()
}

async function startAppointment(event: any) {
  await installationApi.start(event.id)
  ElMessage.success('已开始安装')
  loadEvents()
  currentEvent.value = await installationApi.getDetail(event.id)
}

async function completeAppointment(event: any) {
  await installationApi.complete(event.id)
  ElMessage.success('安装已完成')
  loadEvents()
  currentEvent.value = await installationApi.getDetail(event.id)
}

function rescheduleAppointment(event: any) {
  reschedulingEvent.value = event
  rescheduleForm.value = {
    appointmentDate: event.appointmentDate,
    timeSlot: event.timeSlot,
    reason: '',
  }
  showRescheduleDialog.value = true
  showEventDetailDrawer.value = false
}

async function submitReschedule() {
  if (!reschedulingEvent.value) return
  await installationApi.reschedule(reschedulingEvent.value.id, rescheduleForm.value)
  ElMessage.success('改期成功')
  showRescheduleDialog.value = false
  loadEvents()
}

async function createAppointment() {
  if (!createForm.value.orderId) {
    ElMessage.warning('请选择订单')
    return
  }
  await installationApi.create(createForm.value)
  ElMessage.success('预约创建成功')
  showCreateDialog.value = false
  loadEvents()
}

function goToOrder(orderId: number) {
  router.push(`/orders/${orderId}`)
}

function goToCreateAcceptance(orderId: number) {
  router.push(`/orders/${orderId}?openAcceptance=true&appointmentId=${currentEvent.value.id}`)
}

onMounted(() => {
  loadEvents()
  loadAvailableOrders()
})
</script>

<style scoped>
.calendar-page {
  padding: 20px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 16px;
}

.current-month {
  font-size: 18px;
  font-weight: 600;
}

.calendar-legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;

  &.pending { background: #909399; }
  &.confirmed { background: #409eff; }
  &.progress { background: #e6a23c; }
  &.completed { background: #67c23a; }
  &.exception { background: #f56c6c; }
}

.calendar-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #f0f0f0;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.calendar-weekday {
  background: #fafafa;
  padding: 12px;
  text-align: center;
  font-weight: 500;
  font-size: 14px;
}

.calendar-day {
  background: #fff;
  min-height: 120px;
  padding: 8px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f5f7fa;
  }

  &.other-month {
    background: #fafafa;
    color: #c0c4cc;

    .day-number {
      color: #c0c4cc;
    }
  }

  &.today {
    background: #ecf5ff;

    .day-number {
      background: #409eff;
      color: #fff;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  }

  &.selected {
    border: 2px solid #409eff;
  }
}

.day-number {
  font-weight: 500;
  margin-bottom: 4px;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day-event {
  font-size: 11px;
  padding: 3px 6px;
  border-radius: 3px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &.pending { background: #f4f4f5; color: #909399; }
  &.confirmed { background: #ecf5ff; color: #409eff; }
  &.in_progress { background: #fdf6ec; color: #e6a23c; }
  &.completed { background: #f0f9eb; color: #67c23a; }
  &.rescheduled { background: #fdf6ec; color: #e6a23c; }
  &.cancelled { background: #f4f4f5; color: #909399; }
}

.event-time {
  margin-right: 4px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 18px;
  }
}

.detail-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;

  &:hover {
    background: #f5f7fa;
  }
}

.detail-time {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
  min-width: 100px;
}

.detail-title {
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.detail-meta {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  display: flex;
  gap: 16px;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.event-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.next-step {
  margin-top: 20px;
}
</style>
