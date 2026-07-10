import { format, parseISO } from 'date-fns'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Checkin, DayLog } from '@/types/checkin'
import type { Habit } from '@/types/habit'

interface DayDetailProps {
  date: string
  habits: Habit[]
  checkins: Checkin[]
  dayLog?: DayLog
  onClose: () => void
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  done: { label: 'Done', cls: 'text-sage' },
  partial: { label: 'Partial', cls: 'text-ochre' },
  missed: { label: 'Missed', cls: 'text-brick' },
  pending: { label: 'Not logged', cls: 'text-ink/30' },
}

export function DayDetail({ date, habits, checkins, dayLog, onClose }: DayDetailProps) {
  return (
    <div className="border border-harbor/40 bg-white p-3 mt-2">
      <div className="flex items-center justify-between mb-2">
        <p className="font-sans text-xs font-medium text-ink/60 uppercase tracking-widest">
          {format(parseISO(date), 'EEEE, d MMM')}
          {dayLog?.disrupted && <span className="ml-2 text-ochre normal-case tracking-normal">Disrupted day</span>}
        </p>
        <button onClick={onClose} className="text-ink/30 hover:text-ink" aria-label="Close day detail">
          <X size={14} />
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {habits.map((habit) => {
          const checkin = checkins.find((c) => c.habitId === habit.id && c.date === date)
          const status = STATUS_LABEL[checkin?.status ?? 'pending']
          return (
            <div key={habit.id} className="flex items-baseline gap-2">
              <span className="font-sans text-sm text-ink flex-1">{habit.name}</span>
              <span className={cn('font-sans text-xs font-medium', status.cls)}>{status.label}</span>
              {checkin?.reason && (
                <span className="font-sans text-xs text-ink/40">({checkin.reason.replace(/-/g, ' ')})</span>
              )}
            </div>
          )
        })}
        {habits.length === 0 && <p className="font-sans text-xs text-ink/40">No habits were in focus.</p>}
      </div>
      {dayLog?.disruptionNote && (
        <p className="font-sans text-xs text-ink/50 mt-2 border-t border-ink-10 pt-2">{dayLog.disruptionNote}</p>
      )}
    </div>
  )
}
