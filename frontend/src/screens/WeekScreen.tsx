import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { weekDays, weekStart } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { Moon, Salad, Dumbbell, Code, BookOpen, Sparkles, Smartphone, TrendingUp, RefreshCw, type LucideIcon } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Habit } from '@/types/habit'
import type { Checkin } from '@/types/checkin'

const ICONS: Record<string, LucideIcon> = {
  moon: Moon, salad: Salad, dumbbell: Dumbbell, code: Code,
  'book-open': BookOpen, sparkles: Sparkles, smartphone: Smartphone,
}

interface HabitRec {
  habitId: string
  action: 'maintain' | 'shrink' | 'graduate'
  reason: string
}

interface PlanResult {
  summary: string
  habitRecommendations: HabitRec[]
  newHabitSuggestion: { habitId: string; reason: string } | null
  disruptionPrediction: string | null
  source: 'gemini' | 'rule-based'
  warning?: string
}

function HabitWeekRow({ habit, weekCheckins }: { habit: Habit; weekCheckins: Checkin[] }) {
  const days = weekDays()
  const Icon = ICONS[habit.icon] ?? TrendingUp
  const done = weekCheckins.filter((c) => c.status === 'done').length
  const partial = weekCheckins.filter((c) => c.status === 'partial').length
  const rate = days.length > 0 ? Math.round(((done + partial * 0.5) / days.length) * 100) : 0
  return (
    <div className="border border-ink-10 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-harbor" />
        <span className="font-sans font-medium text-sm text-ink">{habit.name}</span>
        <span className={cn('ml-auto font-mono text-xs font-medium', rate >= 70 ? 'text-sage' : rate >= 40 ? 'text-ochre' : 'text-brick')}>{rate}%</span>
      </div>
      <div className="flex gap-1">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const checkin = weekCheckins.find((c) => c.date === dateStr)
          const isFuture = day > new Date()
          return (
            <div key={dateStr} className={cn('flex-1 h-2',
              isFuture ? 'bg-ink/5' :
              checkin?.status === 'done' ? 'bg-sage' :
              checkin?.status === 'partial' ? 'bg-ochre/60' :
              checkin?.status === 'missed' ? 'bg-brick' : 'bg-ink/10'
            )} />
          )
        })}
      </div>
    </div>
  )
}

function PlanCard({ plan, habitMap, onRefresh }: { plan: PlanResult; habitMap: Map<string, string>; onRefresh: (context?: string) => void }) {
  const [contextInput, setContextInput] = useState('')
  const [adjustMode, setAdjustMode] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [skipped, setSkipped] = useState(false)

  const actionColor = (action: HabitRec['action']) =>
    action === 'maintain' ? 'text-sage' : action === 'shrink' ? 'text-ochre' : 'text-harbor'
  const actionLabel = (action: HabitRec['action']) =>
    action === 'maintain' ? 'Maintain' : action === 'shrink' ? 'Shrink' : 'Graduate'

  if (accepted) {
    return (
      <div className="border border-sage bg-sage/5 p-4 mb-5">
        <p className="font-sans text-xs font-medium text-sage uppercase tracking-widest mb-1">Plan accepted</p>
        <p className="font-sans text-sm text-ink">{plan.summary}</p>
      </div>
    )
  }

  if (skipped) {
    return (
      <div className="border border-ink-10 bg-white p-4 mb-5">
        <p className="font-sans text-xs text-ink/40">Plan skipped — log habits manually as usual.</p>
      </div>
    )
  }

  return (
    <div className="border border-harbor bg-harbor/5 p-4 mb-5">
      <div className="flex items-center justify-between mb-2">
        <p className="font-sans text-[10px] font-medium text-harbor/70 uppercase tracking-widest">
          {plan.source === 'gemini' ? 'AI plan — Gemini' : 'Plan'}
        </p>
        <button onClick={onRefresh} className="text-ink/30 hover:text-harbor transition-colors">
          <RefreshCw size={13} />
        </button>
      </div>
      {plan.warning && (
        <p className="font-sans text-xs text-ochre mb-2">{plan.warning}</p>
      )}
      <p className="font-sans text-sm text-ink leading-relaxed mb-3">{plan.summary}</p>

      {plan.habitRecommendations.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-3">
          {plan.habitRecommendations.map((rec) => (
            <div key={rec.habitId} className="flex items-start gap-2">
              <span className={cn('font-sans text-xs font-medium min-w-[56px]', actionColor(rec.action))}>
                {actionLabel(rec.action)}
              </span>
              <span className="font-sans text-xs text-ink/60 flex-1">
                <span className="font-medium text-ink/80">{habitMap.get(rec.habitId) ?? rec.habitId}</span>
                {' — '}{rec.reason}
              </span>
            </div>
          ))}
        </div>
      )}

      {plan.newHabitSuggestion && (
        <div className="border-t border-harbor/20 pt-3 mb-3">
          <p className="font-sans text-xs text-ochre font-medium">Consider adding: {habitMap.get(plan.newHabitSuggestion.habitId) ?? plan.newHabitSuggestion.habitId}</p>
          <p className="font-sans text-xs text-ink/50 mt-0.5">{plan.newHabitSuggestion.reason}</p>
        </div>
      )}

      {plan.disruptionPrediction && (
        <div className="border-t border-harbor/20 pt-3 mb-3">
          <p className="font-sans text-xs text-ink/50">{plan.disruptionPrediction}</p>
        </div>
      )}

      {adjustMode ? (
        <div className="border-t border-harbor/20 pt-3">
          <p className="font-sans text-xs text-ink/50 mb-2">Add context — upcoming travel, events, or anything that'll affect this week:</p>
          <textarea
            value={contextInput}
            onChange={(e) => setContextInput(e.target.value)}
            placeholder="e.g. Office trip Tue–Thu, late nights expected..."
            maxLength={500}
            rows={2}
            className="w-full border border-ink-10 px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor bg-parchment/30 resize-none"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { setAdjustMode(false); onRefresh(contextInput.trim() || undefined) }}
              className="flex-1 py-2 bg-harbor text-parchment text-xs font-sans font-medium"
            >
              Re-generate
            </button>
            <button onClick={() => setAdjustMode(false)} className="px-3 py-2 border border-ink-10 text-ink/50 text-xs font-sans">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 mt-3 border-t border-harbor/20 pt-3">
          <button onClick={() => setAccepted(true)} className="flex-1 py-2 bg-harbor text-parchment text-xs font-sans font-medium">
            Accept
          </button>
          <button onClick={() => setAdjustMode(true)} className="flex-1 py-2 border border-harbor text-harbor text-xs font-sans font-medium">
            Adjust
          </button>
          <button onClick={() => setSkipped(true)} className="flex-1 py-2 border border-ink-10 text-ink/50 text-xs font-sans">
            Skip
          </button>
        </div>
      )}
    </div>
  )
}

