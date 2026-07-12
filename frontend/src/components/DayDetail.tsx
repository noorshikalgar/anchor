import { format, parseISO } from 'date-fns'
import { X, Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Checkin, CheckinStatus, DayLog } from '@/types/checkin'
import type { Habit } from '@/types/habit'

interface DayDetailProps {
  date: string
  habits: Habit[]
  checkins: Checkin[]
  dayLog?: DayLog
  onClose: () => void
  onLog?: (habitId: string, date: string, status: CheckinStatus) => void
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  done: { label: 'Done', cls: 'text-sage' },
  partial: { label: 'Partial', cls: 'text-ochre' },
  missed: { label: 'Missed', cls: 'text-brick' },
  pending: { label: 'Not logged', cls: 'text-ink/30' },
}

export function DayDetail({ date, habits, checkins, dayLog, onClose, onLog }: DayDetailProps) {
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
          const status = checkin?.status ?? 'pending'
          const label = STATUS_LABEL[status]
          return (
            <div key={habit.id} className="flex items-center gap-2">
              <span className="font-sans text-sm text-ink flex-1 min-w-0 truncate">{habit.name}</span>
              {checkin?.reason && (
                <span className="font-sans text-xs text-ink/40">({checkin.reason.replace(/-/g, ' ')})</span>
              )}
              <span className={cn('font-sans text-xs font-medium', label.cls)}>{label.label}</span>
              {onLog && (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => onLog(habit.id, date, 'done')}
                    className={cn('w-6 h-6 flex items-center justify-center border',
                      status === 'done' ? 'bg-sage border-sage text-white' : 'border-ink-10 text-ink/30 hover:border-sage hover:text-sage')}
                    title="Done"
                  >
                    <Check size={11} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => onLog(habit.id, date, 'partial')}
                    className={cn('w-6 h-6 flex items-center justify-center border',
                      status === 'partial' ? 'bg-ochre border-ochre text-white' : 'border-ink-10 text-ink/30 hover:border-ochre hover:text-ochre')}
                    title="Partial"
                  >
                    <Minus size={11} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => onLog(habit.id, date, 'missed')}
                    className={cn('w-6 h-6 flex items-center justify-center border',
                      status === 'missed' ? 'bg-brick border-brick text-white' : 'border-ink-10 text-ink/30 hover:border-brick hover:text-brick')}
                    title="Missed"
                  >
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {habits.length === 0 && <p className="font-sans text-xs text-ink/40">No habits were in focus.</p>}
      </div>
      {dayLog?.disruptionNote && (
        <p className="font-sans text-xs text-ink/50 mt-2 border-t border-ink-10 pt-2">{dayLog.disruptionNote}</p>
      )}
      {onLog && <p className="font-sans text-[10px] text-ink/25 mt-2">Tap to backfill a forgotten log.</p>}
    </div>
  )
}
