import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { mockFeedbacks } from '@/mock/data'

export const useFeedbackStore = defineStore('feedback', () => {
  const feedbacks = ref([...mockFeedbacks])

  const pendingFeedbacks = computed(() => {
    return feedbacks.value.filter(f => f.status === 'pending')
  })

  const processingFeedbacks = computed(() => {
    return feedbacks.value.filter(f => f.status === 'processing')
  })

  const resolvedFeedbacks = computed(() => {
    return feedbacks.value.filter(f => f.status === 'resolved')
  })

  const statistics = computed(() => {
    const total = feedbacks.value.length
    const pending = pendingFeedbacks.value.length
    const processing = processingFeedbacks.value.length
    const resolved = resolvedFeedbacks.value.length
    const overdue = feedbacks.value.filter(f => {
      if (f.status === 'resolved') return false
      const created = dayjs(f.createdAt)
      return dayjs().diff(created, 'hour') > 24
    }).length
    return { total, pending, processing, resolved, overdue }
  })

  const getFeedbacksByType = (type) => {
    return feedbacks.value.filter(f => f.type === type)
  }

  const getFeedbacksBySchedule = (scheduleId) => {
    return feedbacks.value.filter(f => f.scheduleId === scheduleId)
  }

  function addFeedback(feedback) {
    const newFeedback = {
      id: Date.now(),
      ...feedback,
      status: 'pending',
      currentHandler: feedback.initialHandler || 'coordinator',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      history: [{
        action: '创建',
        operator: feedback.creatorName || '系统',
        remark: feedback.content.substring(0, 50),
        time: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }]
    }
    feedbacks.value.push(newFeedback)
    return newFeedback
  }

  function updateFeedback(id, updates) {
    const index = feedbacks.value.findIndex(f => f.id === id)
    if (index !== -1) {
      feedbacks.value[index] = {
        ...feedbacks.value[index],
        ...updates,
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
      return true
    }
    return false
  }

  function transferFeedback(id, newHandler, operatorName, transferRemark = '') {
    const index = feedbacks.value.findIndex(f => f.id === id)
    if (index !== -1) {
      feedbacks.value[index].currentHandler = newHandler
      feedbacks.value[index].status = 'processing'
      feedbacks.value[index].updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
      feedbacks.value[index].history.push({
        action: '转派',
        operator: operatorName,
        target: newHandler,
        remark: transferRemark,
        time: dayjs().format('YYYY-MM-DD HH:mm:ss')
      })
      return true
    }
    return false
  }

  function resolveFeedback(id, resolution, operatorName) {
    const index = feedbacks.value.findIndex(f => f.id === id)
    if (index !== -1) {
      feedbacks.value[index].status = 'resolved'
      feedbacks.value[index].resolution = resolution
      feedbacks.value[index].updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
      feedbacks.value[index].history.push({
        action: '解决',
        operator: operatorName,
        remark: resolution,
        time: dayjs().format('YYYY-MM-DD HH:mm:ss')
      })
      return true
    }
    return false
  }

  function addRemark(id, remark, operatorName) {
    const index = feedbacks.value.findIndex(f => f.id === id)
    if (index !== -1) {
      feedbacks.value[index].history.push({
        action: '备注',
        operator: operatorName,
        remark: remark,
        time: dayjs().format('YYYY-MM-DD HH:mm:ss')
      })
      feedbacks.value[index].updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')
      return true
    }
    return false
  }

  return {
    feedbacks,
    pendingFeedbacks,
    processingFeedbacks,
    resolvedFeedbacks,
    statistics,
    getFeedbacksByType,
    getFeedbacksBySchedule,
    addFeedback,
    updateFeedback,
    transferFeedback,
    resolveFeedback,
    addRemark
  }
})
