import { useState, useEffect, useCallback } from 'react'
import { Plus, Minus, Moon, Salad, Dumbbell, Code, BookOpen, Sparkles, Smartphone, type LucideIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Habit } from '@/types/habit'

const ICONS: Record<string, LucideIcon> = {
  moon: Moon, salad: Salad, dumbbell: Dumbbell, code: Code,
  'book-open': BookOpen, sparkles: Sparkles, smartphone: Smartphone,
}

const SLOT_LABELS: Record<string, string> = {
  morning: 'Morning', 'after-breakfast': 'After breakfast', midday: 'Midday',
  'after-work': 'After work', 'after-dinner': 'After dinner',
  'before-sleep': 'Before sleep', anytime: 'Anytime',
}

function HabitItem({ habit, inFocus, onToggle, disabled }: { habit: Habit; inFocus: boolean; onToggle: () => void; disabled: boolean }) {
  const Icon = ICONS[habit.icon] ?? Moon
  return (
    <div className="border border-ink-10 bg-white flex items-start gap-3 p-4">
      <Icon size={18} className={inFocus ? 'text-harbor mt-0.5' : 'text-ink/30 mt-0.5'} />
      <div className="flex-1 min-w-0">
        <p className={cn('font-sans font-medium text-sm', inFocus ? 'text-ink' : 'text-ink/50')}>{habit.name}</p>
        <p className="font-sans text-xs text-ink/40 mt-0.5">{SLOT_LABELS[habit.slot]}</p>
        <p className="font-sans text-xs text-ink/40 mt-1 leading-snug">{habit.defaultVersion}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled && !inFocus}
        className={cn(
          'flex-shrink-0 w-8 h-8 flex items-center justify-center border transition-colors',
          inFocus ? 'border-brick text-brick hover:bg-brick hover:text-white'
            : disabled ? 'border-ink-10 text-ink/20 cursor-not-allowed'
            : 'border-sage text-sage hover:bg-sage hover:text-white',
        )}
      >
        {inFocus ? <Minus size={14} /> : <Plus size={14} />}
      </button>
    </div>
  )
}

export function FocusScreen() {
  const { focusCap } = useAppStore()
  const [habits, setHabits] = useState<Habit[]>([])

  const loadHabits = useCallback(async () => {
    const rows = await api.get<Habit[]>('/api/habits')
    setHabits(rows)
  }, [])

  useEffect(() => { loadHabits() }, [loadHabits])

  const focusHabits = habits.filter((h) => h.inFocus === 1).sort((a, b) => a.focusOrder - b.focusOrder)
  const backlog = habits.filter((h) => h.inFocus === 0)
  const atCap = focusHabits.length >= focusCap
  const slotsLeft = focusCap - focusHabits.length

  async function toggleFocus(habit: Habit) {
    if (habit.inFocus === 1) {
      await api.patch(`/api/habits/${habit.id}/focus`, { inFocus: 0, focusOrder: 999 })
      const remaining = focusHabits.filter((h) => h.id !== habit.id)
      await Promise.all(remaining.map((h, i) => api.patch(`/api/habits/${h.id}/focus`, { inFocus: 1, focusOrder: i })))
    } else {
      if (atCap) return
      const maxOrder = Math.max(-1, ...focusHabits.map((h) => h.focusOrder))
      await api.patch(`/api/habits/${habit.id}/focus`, { inFocus: 1, focusOrder: maxOrder + 1 })
    }
    loadHabits()
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Focus</h1>
      <p className="font-sans text-sm text-ink/50 mb-4">Max {focusCap} habits at a time. Move slow, build solid.</p>
      <div className="flex gap-1 mb-5">
        {Array.from({ length: focusCap }).map((_, i) => (
          <div key={i} className={cn('h-1 flex-1', i < focusHabits.length ? 'bg-harbor' : 'bg-ink/10')} />
        ))}
      </div>
      {focusHabits.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest">Current focus</h2>
            <span className="font-mono text-xs text-harbor">
              {focusHabits.length}/{focusCap} · {slotsLeft === 0 ? 'full' : `${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} left`}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {focusHabits.map((h) => <HabitItem key={h.id} habit={h} inFocus={true} onToggle={() => toggleFocus(h)} disabled={false} />)}
          </div>
        </section>
      )}
      {backlog.length > 0 && (
        <section>
          <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest mb-2">Backlog</h2>
          {atCap && (
            <p className="font-sans text-xs text-ochre mb-3 px-3 py-2 bg-ochre/10 border border-ochre/30">
              Focus is full. Remove one habit to add another.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {backlog.map((h) => <HabitItem key={h.id} habit={h} inFocus={false} onToggle={() => toggleFocus(h)} disabled={atCap} />)}
          </div>
        </section>
      )}
    </div>
  )
}
