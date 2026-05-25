import { ref, computed } from 'vue'

export const useCalendar = (initialDate?: Date) => {
  const currentDate = ref(initialDate || new Date())
  
  const currentYear = computed(() => currentDate.value.getFullYear())
  const currentMonth = computed(() => currentDate.value.getMonth())
  const currentDay = computed(() => currentDate.value.getDate())
  
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  
  const daysInMonth = computed(() => {
    return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  })
  
  const firstDayOfMonth = computed(() => {
    return new Date(currentYear.value, currentMonth.value, 1).getDay()
  })
  
  const calendarDays = computed(() => {
    const days: { date: Date | null; isCurrentMonth: boolean; isToday: boolean }[] = []
    const today = new Date()
    
    for (let i = 0; i < firstDayOfMonth.value; i++) {
      const prevMonthDate = new Date(currentYear.value, currentMonth.value, -firstDayOfMonth.value + i + 1)
      days.push({ date: prevMonthDate, isCurrentMonth: false, isToday: false })
    }
    
    for (let i = 1; i <= daysInMonth.value; i++) {
      const date = new Date(currentYear.value, currentMonth.value, i)
      const isToday = date.toDateString() === today.toDateString()
      days.push({ date, isCurrentMonth: true, isToday })
    }
    
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDate = new Date(currentYear.value, currentMonth.value + 1, i)
      days.push({ date: nextMonthDate, isCurrentMonth: false, isToday: false })
    }
    
    return days
  })
  
  const goToPreviousMonth = () => {
    currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
  }
  
  const goToNextMonth = () => {
    currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
  }
  
  const goToToday = () => {
    currentDate.value = new Date()
  }
  
  const setMonth = (year: number, month: number) => {
    currentDate.value = new Date(year, month, 1)
  }
  
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  return {
    currentDate,
    currentYear,
    currentMonth,
    currentDay,
    monthNames,
    weekDays,
    daysInMonth,
    firstDayOfMonth,
    calendarDays,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    setMonth,
    formatDateKey
  }
}
