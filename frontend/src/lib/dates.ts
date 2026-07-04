import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, parseISO } from 'date-fns'

export const TODAY = () => format(new Date(), 'yyyy-MM-dd')

export function weekDays(date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

export function formatDate(dateStr: string) {
  return format(parseISO(dateStr), 'yyyy-MM-dd')
}

export function isTodayDate(dateStr: string) {
  return isToday(parseISO(dateStr))
}

export function isSameDayDate(a: string, b: Date) {
  return isSameDay(parseISO(a), b)
}

export function weekStart(date = new Date()) {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function getGreeting(name: string): string {
  const hour = new Date().getHours()
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  return `Good ${time}, ${name}`
}

export function dayLabel(date: Date): string {
  return format(date, 'EEE')[0]
}

export function dayNumber(date: Date): string {
  return format(date, 'd')
}
