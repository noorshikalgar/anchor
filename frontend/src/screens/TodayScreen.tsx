import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle } from 'lucide-react'
import { db } from '@/lib/db'
import { TODAY, getGreeting } from '@/lib/dates'
import { useAppStore } from '@/lib/store'
import { WeekStrip } from '@/components/WeekStrip'
import { CheckinRow } from '@/components/CheckinRow'
import { cn } from '@/lib/utils'
import type { CheckinStatus, DisruptionReason } from '@/types/checkin'
import { format } from 'date-fns'

export function TodayScreen() {
  const { userName } = useAppStore()
  const today = TODAY()
  const [disrupted, setDisrupted] = useState(false)

  const focusHabits = useLiveQuery(
    () => db.habits.where('inFocus').equals(1).sortBy('focusOrder'),
    [],
  )

  const todayCheckins = useLiveQuery(
    () => db.checkins.where('date').equals(today).toArray(),
    [today],
  )

  const allCheckins = useLiveQuery(() => db.checkins.toArray(), [])
  const allDayLogs = useLiveQuery(() => db.dayLogs.toArray(), [])

  useEffect(() => {
    db.dayLogs.get(today).then((log) => {
      if (log) setDisrupted(log.disrupted)
    })
  }, [today])

  async function toggleDisrupted() {
    const next = !disrupted
    setDisrupted(next)
    const existing = await db.dayLogs.get(today)
    if (existing) {
      await db.dayLogs.update(today, { disrupted: next })
    } else {
      await db.dayLogs.add({ date: today, disrupted: next })
    }
  }

  async function handleLog(
    habitId: string,
    status: CheckinStatus,
    reason?: DisruptionReason,
    note?: string,
  ) {
    const existing = todayCheckins?.find((c) => c.habitId === habitId)
    const checkin = {
      habitId,
      date: today,
      status,
      reason,
      note,
      usedFallback: disrupted,
      loggedAt: Date.now(),
    }

    if (existing) {
      await db.checkins.update(existing.id, checkin)
    } else {
      await db.checkins.add({ id: `${habitId}-${today}`, ...checkin })
    }
  }

  const dateLabel = format(new Date(), 'EEEE, d MMMM')

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="mb-5">
        <p className="font-sans text-xs text-ink/40 uppercase tracking-widest mb-1">{dateLabel}</p>
        <h1 className="font-display text-2xl font-semibold text-ink leading-tight">
          {getGreeting(userName)}
        </h1>
      </div>

      <div className="mb-5">
        <WeekStrip
          checkins={allCheckins ?? []}
          dayLogs={allDayLogs ?? []}
          focusCount={focusHabits?.length ?? 0}
        />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest">
          Today's focus
        </h2>
        <button
          onClick={toggleDisrupted}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-medium border transition-colors',
            disrupted
              ? 'bg-ochre border-ochre text-white'
              : 'border-ink-10 text-ink/50 hover:border-ochre hover:text-ochre',
          )}
        >
          <AlertTriangle size={12} />
          {disrupted ? 'Disrupted day' : 'Mark disrupted'}
        </button>
      </div>

      {disrupted && (
        <div className="mb-4 px-3 py-2 bg-ochre/10 border border-ochre/30">
          <p className="font-sans text-xs text-ochre">
            Disrupted day — fallback versions active. Any progress counts.
          </p>
        </div>
      )}

      {!focusHabits || focusHabits.length === 0 ? (
        <div className="border border-dashed border-ink-10 p-6 text-center">
          <p className="font-sans text-sm text-ink/40">
            No habits in focus yet. Go to Focus tab to add some.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {focusHabits.map((habit) => {
            const checkin = todayCheckins?.find((c) => c.habitId === habit.id)
            return (
              <CheckinRow
                key={habit.id}
                habit={habit}
                status={checkin?.status ?? 'pending'}
                disrupted={disrupted}
                onLog={(status, reason, note) => handleLog(habit.id, status, reason, note)}
              />
            )
          })}
        </div>
      )}

      {todayCheckins && todayCheckins.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-ink-10" />
          <span className="font-mono text-xs text-ink/30">
            {todayCheckins.filter((c) => c.status !== 'pending').length} of{' '}
            {focusHabits?.length ?? 0} logged
          </span>
          <div className="h-px flex-1 bg-ink-10" />
        </div>
      )}
    </div>
  )
}
