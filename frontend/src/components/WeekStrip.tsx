import { format } from 'date-fns'
import { weekDays, dayLabel, dayNumber, isSameDayDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Checkin, DayLog } from '@/types/checkin'

interface WeekStripProps {
  checkins: Checkin[]
  dayLogs: DayLog[]
  focusCount: number
  weekStartsOn?: 0 | 1
  selectedDate?: string | null
  onSelectDay?: (dateStr: string) => void
}

function getDayState(
  date: Date,
  checkins: Checkin[],
  dayLogs: DayLog[],
  focusCount: number,
): 'done' | 'partial' | 'missed' | 'disrupted' | 'today' | 'future' {
  // format() stays in local time — toISOString() shifts to UTC, which is a
  // previous calendar day for any timezone east of UTC (e.g. IST)
  const dateStr = format(date, 'yyyy-MM-dd')
  const isToday = isSameDayDate(dateStr, new Date()) && date <= new Date()
  const isFuture = date > new Date() && !isSameDayDate(dateStr, new Date())

  if (isFuture) return 'future'
  const log = dayLogs.find((d) => d.date === dateStr)
  const dayCheckins = checkins.filter((c) => c.date === dateStr)

  if (dayCheckins.length === 0) return isToday ? 'today' : 'future'

  if (log?.disrupted) return 'disrupted'

  const done = dayCheckins.filter((c) => c.status === 'done').length
  const partial = dayCheckins.filter((c) => c.status === 'partial').length
  const rate = focusCount > 0 ? (done + partial * 0.5) / focusCount : 0

  if (rate >= 0.8) return 'done'
  if (rate >= 0.4) return 'partial'
  return 'missed'
}

export function WeekStrip({ checkins, dayLogs, focusCount, weekStartsOn = 1, selectedDate, onSelectDay }: WeekStripProps) {
  const days = weekDays(new Date(), weekStartsOn)
  const today = new Date()

  return (
    <div className="flex gap-1 w-full">
      {days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const isToday = isSameDayDate(dateStr, today)
        const isFuture = day > today && !isToday
        const state = getDayState(day, checkins, dayLogs, focusCount)
        const clickable = !!onSelectDay && !isFuture

        return (
          <button
            key={day.toISOString()}
            onClick={clickable ? () => onSelectDay(dateStr) : undefined}
            disabled={!clickable}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2',
              'border border-ink-10',
              isToday && 'border-harbor',
              selectedDate === dateStr && 'border-harbor bg-harbor/5',
              clickable && 'cursor-pointer hover:border-harbor/50',
            )}
          >
            <span className="font-mono text-[10px] text-ink/50 uppercase tracking-wider">
              {dayLabel(day)}
            </span>
            <span
              className={cn(
                'font-mono text-xs font-medium w-6 h-6 flex items-center justify-center',
                state === 'done' && 'bg-sage text-white',
                state === 'partial' && 'bg-ochre/60 text-ink',
                state === 'missed' && 'bg-brick text-white',
                state === 'disrupted' && 'bg-ink/10 text-ink/40',
                state === 'today' && 'bg-harbor text-parchment',
                state === 'future' && 'text-ink/30',
              )}
            >
              {dayNumber(day)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