export function WeekScreen() {
  const currentWeekStart = weekStart()
  const { aiEnabled } = useAppStore()
  const [focusHabits, setFocusHabits] = useState<Habit[]>([])
  const [weekCheckins, setWeekCheckins] = useState<Checkin[]>([])
  const [plan, setPlan] = useState<PlanResult | null>(null)
  const [planLoading, setPlanLoading] = useState(false)

  const loadData = useCallback(async () => {
    const days = weekDays()
    const from = format(days[0], 'yyyy-MM-dd')
    const to = format(days[6], 'yyyy-MM-dd')
    const [habits, checkins] = await Promise.all([
      api.get<Habit[]>('/api/habits'),
      api.get<Checkin[]>(`/api/checkins?from=${from}&to=${to}`),
    ])
    setFocusHabits(habits.filter((h) => h.inFocus === 1).sort((a, b) => a.focusOrder - b.focusOrder))
    setWeekCheckins(checkins)
  }, [])

  const loadPlan = useCallback(async (context?: string) => {
    setPlanLoading(true)
    try {
      const result = await api.post<PlanResult>('/api/plan/generate', context ? { userContext: context } : {})
      setPlan(result)
    } catch {
      // plan stays null — UI handles empty state
    } finally {
      setPlanLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { loadPlan() }, [loadPlan])

  const days = weekDays()
  const totalPossible = focusHabits.length * days.filter((d) => d <= new Date()).length
  const totalDone = weekCheckins.filter((c) => c.status === 'done').length
  const totalPartial = weekCheckins.filter((c) => c.status === 'partial').length
  const overallRate = totalPossible > 0 ? Math.round(((totalDone + totalPartial * 0.5) / totalPossible) * 100) : 0

  const habitMap = new Map(focusHabits.map((h) => [h.id, h.name]))

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">This week</h1>
      <p className="font-sans text-xs text-ink/40 mb-5">
        {format(parseISO(currentWeekStart), 'd MMM')} — {format(days[6], 'd MMM yyyy')}
      </p>

      {planLoading ? (
        <div className="border border-harbor bg-harbor/5 p-4 mb-5">
          <p className="font-sans text-xs text-harbor/60 animate-pulse">
            {aiEnabled ? 'Gemini is thinking...' : 'Building your plan...'}
          </p>
        </div>
      ) : plan ? (
        <PlanCard plan={plan} habitMap={habitMap} onRefresh={() => loadPlan()} />
      ) : (
        <div className="border border-ink-10 bg-white p-4 mb-5">
          <p className="font-sans text-xs text-ink/40">Could not load plan. Check your settings.</p>
        </div>
      )}

      {focusHabits.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest">Habit progress</h2>
            <span className={cn('font-mono text-xs font-medium', overallRate >= 70 ? 'text-sage' : overallRate >= 40 ? 'text-ochre' : 'text-brick')}>{overallRate}% overall</span>
          </div>
          <div className="flex flex-col gap-2">
            {focusHabits.map((habit) => (
              <HabitWeekRow key={habit.id} habit={habit} weekCheckins={weekCheckins.filter((c) => c.habitId === habit.id)} />
            ))}
          </div>
        </>
      )}
      {focusHabits.length === 0 && (
        <div className="border border-dashed border-ink-10 p-6 text-center">
          <p className="font-sans text-sm text-ink/40">No habits in focus. Add some from the Focus tab.</p>
        </div>
      )}
      <div className="mt-5 flex gap-3 text-xs font-sans">
        {[['bg-sage','Done'],['bg-ochre/60','Partial'],['bg-brick','Missed'],['bg-ink/10','Not logged']].map(([cls, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3', cls)} />
            <span className="text-ink/50">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
