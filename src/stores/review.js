import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '../utils/storage'
import { addHistoryLog } from './history'
import { useAlertStore } from './alert'

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
      content: `农户提交评价：${review.rating}星 - ${review.content}`,
      operatorId: 'system',
      operatorName: '系统'
    })

    if (review.rating <= 3) {
      const alertStore = useAlertStore()
      await alertStore.loadAlerts()
      
      const existingAlert = alertStore.alerts.find(
        a => a.type === 'bad_review' && a.relatedId === newReview.id
      )
      if (!existingAlert) {
        await alertStore.addAlert({
          type: 'bad_review',
          title: '收到差评回访',
          content: `${review.plotName}收到${review.rating}星评价，内容：${review.content}，请及时回访处理`,
          relatedId: newReview.id,
          relatedType: 'review',
          assignee: 'u1'
        })
        
        await addHistoryLog({
          type: 'alert',
          action: 'create',
          targetId: `bad-review-${newReview.id}`,
          targetName: '差评回访提醒',
          content: `系统自动生成差评提醒：${review.plotName}，评分${review.rating}星`,
          operatorId: 'system',
          operatorName: '系统'
        })
      }
    }

    return newReview
  }

  async function replyReview(id, reply, operator) {
    const index = reviews.value.findIndex(r => r.id === id)
    if (index !== -1) {
      const oldReview = reviews.value[index]
      reviews.value[index] = {
        ...oldReview,
        reply,
        replyBy: operator.id,
        replyDate: new Date().toISOString().split('T')[0]
      }
      await storage.set('reviews', reviews.value)

      await addHistoryLog({
        type: 'review',
        action: 'reply',
        targetId: id,
        targetName: `${oldReview.plotName}评价回复`,
        content: `【${operator.name}】回复评价：${reply}`,
        operatorId: operator.id,
        operatorName: operator.name
      })

      if (oldReview.rating <= 3) {
        const alertStore = useAlertStore()
        await alertStore.loadAlerts()
        const relatedAlerts = alertStore.alerts.filter(
          a => a.type === 'bad_review' && a.relatedId === id && a.status !== 'handled'
        )
        for (const alert of relatedAlerts) {
          await alertStore.markAsHandled(alert.id, operator, '已回复评价')
        }
      }
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
    const pendingReply = reviews.value.filter(r => !r.reply).length

    return { total, avgRating, replied, pendingReply }
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
