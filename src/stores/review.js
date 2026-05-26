import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '../utils/storage'
import { addHistoryLog } from './history'

export const useReviewStore = defineStore('review', () => {
  const reviews = ref([])
  const loading = ref(false)

  async function loadReviews() {
    loading.value = true
    const data = await storage.get('reviews')
    if (data) {
      reviews.value = data
    }
    loading.value = false
  }

  async function addReview(review) {
    const newReview = {
      id: 'r' + Date.now(),
      ...review,
      reviewDate: new Date().toISOString().split('T')[0],
      reply: null,
      replyBy: null,
      replyDate: null
    }
    reviews.value.push(newReview)
    await storage.set('reviews', reviews.value)

    await addHistoryLog({
      type: 'review',
      action: 'create',
      targetId: newReview.id,
      targetName: `${review.plotName}评价`,
      content: `农户提交评价：${review.rating}星`,
      operatorId: 'system',
      operatorName: '系统'
    })

    return newReview
  }

  async function replyReview(id, reply, operator) {
    const index = reviews.value.findIndex(r => r.id === id)
    if (index !== -1) {
      reviews.value[index] = {
        ...reviews.value[index],
        reply,
        replyBy: operator.id,
        replyDate: new Date().toISOString().split('T')[0]
      }
      await storage.set('reviews', reviews.value)
    }
  }

  function getReviewsByPlotId(plotId) {
    return computed(() => reviews.value.filter(r => r.plotId === plotId))
  }

  function getReviewsByTaskId(taskId) {
    return computed(() => reviews.value.filter(r => r.taskId === taskId))
  }

  const stats = computed(() => {
    const total = reviews.value.length
    const avgRating = total > 0 
      ? (reviews.value.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
      : 0
    const replied = reviews.value.filter(r => r.reply).length

    return { total, avgRating, replied }
  })

  return {
    reviews,
    loading,
    loadReviews,
    addReview,
    replyReview,
    getReviewsByPlotId,
    getReviewsByTaskId,
    stats
  }
})
