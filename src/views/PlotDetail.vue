<template>
  <div class="plot-detail">
    <div class="flex-between mb-20">
      <div class="flex-center gap-16">
        <button class="btn btn-default" @click="goBack">← 返回</button>
        <h1 class="page-title" style="margin: 0">{{ plot?.name }}</h1>
        <span :class="['status-tag', `status-${plot?.status}`]">
          {{ getStatusText(plot?.status) }}
        </span>
      </div>
    </div>
    
    <div class="detail-grid">
      <div class="card">
        <h2 class="section-title">地块信息</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">面积</span>
            <span class="info-value">{{ plot?.area }} 亩</span>
          </div>
          <div class="info-item">
            <span class="info-label">位置</span>
            <span class="info-value">{{ plot?.location }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">农户</span>
            <span class="info-value">{{ plot?.farmer }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">联系电话</span>
            <span class="info-value">{{ plot?.phone }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">作物</span>
            <span class="info-value">{{ plot?.crop }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ plot?.createTime }}</span>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h2 class="section-title">作业任务</h2>
        <div class="task-list">
          <div 
            v-for="task in plotTasks" 
            :key="task.id" 
            class="task-item"
            @click="goToTask(task.id)"
          >
            <div class="task-header">
              <span class="task-type">{{ task.type }}</span>
              <span :class="['status-tag', `status-${task.status}`]">
                {{ getStatusText(task.status) }}
              </span>
            </div>
            <div class="task-info">
              <span>机手：{{ task.operatorName }}</span>
              <span>计划：{{ task.planDate }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: task.progress + '%' }"></div>
            </div>
            <div class="progress-info">
              <span>进度 {{ task.progress }}%</span>
              <span>耗油 {{ task.fuelUsed }}L</span>
            </div>
          </div>
          <div v-if="plotTasks.length === 0" class="empty-state">
            暂无作业任务
          </div>
        </div>
      </div>
      
      <div class="card">
        <h2 class="section-title">补贴申请</h2>
        <div class="subsidy-list">
          <div v-for="subsidy in plotSubsidies" :key="subsidy.id" class="subsidy-item">
            <div class="subsidy-header">
              <span class="subsidy-type">{{ subsidy.subsidyType }}</span>
              <span :class="['status-tag', `status-${subsidy.status}`]">
                {{ getSubsidyStatusText(subsidy.status) }}
              </span>
            </div>
            <div class="subsidy-amount">¥ {{ subsidy.amount }}</div>
            <div class="subsidy-meta">
              <span>申请：{{ subsidy.applyDate }}</span>
              <span v-if="subsidy.approveDate">审批：{{ subsidy.approveDate }}</span>
            </div>
            <div class="subsidy-remark">{{ subsidy.remark }}</div>
          </div>
          <div v-if="plotSubsidies.length === 0" class="empty-state">
            暂无补贴申请
          </div>
        </div>
      </div>
      
      <div class="card">
        <h2 class="section-title">回访评价</h2>
        <div class="review-list">
          <div v-for="review in plotReviews" :key="review.id" class="review-item">
            <div class="review-header">
              <span class="reviewer">{{ review.reviewer }}</span>
              <div class="rating">
                <span v-for="i in 5" :key="i" :class="['star', i <= review.rating ? 'active' : '']">★</span>
              </div>
            </div>
            <div class="review-content">{{ review.content }}</div>
            <div class="review-footer">
              <span>{{ review.reviewDate }}</span>
            </div>
            <div v-if="review.reply" class="reply-box">
              <div class="reply-label">回复：</div>
              <div class="reply-content">{{ review.reply }}</div>
            </div>
          </div>
          <div v-if="plotReviews.length === 0" class="empty-state">
            暂无评价
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePlotStore } from '../stores/plot'
import { useTaskStore } from '../stores/task'
import { useSubsidyStore } from '../stores/subsidy'
import { useReviewStore } from '../stores/review'

const router = useRouter()
const route = useRoute()
const plotStore = usePlotStore()
const taskStore = useTaskStore()
const subsidyStore = useSubsidyStore()
const reviewStore = useReviewStore()

const plotId = route.params.id

const plot = computed(() => plotStore.plots.find(p => p.id === plotId))
const plotTasks = computed(() => taskStore.tasks.filter(t => t.plotId === plotId))
const plotSubsidies = computed(() => subsidyStore.records.filter(r => r.plotId === plotId))
const plotReviews = computed(() => reviewStore.reviews.filter(r => r.plotId === plotId))

function getStatusText(status) {
  const map = { pending: '待执行', progress: '进行中', completed: '已完成', delayed: '已延误' }
  return map[status] || status
}

function getSubsidyStatusText(status) {
  const map = { pending: '待审核', approved: '已通过', rejected: '已驳回' }
  return map[status] || status
}

function goBack() {
  router.back()
}

function goToTask(id) {
  router.push(`/tasks/${id}`)
}

onMounted(async () => {
  await plotStore.loadPlots()
  await taskStore.loadTasks()
  await subsidyStore.loadRecords()
  await reviewStore.loadReviews()
})
</script>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #999;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.task-list,
.subsidy-list,
.review-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  background: #f0f7ff;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-type {
  font-weight: 500;
  color: #333;
}

.task-info {
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.progress-bar {
  height: 6px;
  background: #e8e8e8;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  transition: width 0.3s;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.subsidy-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.subsidy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.subsidy-type {
  font-weight: 500;
  color: #333;
}

.subsidy-amount {
  font-size: 20px;
  font-weight: 600;
  color: #52c41a;
  margin-bottom: 8px;
}

.subsidy-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.subsidy-remark {
  font-size: 12px;
  color: #666;
}

.review-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reviewer {
  font-weight: 500;
  color: #333;
}

.star {
  color: #e8e8e8;
  font-size: 14px;
}

.star.active {
  color: #faad14;
}

.review-content {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 8px;
}

.review-footer {
  font-size: 11px;
  color: #999;
}

.reply-box {
  margin-top: 8px;
  padding: 8px 12px;
  background: #e6f7ff;
  border-radius: 4px;
}

.reply-label {
  font-size: 11px;
  color: #1890ff;
  margin-bottom: 4px;
}

.reply-content {
  font-size: 12px;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 13px;
}
</style>
