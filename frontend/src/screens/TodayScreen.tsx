import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'
import { useAppStore } from '@/lib/store'
import { TODAY, getGreeting, weekDays } from '@/lib/dates'
import { WeekStrip } from '@/components/WeekStrip'
import { CheckinRow } from '@/components/CheckinRow'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { CheckinStatus, DisruptionReason, Checkin, DayLog } from '@/types/checkin'
import type { Habit } from '@/types/habit'

export function TodayScreen() {
  const { user } = useAuthStore()
  const { weekStartsOn } = useAppStore()
  const today = TODAY()

  const [focusHabits, setFocusHabits] = useState<Habit[]>([])
  const [todayCheckins, setTodayCheckins] = useState<Checkin[]>([])
  const [allCheckins, setAllCheckins] = useState<Checkin[]>([])
  const [allDayLogs, setAllDayLogs] = useState<DayLog[]>([])
  const [disrupted, setDisrupted] = useState(false)
  const [dailyNote, setDailyNote] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)

  const loadData = useCallback(async () => {
    const days = weekDays(new Date(), weekStartsOn)
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
      const saved = todayLog.disruptionNote ?? ''
      setDailyNote(saved)
      if (saved) setNoteOpen(true) // expand but don't steal focus
    }
  }, [today, weekStartsOn])

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
  const hour = new Date().getHours()
  const allLogged = focusHabits.length > 0 && todayCheckins.filter((c) => c.status !== 'pending').length >= focusHabits.length
  const showEveningBanner = hour >= 20 && !allLogged && focusHabits.length > 0

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="mb-5">
        <p className="font-sans text-xs text-ink/40 uppercase tracking-widest mb-1">{dateLabel}</p>
        <h1 className="font-display text-2xl font-semibold text-ink leading-tight">
          {getGreeting(user?.name ?? 'there')}
        </h1>
      </div>
      <div className="mb-5">
        <WeekStrip checkins={allCheckins} dayLogs={allDayLogs} focusCount={focusHabits.length} weekStartsOn={weekStartsOn} />
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
      {showEveningBanner && (
        <div className="mb-4 px-3 py-2 bg-harbor/10 border border-harbor/30">
          <p className="font-sans text-xs text-harbor">Evening check-in — {focusHabits.length - todayCheckins.filter((c) => c.status !== 'pending').length} habit{focusHabits.length - todayCheckins.filter((c) => c.status !== 'pending').length !== 1 ? 's' : ''} still pending today.</p>
        </div>
      )}
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
        <button
          onClick={() => setNoteOpen((o) => !o)}
          className="flex items-center justify-between w-full mb-2 group"
        >
          <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest group-hover:text-ink/70 transition-colors">
            Today's note
            {dailyNote && !noteOpen && (
              <span className="ml-2 font-sans normal-case text-ink/30 font-normal tracking-normal">
                — {dailyNote.slice(0, 40)}{dailyNote.length > 40 ? '…' : ''}
              </span>
            )}
          </h2>
          <ChevronDown size={14} className={cn('text-ink/30 transition-transform', noteOpen && 'rotate-180')} />
        </button>
        {noteOpen && (
          <>
            {noteSaved && <p className="font-sans text-xs text-sage mb-1">Saved</p>}
            <textarea
              value={dailyNote}
              onChange={(e) => setDailyNote(e.target.value)}
              onBlur={(e) => { if (e.target.value.trim()) saveNote(e.target.value.trim()) }}
              placeholder="How did today go? Skipped a habit, late night, guests over..."
              rows={3}
              maxLength={1000}

              className="w-full border border-ink-10 bg-white px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor resize-none placeholder:text-ink/25"
            />
            <p className="font-sans text-xs text-ink/25 mt-1">Saved on blur. AI reads this for weekly planning.</p>
          </>
        )}
      </div>
    </div>
  )
}
