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
    return { total, checkedIn, missed, pending }
  })

  function addSchedule(schedule) {
    const newSchedule = {
      id: Date.now(),
      ...schedule,
      status: 'pending',
      checkInTime: null,
      checkOutTime: null,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    schedules.value.push(newSchedule)
    return newSchedule
  }

  function updateSchedule(id, updates) {
    const index = schedules.value.findIndex(s => s.id === id)
    if (index !== -1) {
      schedules.value[index] = { ...schedules.value[index], ...updates }
      return true
    }
    return false
  }

  function checkIn(id) {
    return updateSchedule(id, {
      status: 'checkedIn',
      checkInTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    })
  }

  function checkOut(id) {
    return updateSchedule(id, {
      status: 'completed',
      checkOutTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    })
  }

  function markAsMissed(id, remark = '') {
    return updateSchedule(id, {
      status: 'missed',
      missedRemark: remark
    })
  }

  function deleteSchedule(id) {
    const index = schedules.value.findIndex(s => s.id === id)
    if (index !== -1) {
      schedules.value.splice(index, 1)
      return true
    }
    return false
  }

  return {
    schedules,
    todaySchedules,
    pendingSchedules,
    overdueSchedules,
    statistics,
    getSchedulesByDate,
    getSchedulesByVolunteer,
    getSchedulesByStatus,
    addSchedule,
    updateSchedule,
    checkIn,
    checkOut,
    markAsMissed,
    deleteSchedule
  }
})
