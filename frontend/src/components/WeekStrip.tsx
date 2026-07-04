import { weekDays, dayLabel, dayNumber, isSameDayDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Checkin, DayLog } from '@/types/checkin'

interface WeekStripProps {
  checkins: Checkin[]
  dayLogs: DayLog[]
  focusCount: number
}

function getDayState(
  date: Date,
  checkins: Checkin[],
  dayLogs: DayLog[],
  focusCount: number,
): 'done' | 'partial' | 'missed' | 'disrupted' | 'today' | 'future' {
  const isToday = isSameDayDate(date.toISOString().split('T')[0], new Date()) && date <= new Date()
  const isFuture = date > new Date() && !isSameDayDate(date.toISOString().split('T')[0], new Date())

  if (isFuture) return 'future'

  const dateStr = date.toISOString().split('T')[0]
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

export function WeekStrip({ checkins, dayLogs, focusCount }: WeekStripProps) {
  const days = weekDays()
  const today = new Date()

  return (
    <div className="flex gap-1 w-full">
      {days.map((day) => {
        const isToday = isSameDayDate(day.toISOString().split('T')[0], today)
        const state = getDayState(day, checkins, dayLogs, focusCount)

        return (
          <div
            key={day.toISOString()}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2',
              'border border-ink-10',
              isToday && 'border-harbor',
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
          </div>
        )
      })}
    </div>
  )
}
