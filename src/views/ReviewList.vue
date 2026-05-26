<template>
  <div class="review-list">
    <h1 class="page-title">回访评价</h1>
    
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div>
          <div class="stat-value">{{ reviewStats.total }}</div>
          <div class="stat-label">评价总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div>
          <div class="stat-value">{{ reviewStats.avgRating }}</div>
          <div class="stat-label">平均评分</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div>
          <div class="stat-value">{{ reviewStats.replied }}</div>
          <div class="stat-label">已回复</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="reviews-container">
        <div v-for="review in reviews" :key="review.id" class="review-card">
          <div class="review-header">
            <div class="reviewer-info">
              <div class="avatar">{{ review.reviewer.charAt(0) }}</div>
              <div>
                <div class="reviewer-name">{{ review.reviewer }}</div>
                <div class="review-plot">{{ getPlotName(review.plotId) }}</div>
              </div>
            </div>
            <div class="rating">
              <span v-for="i in 5" :key="i" :class="['star', i <= review.rating ? 'active' : '']">★</span>
            </div>
          </div>
          
          <div class="review-content">{{ review.content }}</div>
          
          <div class="review-footer">
            <span class="review-date">{{ review.reviewDate }}</span>
          </div>
          
          <div v-if="review.reply" class="reply-box">
            <div class="reply-header">
              <span class="reply-label">💬 回复</span>
              <span class="reply-date">{{ review.replyDate }}</span>
            </div>
            <div class="reply-content">{{ review.reply }}</div>
          </div>
          
          <div v-if="!review.reply && currentUser.role !== 'operator'" class="reply-form">
            <textarea 
              v-model="replyText[review.id]" 
              class="form-textarea" 
              placeholder="输入回复内容..."
            ></textarea>
            <button class="btn btn-primary btn-sm" @click="handleReply(review.id)">发送回复</button>
          </div>
        </div>
        
        <div v-if="reviews.length === 0" class="empty-state">
          暂无评价
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useUserStore } from '../stores/user'
import { useReviewStore } from '../stores/review'
import { usePlotStore } from '../stores/plot'
import { useToastStore } from '../stores/toast'

const userStore = useUserStore()
const reviewStore = useReviewStore()
const plotStore = usePlotStore()
const toastStore = useToastStore()

const currentUser = computed(() => userStore.currentUser)
const reviews = computed(() => reviewStore.reviews)
const reviewStats = computed(() => reviewStore.stats)
const replyText = reactive({})

function getPlotName(plotId) {
  const plot = plotStore.plots.find(p => p.id === plotId)
  return plot ? plot.name : ''
}

async function handleReply(reviewId) {
  if (!replyText[reviewId]?.trim()) {
    toastStore.error('请输入回复内容')
    return
  }
  
  await reviewStore.replyReview(reviewId, replyText[reviewId], currentUser.value)
  toastStore.success('回复成功')
  replyText[reviewId] = ''
}

onMounted(async () => {
  await reviewStore.loadReviews()
  await plotStore.loadPlots()
})
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.reviews-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-card {
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 500;
}

.reviewer-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.review-plot {
  font-size: 12px;
  color: #999;
}

.star {
  color: #e8e8e8;
  font-size: 16px;
}

.star.active {
  color: #faad14;
}

.review-content {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  margin-bottom: 12px;
}

.review-footer {
  font-size: 12px;
  color: #999;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e8e8e8;
  margin-bottom: 12px;
}

.reply-box {
  padding: 12px 16px;
  background: #e6f7ff;
  border-radius: 6px;
  border-left: 3px solid #1890ff;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reply-label {
  font-size: 12px;
  font-weight: 500;
  color: #1890ff;
}

.reply-date {
  font-size: 11px;
  color: #999;
}

.reply-content {
  font-size: 13px;
  color: #333;
  line-height: 1.6;
}

.reply-form {
  margin-top: 12px;
}

.reply-form .form-textarea {
  margin-bottom: 12px;
}

.btn-sm {
  padding: 6px 16px;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
}
</style>
