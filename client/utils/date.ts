import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format)
}

export const formatDateTime = (date: string | Date, format: string = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(date).format(format)
}

export const formatTime = (date: string | Date, format: string = 'HH:mm'): string => {
  return dayjs(date).format(format)
}

export const isToday = (date: string | Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'day')
}

export const isPast = (date: string | Date): boolean => {
  return dayjs(date).isBefore(dayjs(), 'day')
}

export const isFuture = (date: string | Date): boolean => {
  return dayjs(date).isAfter(dayjs(), 'day')
}

export const daysBetween = (date1: string | Date, date2: string | Date): number => {
  return Math.abs(dayjs(date1).diff(dayjs(date2), 'day'))
}

export const getDaysInMonth = (year: number, month: number): number => {
  return dayjs(`${year}-${month}-01`).daysInMonth()
}

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return dayjs(`${year}-${month}-01`).day()
}

export const addDays = (date: string | Date, days: number): string => {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD')
}

export const startOfToday = (): string => {
  return dayjs().startOf('day').format('YYYY-MM-DD')
}

export const endOfToday = (): string => {
  return dayjs().endOf('day').format('YYYY-MM-DD')
}

export const startOfMonth = (year: number, month: number): string => {
  return dayjs(`${year}-${month}-01`).startOf('month').format('YYYY-MM-DD')
}

export const endOfMonth = (year: number, month: number): string => {
  return dayjs(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD')
}

export const relativeTime = (date: string | Date): string => {
  const now = dayjs()
  const target = dayjs(date)
  const diff = target.diff(now, 'day')
  
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === -1) return '昨天'
  if (diff > 1 && diff < 7) return `${diff}天后`
  if (diff < -1 && diff > -7) return `${Math.abs(diff)}天前`
  return formatDate(date)
}

export const generateDateRange = (start: string, end: string): string[] => {
  const dates: string[] = []
  const startDate = dayjs(start)
  const endDate = dayjs(end)
  
  let current = startDate
  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
    dates.push(current.format('YYYY-MM-DD'))
    current = current.add(1, 'day')
  }
  
  return dates
}
