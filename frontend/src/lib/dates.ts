import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, parseISO } from 'date-fns'

export const TODAY = () => format(new Date(), 'yyyy-MM-dd')

export function weekDays(date = new Date(), weekStartsOn: 0 | 1 = 1) {
  const start = startOfWeek(date, { weekStartsOn })
  const end = endOfWeek(date, { weekStartsOn })
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

export function weekStart(date = new Date(), weekStartsOn: 0 | 1 = 1) {
  return format(startOfWeek(date, { weekStartsOn }), 'yyyy-MM-dd')
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
