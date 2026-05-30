import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { mockSchedules } from '@/mock/data'

export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref([...mockSchedules])

  const getSchedulesByDate = (date) => {
    const targetDate = dayjs(date).format('YYYY-MM-DD')
    return schedules.value.filter(s => s.date === targetDate)
  }

  const getSchedulesByVolunteer = (volunteerId) => {
    return schedules.value.filter(s => s.volunteerId === volunteerId)
  }

  const getSchedulesByStatus = (status) => {
    return schedules.value.filter(s => s.status === status)
  }

  const todaySchedules = computed(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return schedules.value.filter(s => s.date === today)
  })

  const pendingSchedules = computed(() => {
    return schedules.value.filter(s => s.status === 'pending')
  })

  const overdueSchedules = computed(() => {
    const now = dayjs()
    return schedules.value.filter(s => {
      if (s.status !== 'pending') return false
      const scheduleEnd = dayjs(`${s.date} ${s.endTime}`)
      return now.isAfter(scheduleEnd)
    })
  })

  const statistics = computed(() => {
    const total = schedules.value.length
    const checkedIn = schedules.value.filter(s => s.status === 'checkedIn').length
    const missed = schedules.value.filter(s => s.status === 'missed').length
    const pending = schedules.value.filter(s => s.status === 'pending').length
    const completed = schedules.value.filter(s => s.status === 'completed').length
    return { total, checkedIn, missed, pending, completed }
  })

  const volunteerStats = computed(() => {
    const volunteerMap = {}
    schedules.value.forEach(s => {
      if (s.status !== 'pending') {
        if (!volunteerMap[s.volunteerId]) {
          volunteerMap[s.volunteerId] = {
            id: s.volunteerId,
            name: s.volunteerName,
            hours: 0,
            shiftCount: 0,
            status: 'active'
          }
        }
        if (s.status === 'completed' || s.status === 'checkedIn') {
          const [startH, startM] = s.startTime.split(':').map(Number)
          const [endH, endM] = s.endTime.split(':').map(Number)
          const durationHours = (endH - startH) + (endM - startM) / 60
          volunteerMap[s.volunteerId].hours += durationHours
          volunteerMap[s.volunteerId].shiftCount += 1
        }
      }
    })
    const list = Object.values(volunteerMap)
    return {
      activeVolunteers: list.length,
      totalServiceHours: list.reduce((sum, v) => sum + Math.round(v.hours), 0),
      list
    }
  })

  const makeupPending = computed(() => {
    return schedules.value.filter(s => s.needMakeup && s.makeupStatus === 'pending')
  })

  const getMakeupByHandler = (role) => {
    return schedules.value.filter(s => s.needMakeup && s.makeupStatus === 'pending' && s.makeupAssignedTo === role)
  }

  const OPERATOR_VISIBLE_TYPES = ['活动协助', '儿童阅读']

  function isOperatorSchedule(schedule) {
    return OPERATOR_VISIBLE_TYPES.includes(schedule.type)
  }

  function filterByRole(list, role) {
    if (role === 'operator') {
      return list.filter(s => isOperatorSchedule(s))
    }
    return list
  }

  const operatorTodaySchedules = computed(() => {
    return todaySchedules.value.filter(s => isOperatorSchedule(s))
  })

  const operatorPendingCount = computed(() => {
    return operatorTodaySchedules.value.filter(s => s.status === 'pending').length
  })

  const operatorOverdueSchedules = computed(() => {
    return overdueSchedules.value.filter(s => isOperatorSchedule(s))
  })

  const roleFilteredStatistics = computed(() => {
    return (role) => {
      if (role === 'operator') {
        const operatorSchedules = schedules.value.filter(s => isOperatorSchedule(s))
        return {
          total: operatorSchedules.length,
          checkedIn: operatorSchedules.filter(s => s.status === 'checkedIn').length,
          missed: operatorSchedules.filter(s => s.status === 'missed').length,
          pending: operatorSchedules.filter(s => s.status === 'pending').length,
          completed: operatorSchedules.filter(s => s.status === 'completed').length
        }
      }
      return statistics.value
    }
  })

  const weeklyTrend = computed(() => {
    const days = []
    const labels = []
    for (let i = 6; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day')
      const dateStr = d.format('YYYY-MM-DD')
      labels.push(d.format('ddd'))
      const daySchedules = schedules.value.filter(s => s.date === dateStr)
      days.push({
        date: dateStr,
        label: labels[labels.length - 1],
        total: daySchedules.length,
        checkedIn: daySchedules.filter(s => s.status === 'checkedIn' || s.status === 'completed').length,
        completed: daySchedules.filter(s => s.status === 'completed').length
      })
    }
    return { labels, days }
  })

  const monthlyTrend = computed(() => {
    const days = []
    const labels = []
    for (let i = 29; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day')
      const dateStr = d.format('YYYY-MM-DD')
      labels.push(d.format('MM/DD'))
      const daySchedules = schedules.value.filter(s => s.date === dateStr)
      days.push({
        date: dateStr,
        label: labels[labels.length - 1],
        total: daySchedules.length,
        checkedIn: daySchedules.filter(s => s.status === 'checkedIn' || s.status === 'completed').length,
        completed: daySchedules.filter(s => s.status === 'completed').length
      })
    }
    return { labels, days }
  })

  function addSchedule(schedule) {
    const remarks = []
    if (schedule.remark) {
      remarks.push(`[${dayjs().format('MM-DD HH:mm')}] ${schedule.createdBy || '系统'}: ${schedule.remark}`)
    }
    const newSchedule = {
      id: Date.now(),
      ...schedule,
      status: 'pending',
      checkInTime: null,
      checkOutTime: null,
      remarks,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    delete newSchedule.remark
    schedules.value.push(newSchedule)
    return newSchedule
  }

  function updateSchedule(id, updates) {
    const index = schedules.value.findIndex(s => s.id === id)
    if (index !== -1) {
      if (updates.remark) {
        const existing = schedules.value[index].remarks || []
        updates.remarks = [...existing, `[${dayjs().format('MM-DD HH:mm')}] ${updates.updatedBy || '系统'}: ${updates.remark}`]
        delete updates.remark
      }
      delete updates.updatedBy
      schedules.value[index] = { ...schedules.value[index], ...updates }
      return true
    }
    return false
  }

  function checkIn(id) {
    return updateSchedule(id, {
      status: 'checkedIn',
      checkInTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      remark: '签到成功',
      updatedBy: '系统'
    })
  }

  function checkOut(id) {
    return updateSchedule(id, {
      status: 'completed',
      checkOutTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      remark: '签退完成',
      updatedBy: '系统'
    })
  }

  function markAsMissed(id, remark = '', needMakeup = false, makeupAssignedTo = '', operatorName = '系统') {
    const updates = {
      status: 'missed',
      missedRemark: remark,
      needMakeup,
      missedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      missedBy: operatorName
    }
    if (needMakeup) {
      updates.makeupStatus = 'pending'
      updates.makeupAssignedTo = makeupAssignedTo || operatorName
    }
    const index = schedules.value.findIndex(s => s.id === id)
    if (index !== -1) {
      const existing = schedules.value[index].remarks || []
      const makeupNote = needMakeup ? '（需补班）' : ''
      updates.remarks = [...existing, `[${dayjs().format('MM-DD HH:mm')}] ${operatorName} 标记缺勤${makeupNote}: ${remark}`]
      schedules.value[index] = { ...schedules.value[index], ...updates }
      return true
    }
    return false
  }

  function deleteSchedule(id) {
    const index = schedules.value.findIndex(s => s.id === id)
    if (index !== -1) {
      schedules.value.splice(index, 1)
      return true
    }
    return false
  }

  function getRecentEvents(limit = 10) {
    const events = []
    schedules.value.forEach(s => {
      if (s.checkInTime) {
        events.push({ user: s.volunteerName, action: '签到成功', target: `${s.type}班次`, type: 'primary', time: s.checkInTime, sortKey: s.checkInTime })
      }
      if (s.checkOutTime) {
        events.push({ user: s.volunteerName, action: '签退完成', target: `${s.type}班次`, type: 'success', time: s.checkOutTime, sortKey: s.checkOutTime })
      }
      if (s.status === 'missed' && s.missedAt) {
        events.push({ user: s.missedBy || '系统', action: '标记缺勤', target: `${s.volunteerName} ${s.type}班次`, type: 'danger', time: s.missedAt, sortKey: s.missedAt })
      }
    })
    return events.sort((a, b) => b.sortKey.localeCompare(a.sortKey)).slice(0, limit)
  }

  return {
    schedules,
    todaySchedules,
    pendingSchedules,
    overdueSchedules,
    statistics,
    volunteerStats,
    makeupPending,
    operatorTodaySchedules,
    operatorPendingCount,
    operatorOverdueSchedules,
    roleFilteredStatistics,
    weeklyTrend,
    monthlyTrend,
    getSchedulesByDate,
    getSchedulesByVolunteer,
    getSchedulesByStatus,
    getMakeupByHandler,
    isOperatorSchedule,
    filterByRole,
    addSchedule,
    updateSchedule,
    checkIn,
    checkOut,
    markAsMissed,
    deleteSchedule,
    getRecentEvents
  }
})
