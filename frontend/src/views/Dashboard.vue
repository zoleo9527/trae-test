<template>
  <div class="dashboard-page">
    <el-alert :title="roleWelcomeTitle" :type="roleAlertType" show-icon :closable="false" style="margin-bottom: 20px">
      <template #default><p>{{ roleWelcomeDesc }}</p></template>
    </el-alert>

    <el-row :gutter="20" class="stat-cards-row">
      <el-col :span="6">
        <el-card class="stat-card overview" @click="navigateTo('schedule')" v-if="userStore.hasPermission('schedule')">
          <div class="stat-content">
            <div class="stat-icon"><el-icon :size="28"><Calendar /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ scheduleStore.statistics.total }}</div>
              <div class="stat-label">总排班长次</div>
            </div>
          </div>
          <div class="stat-footer">
            <span class="stat-trend up"><el-icon><Top /></el-icon>本周{{ weekScheduleCount }}次</span>
            <span class="stat-more">查看详情 →</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card pending" @click="navigateTo('checkin')">
          <div class="stat-content">
            <div class="stat-icon"><el-icon :size="28"><Clock /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ roleFilteredPending }}</div>
              <div class="stat-label">{{ rolePendingLabel }}</div>
            </div>
          </div>
          <div class="stat-footer">
            <span class="stat-trend warning" v-if="scheduleStore.overdueSchedules.length > 0">
              <el-icon><Warning /></el-icon>{{ scheduleStore.overdueSchedules.length }}个逾期
            </span>
            <span class="stat-more">立即处理 →</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card feedback" @click="navigateTo('feedback')">
          <div class="stat-content">
            <div class="stat-icon"><el-icon :size="28"><ChatDotRound /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ roleFilteredFeedbackPending }}</div>
              <div class="stat-label">{{ roleFeedbackLabel }}</div>
            </div>
          </div>
          <div class="stat-footer">
            <span class="stat-trend warning" v-if="roleFilteredOverdue > 0">
              <el-icon><Warning /></el-icon>{{ roleFilteredOverdue }}个超时
            </span>
            <span class="stat-more">去处理 →</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card volunteer" @click="navigateTo('volunteers')" v-if="userStore.hasPermission('volunteers')">
          <div class="stat-content">
            <div class="stat-icon"><el-icon :size="28"><User /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ activeVolunteerCount }}</div>
              <div class="stat-label">活跃志愿者</div>
            </div>
          </div>
          <div class="stat-footer">
            <span class="stat-trend up"><el-icon><Top /></el-icon>累计{{ totalServiceHours }}小时</span>
            <span class="stat-more">查看更多 →</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="14">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>排班统计趋势</span>
              <el-radio-group v-model="chartPeriod" size="small">
                <el-radio-button value="week">本周</el-radio-button>
                <el-radio-button value="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="chartTrend" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span>待办事项 ({{ todoList.length }})</span>
              <el-tag type="danger" size="small">需处理</el-tag>
            </div>
          </template>
          <div class="todo-list">
            <div v-for="(item, index) in todoList" :key="index" class="todo-item" @click="handleTodoClick(item)">
              <div class="todo-icon" :class="item.type"><el-icon><component :is="item.icon" /></el-icon></div>
              <div class="todo-content">
                <div class="todo-title">{{ item.title }}</div>
                <div class="todo-desc">{{ item.desc }}</div>
              </div>
              <div class="todo-meta"><el-tag :type="item.priority" size="small">{{ item.time }}</el-tag></div>
            </div>
            <div v-if="todoList.length === 0" class="empty-todo">
              <el-icon :size="48" color="#909399"><CircleCheck /></el-icon>
              <p>暂无待办事项</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card class="timeline-card">
          <template #header>
            <div class="card-header">
              <span>最近动态</span>
              <el-tag type="info" size="small">共{{ mergedActivities.length }}条</el-tag>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item v-for="(activity, index) in mergedActivities" :key="index" :type="activity.type" :timestamp="activity.time">
              <div class="activity-item">
                <span class="activity-user">{{ activity.user }}</span>
                <span class="activity-action">{{ activity.action }}</span>
                <span class="activity-target">{{ activity.target }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="feedback-card">
          <template #header>
            <div class="card-header">
              <span>反馈类型分布</span>
              <el-tag type="info">共{{ feedbackStore.statistics.total }}条</el-tag>
            </div>
          </template>
          <div ref="chartPie" class="chart-container pie"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { useScheduleStore } from '@/stores/schedule'
import { useFeedbackStore } from '@/stores/feedback'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const scheduleStore = useScheduleStore()
const feedbackStore = useFeedbackStore()
const userStore = useUserStore()

const chartPeriod = ref('week')
const chartTrend = ref(null)
const chartPie = ref(null)
let trendChart = null
let pieChart = null

const roleAlertType = computed(() => {
  const types = { director: 'success', coordinator: 'primary', operator: 'warning' }
  return types[userStore.currentRole] || 'info'
})

const roleWelcomeTitle = computed(() => {
  const titles = {
    director: '馆长视角 - 全局运营总览',
    coordinator: '志愿者协调视角 - 排班与签到管理',
    operator: '活动运营视角 - 反馈处理中心'
  }
  return titles[userStore.currentRole] || '欢迎使用城市书房志愿者系统'
})

const roleWelcomeDesc = computed(() => {
  const descs = {
    director: '全局查看整体运营数据，监控排班签到情况和反馈处理进度，统筹协调各岗位工作',
    coordinator: '管理志愿者排班，处理签到核销和缺勤记录，协调解决排班问题',
    operator: '处理设备报修、环境问题等反馈事项，跟踪处理进度，确保问题及时解决'
  }
  return descs[userStore.currentRole] || ''
})

const activeVolunteerCount = computed(() => {
  return scheduleStore.volunteerStats.activeVolunteers
})

const totalServiceHours = computed(() => {
  return scheduleStore.volunteerStats.totalServiceHours
})

const weekScheduleCount = computed(() => {
  const startOfWeek = dayjs().startOf('week')
  const endOfWeek = dayjs().endOf('week')
  return scheduleStore.schedules.filter(s => {
    const d = dayjs(s.date)
    return d.isAfter(startOfWeek.subtract(1, 'day')) && d.isBefore(endOfWeek.add(1, 'day'))
  }).length
})

const roleFilteredPending = computed(() => {
  const role = userStore.currentRole
  if (role === 'director') return scheduleStore.statistics.pending
  if (role === 'coordinator') return scheduleStore.statistics.pending
  return scheduleStore.todaySchedules.filter(s => s.status === 'pending').length
})

const rolePendingLabel = computed(() => {
  return userStore.currentRole === 'operator' ? '今日待签到' : '待签到'
})

const roleFilteredFeedbackPending = computed(() => {
  const role = userStore.currentRole
  if (role === 'director') return feedbackStore.statistics.pending + feedbackStore.statistics.processing
  return feedbackStore.feedbacks.filter(f => f.status !== 'resolved' && f.currentHandler === role).length
})

const roleFeedbackLabel = computed(() => {
  return userStore.currentRole === 'director' ? '未关闭反馈' : '待我处理'
})

const roleFilteredOverdue = computed(() => {
  const role = userStore.currentRole
  if (role === 'director') return feedbackStore.statistics.overdue
  return feedbackStore.feedbacks.filter(f => {
    if (f.status === 'resolved') return false
    if (f.currentHandler !== role) return false
    return dayjs().diff(dayjs(f.createdAt), 'hour') > 24
  }).length
})

const todoList = computed(() => {
  const todos = []
  const role = userStore.currentRole

  if (role === 'director' || role === 'coordinator') {
    if (scheduleStore.overdueSchedules.length > 0) {
      todos.push({
        type: 'danger', icon: 'Warning', priority: 'danger', time: '紧急',
        title: `${scheduleStore.overdueSchedules.length}个排班逾期未处理`,
        desc: '请及时标记缺勤或补签到',
        action: 'checkin'
      })
    }
  }

  const overdueFeedbacks = role === 'director'
    ? feedbackStore.feedbacks.filter(f => f.status !== 'resolved' && dayjs().diff(dayjs(f.createdAt), 'hour') > 24)
    : feedbackStore.feedbacks.filter(f => f.status !== 'resolved' && f.currentHandler === role && dayjs().diff(dayjs(f.createdAt), 'hour') > 24)

  if (overdueFeedbacks.length > 0) {
    todos.push({
      type: 'warning', icon: 'ChatDotRound', priority: 'warning', time: '超时',
      title: `${overdueFeedbacks.length}条反馈超时未处理`,
      desc: '请优先处理超时反馈',
      action: 'feedback'
    })
  }

  const myPending = feedbackStore.feedbacks.filter(f =>
    f.status !== 'resolved' && f.currentHandler === role
  )
  if (myPending.length > 0) {
    todos.push({
      type: 'info', icon: 'Bell', priority: 'primary', time: `${myPending.length}条`,
      title: '待我处理的反馈',
      desc: `有${myPending.length}条反馈需要您处理`,
      action: 'feedback'
    })
  }

  if (role === 'coordinator') {
    const makeupPending = scheduleStore.getMakeupByHandler(role)
    if (makeupPending.length > 0) {
      todos.push({
        type: 'warning', icon: 'RefreshRight', priority: 'warning', time: `${makeupPending.length}人`,
        title: '待我安排补班',
        desc: `有${makeupPending.length}位志愿者需要您安排补班`,
        action: 'schedule'
      })
    }
  }

  if (role === 'director') {
    const makeupPending = scheduleStore.makeupPending
    if (makeupPending.length > 0) {
      const totalByHandler = {}
      makeupPending.forEach(s => {
        const handler = s.makeupAssignedTo || 'coordinator'
        totalByHandler[handler] = (totalByHandler[handler] || 0) + 1
      })
      const handlerLabels = { director: '馆长', coordinator: '志愿者协调', operator: '活动运营' }
      const descText = Object.entries(totalByHandler)
        .map(([h, c]) => `${handlerLabels[h] || h}: ${c}人`)
        .join('，')
      todos.push({
        type: 'warning', icon: 'RefreshRight', priority: 'warning', time: `${makeupPending.length}人`,
        title: '待安排补班（全局）',
        desc: descText,
        action: 'schedule'
      })
    }
  }

  return todos
})

const mergedActivities = computed(() => {
  const scheduleEvents = scheduleStore.getRecentEvents(5)
  const feedbackEvents = feedbackStore.getRecentEvents(5)
  return [...scheduleEvents, ...feedbackEvents]
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
    .slice(0, 8)
})

function navigateTo(page) {
  router.push(`/${page}`)
}

function handleTodoClick(item) {
  if (item.action) navigateTo(item.action)
}

function buildTrendOption() {
  const trend = chartPeriod.value === 'week' ? scheduleStore.weeklyTrend : scheduleStore.monthlyTrend
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['排班长次', '签到人次', '完成班次'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: trend.labels },
    yAxis: { type: 'value' },
    series: [
      { name: '排班长次', type: 'line', smooth: true, data: trend.days.map(d => d.total), areaStyle: { opacity: 0.3 } },
      { name: '签到人次', type: 'line', smooth: true, data: trend.days.map(d => d.checkedIn), areaStyle: { opacity: 0.3 } },
      { name: '完成班次', type: 'line', smooth: true, data: trend.days.map(d => d.completed), areaStyle: { opacity: 0.3 } }
    ]
  }
}

