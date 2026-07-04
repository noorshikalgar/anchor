import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'
import { TODAY, getGreeting, weekDays } from '@/lib/dates'
import { WeekStrip } from '@/components/WeekStrip'
import { CheckinRow } from '@/components/CheckinRow'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { CheckinStatus, DisruptionReason, Checkin, DayLog } from '@/types/checkin'
import type { Habit } from '@/types/habit'

export function TodayScreen() {
  const { user } = useAuthStore()
  const today = TODAY()

  const [focusHabits, setFocusHabits] = useState<Habit[]>([])
  const [todayCheckins, setTodayCheckins] = useState<Checkin[]>([])
  const [allCheckins, setAllCheckins] = useState<Checkin[]>([])
  const [allDayLogs, setAllDayLogs] = useState<DayLog[]>([])
  const [disrupted, setDisrupted] = useState(false)
  const [dailyNote, setDailyNote] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)

  const loadData = useCallback(async () => {
    const days = weekDays()
    const from = format(days[0], 'yyyy-MM-dd')
    const [habits, checkins, dayLogs] = await Promise.all([
      api.get<Habit[]>('/api/habits'),
      api.get<Checkin[]>(`/api/checkins?from=${from}`),
      api.get<DayLog[]>('/api/daylogs'),
    ])
    setFocusHabits(habits.filter((h) => h.inFocus === 1).sort((a, b) => a.focusOrder - b.focusOrder))
    setAllCheckins(checkins)
    setTodayCheckins(checkins.filter((c) => c.date === today))
    setAllDayLogs(dayLogs)
    const todayLog = dayLogs.find((d) => d.date === today)
    if (todayLog) {
      setDisrupted(todayLog.disrupted)
      setDailyNote(todayLog.disruptionNote ?? '')
    }
  }, [today])

  useEffect(() => { loadData() }, [loadData])

  async function saveNote(note: string) {
    await api.put(`/api/daylogs/${today}`, { note })
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 1500)
  }

  async function toggleDisrupted() {
    const next = !disrupted
    setDisrupted(next)
    await api.put(`/api/daylogs/${today}`, { disrupted: next })
    loadData()
  }

  async function handleLog(habitId: string, status: CheckinStatus, reason?: DisruptionReason, note?: string) {
    await api.put(`/api/checkins/${habitId}-${today}`, { habitId, date: today, status, reason, note, usedFallback: disrupted })
    loadData()
  }

  const dateLabel = format(new Date(), 'EEEE, d MMMM')

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="mb-5">
        <p className="font-sans text-xs text-ink/40 uppercase tracking-widest mb-1">{dateLabel}</p>
        <h1 className="font-display text-2xl font-semibold text-ink leading-tight">
          {getGreeting(user?.name ?? 'there')}
        </h1>
      </div>
      <div className="mb-5">
        <WeekStrip checkins={allCheckins} dayLogs={allDayLogs} focusCount={focusHabits.length} />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest">Today's focus</h2>
        <button
          onClick={toggleDisrupted}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-medium border transition-colors',
            disrupted ? 'bg-ochre border-ochre text-white' : 'border-ink-10 text-ink/50 hover:border-ochre hover:text-ochre',
          )}
        >
          <AlertTriangle size={12} />
          {disrupted ? 'Disrupted day' : 'Mark disrupted'}
        </button>
      </div>
      {disrupted && (
        <div className="mb-4 px-3 py-2 bg-ochre/10 border border-ochre/30">
          <p className="font-sans text-xs text-ochre">Disrupted day — fallback versions active. Any progress counts.</p>
        </div>
      )}
      {focusHabits.length === 0 ? (
        <div className="border border-dashed border-ink-10 p-6 text-center">
          <p className="font-sans text-sm text-ink/40">No habits in focus yet. Go to Focus tab to add some.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {focusHabits.map((habit) => {
            const checkin = todayCheckins.find((c) => c.habitId === habit.id)
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
      {todayCheckins.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-ink-10" />
          <span className="font-mono text-xs text-ink/30">
            {todayCheckins.filter((c) => c.status !== 'pending').length} of {focusHabits.length} logged
          </span>
          <div className="h-px flex-1 bg-ink-10" />
        </div>
      )}

      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest">Today's note</h2>
          {noteSaved && <span className="font-sans text-xs text-sage">Saved</span>}
        </div>
        <textarea
          value={dailyNote}
          onChange={(e) => setDailyNote(e.target.value)}
          onBlur={(e) => { if (e.target.value.trim()) saveNote(e.target.value.trim()) }}
          placeholder="How did today go? Anything on your mind — skipped a habit, late night, guests over..."
          rows={3}
          maxLength={1000}
          className="w-full border border-ink-10 bg-white px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor resize-none placeholder:text-ink/25"
        />
        <p className="font-sans text-xs text-ink/25 mt-1">Saved on blur. Shared with AI for weekly planning.</p>
      </div>
    </div>
  )
}
