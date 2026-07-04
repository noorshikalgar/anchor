import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { weekDays, weekStart } from '@/lib/dates'
import { buildFallbackPlan } from '@/lib/fallback'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { Moon, Salad, Dumbbell, Code, BookOpen, Sparkles, Smartphone, TrendingUp, type LucideIcon } from 'lucide-react'
import type { Habit } from '@/types/habit'

const ICONS: Record<string, LucideIcon> = {
  moon: Moon, salad: Salad, dumbbell: Dumbbell, code: Code,
  'book-open': BookOpen, sparkles: Sparkles, smartphone: Smartphone,
}

function HabitWeekRow({ habit, weekCheckins }: { habit: Habit; weekCheckins: { date: string; status: string }[] }) {
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
        <span className={cn(
          'ml-auto font-mono text-xs font-medium',
          rate >= 70 ? 'text-sage' : rate >= 40 ? 'text-ochre' : 'text-brick',
        )}>
          {rate}%
        </span>
      </div>
      <div className="flex gap-1">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const checkin = weekCheckins.find((c) => c.date === dateStr)
          const isFuture = day > new Date()

          return (
            <div
              key={dateStr}
              className={cn(
                'flex-1 h-2',
                isFuture ? 'bg-ink/5' :
                  checkin?.status === 'done' ? 'bg-sage' :
                    checkin?.status === 'partial' ? 'bg-ochre/60' :
                      checkin?.status === 'missed' ? 'bg-brick' : 'bg-ink/10',
              )}
            />
          )
        })}
      </div>
    </div>
  )
}

export function WeekScreen() {
  const currentWeekStart = weekStart()

  const focusHabits = useLiveQuery(
    () => db.habits.where('inFocus').equals(1).sortBy('focusOrder'),
    [],
  )

  const backlog = useLiveQuery(
    () => db.habits.filter((h) => h.inFocus === 0).toArray(),
    [],
  )

  const weekCheckins = useLiveQuery(async () => {
    const days = weekDays().map((d) => format(d, 'yyyy-MM-dd'))
    return db.checkins.where('date').anyOf(days).toArray()
  }, [])

  const allCheckins = useLiveQuery(() => db.checkins.toArray(), [])

  if (!focusHabits || !backlog || !weekCheckins || !allCheckins) return null

  const plan = buildFallbackPlan(focusHabits, backlog, allCheckins)

  const totalPossible = (focusHabits.length * weekDays().filter((d) => d <= new Date()).length)
  const totalDone = weekCheckins.filter((c) => c.status === 'done').length
  const totalPartial = weekCheckins.filter((c) => c.status === 'partial').length
  const overallRate = totalPossible > 0
    ? Math.round(((totalDone + totalPartial * 0.5) / totalPossible) * 100)
    : 0

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">This week</h1>
      <p className="font-sans text-xs text-ink/40 mb-5">
        {format(parseISO(currentWeekStart), 'd MMM')} — {format(weekDays()[6], 'd MMM yyyy')}
      </p>

      <div className="border border-harbor bg-harbor/5 p-4 mb-5">
        <p className="font-sans text-[10px] font-medium text-harbor/70 uppercase tracking-widest mb-2">
          This week's plan
        </p>
        <p className="font-sans text-sm text-ink leading-relaxed">{plan.summary}</p>
        {plan.newHabitId && plan.newHabitReason && (
          <div className="mt-3 pt-3 border-t border-harbor/20">
            <p className="font-sans text-xs text-ochre font-medium">{plan.newHabitReason}</p>
          </div>
        )}
      </div>

      {focusHabits.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest">
              Habit progress
            </h2>
            <span className={cn(
              'font-mono text-xs font-medium',
              overallRate >= 70 ? 'text-sage' : overallRate >= 40 ? 'text-ochre' : 'text-brick',
            )}>
              {overallRate}% overall
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {focusHabits.map((habit) => (
              <HabitWeekRow
                key={habit.id}
                habit={habit}
                weekCheckins={weekCheckins.filter((c) => c.habitId === habit.id)}
              />
            ))}
          </div>
        </>
      )}

      {focusHabits.length === 0 && (
        <div className="border border-dashed border-ink-10 p-6 text-center">
          <p className="font-sans text-sm text-ink/40">
            No habits in focus. Add some from the Focus tab.
          </p>
        </div>
      )}

      <div className="mt-5 flex gap-3 text-xs font-sans">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-sage" />
          <span className="text-ink/50">Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-ochre/60" />
          <span className="text-ink/50">Partial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-brick" />
          <span className="text-ink/50">Missed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-ink/10" />
          <span className="text-ink/50">Not logged</span>
        </div>
      </div>
    </div>
  )
}