function initTrendChart() {
  if (!chartTrend.value) return
  trendChart = echarts.init(chartTrend.value)
  trendChart.setOption(buildTrendOption())
}

function buildPieOption() {
  const typeColors = { '设备问题': '#F56C6C', '环境问题': '#E6A23C', '排班问题': '#409EFF', '读者反馈': '#67C23A', '其他': '#909399' }
  const dist = feedbackStore.typeDistribution
  return {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: dist.map(d => ({ value: d.value, name: d.name, itemStyle: { color: typeColors[d.name] || '#909399' } }))
    }]
  }
}

function initPieChart() {
  if (!chartPie.value) return
  pieChart = echarts.init(chartPie.value)
  pieChart.setOption(buildPieOption())
}

onMounted(() => {
  nextTick(() => {
    initTrendChart()
    initPieChart()
  })
})

watch(chartPeriod, () => {
  if (trendChart) {
    trendChart.setOption(buildTrendOption())
  }
})

watch(() => scheduleStore.schedules, () => {
  if (trendChart) trendChart.setOption(buildTrendOption())
}, { deep: true })

watch(() => feedbackStore.feedbacks, () => {
  if (pieChart) pieChart.setOption(buildPieOption())
}, { deep: true })
</script>

<style scoped>
.dashboard-page { display: flex; flex-direction: column; }
.stat-cards-row { margin-bottom: 20px; }
.stat-card { border-radius: 8px; cursor: pointer; transition: all 0.3s; }
.stat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.stat-card.overview { border-left: 4px solid #409EFF; }
.stat-card.pending { border-left: 4px solid #E6A23C; }
.stat-card.feedback { border-left: 4px solid #F56C6C; }
.stat-card.volunteer { border-left: 4px solid #67C23A; }
.stat-content { display: flex; align-items: center; gap: 16px; }
.stat-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-info { flex: 1; }
.stat-value { font-size: 28px; font-weight: 600; color: #303133; }
.stat-label { font-size: 14px; color: #909399; margin-top: 4px; }
.stat-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.stat-trend { display: flex; align-items: center; gap: 4px; font-size: 12px; }
.stat-trend.up { color: #67C23A; }
.stat-trend.warning { color: #E6A23C; }
.stat-more { font-size: 12px; color: #409EFF; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.chart-container { height: 300px; }
.chart-container.pie { height: 280px; }
.todo-list { min-height: 280px; }
.todo-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; margin-bottom: 8px; background: #f5f7fa; cursor: pointer; transition: all 0.3s; }
.todo-item:hover { background: #ecf5ff; }
.todo-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; }
.todo-icon.danger { background: #F56C6C; }
.todo-icon.warning { background: #E6A23C; }
.todo-icon.info { background: #409EFF; }
.todo-content { flex: 1; }
.todo-title { font-weight: 500; color: #303133; margin-bottom: 4px; }
.todo-desc { font-size: 12px; color: #909399; }
.empty-todo { text-align: center; padding: 40px 20px; color: #909399; }
.empty-todo p { margin-top: 12px; }
.activity-item { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.activity-user { font-weight: 500; color: #303133; }
.activity-action { color: #606266; }
.activity-target { color: #409EFF; }
</style>
