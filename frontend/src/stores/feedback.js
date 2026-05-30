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

  const typeDistribution = computed(() => {
    const map = {}
    feedbacks.value.forEach(f => {
      map[f.type] = (map[f.type] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  })

  const getFeedbacksByType = (type) => {
    return feedbacks.value.filter(f => f.type === type)
  }

  const getFeedbacksBySchedule = (scheduleId) => {
    return feedbacks.value.filter(f => f.scheduleId === scheduleId)
  }

  const getFeedbacksByHandler = (role) => {
    return feedbacks.value.filter(f => f.currentHandler === role)
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

  function getRecentEvents(limit = 10) {
    const events = []
    feedbacks.value.forEach(f => {
      f.history.forEach(h => {
        events.push({
          user: h.operator,
          action: actionLabel(h.action),
          target: f.title,
          type: actionTimelineType(h.action),
          time: h.time,
          sortKey: h.time
        })
      })
    })
    return events.sort((a, b) => b.sortKey.localeCompare(a.sortKey)).slice(0, limit)
  }

  function actionLabel(action) {
    const map = { '创建': '提交了反馈', '转派': '转派了反馈', '解决': '解决了反馈', '备注': '备注了反馈' }
    return map[action] || action
  }

  function actionTimelineType(action) {
    const map = { '创建': 'primary', '转派': 'warning', '解决': 'success', '备注': 'info' }
    return map[action] || ''
  }

  return {
    feedbacks,
    pendingFeedbacks,
    processingFeedbacks,
    resolvedFeedbacks,
    statistics,
    typeDistribution,
    getFeedbacksByType,
    getFeedbacksBySchedule,
    getFeedbacksByHandler,
    addFeedback,
    updateFeedback,
    transferFeedback,
    resolveFeedback,
    addRemark,
    getRecentEvents
  }
})
