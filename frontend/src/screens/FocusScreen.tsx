import { useState, useEffect, useCallback } from 'react'
import { Plus, Minus, ChevronUp, ChevronDown, Moon, Salad, Dumbbell, Code, BookOpen, Sparkles, Smartphone, Lock, type LucideIcon } from 'lucide-react'
import { api } from '@/lib/api'
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

interface SlotData {
  slotsUnlocked: number
  streaks: { habitId: string; habitName: string; streak: number; target: number }[]
  nextUnlock: { targetSlots: number; requirement: string } | null
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
        title={inFocus ? 'Remove from focus' : disabled ? 'Unlock more slots first' : 'Add to focus'}
      >
        {disabled && !inFocus ? <Lock size={12} /> : inFocus ? <Minus size={14} /> : <Plus size={14} />}
      </button>
    </div>
  )
}

export function FocusScreen() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [slotData, setSlotData] = useState<SlotData>({ slotsUnlocked: 1, streaks: [], nextUnlock: null })

  const loadData = useCallback(async () => {
    const [rows, slots] = await Promise.all([
      api.get<Habit[]>('/api/habits'),
      api.get<SlotData>('/api/slots'),
    ])
    setHabits(rows)
    setSlotData(slots)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const focusHabits = habits.filter((h) => h.inFocus === 1).sort((a, b) => a.focusOrder - b.focusOrder)
  const backlog = habits.filter((h) => h.inFocus === 0)
  const { slotsUnlocked, streaks, nextUnlock } = slotData
  const atCap = focusHabits.length >= slotsUnlocked

  async function reorder(index: number, dir: 'up' | 'down') {
    const next = [...focusHabits]
    const swap = dir === 'up' ? index - 1 : index + 1
    if (swap < 0 || swap >= next.length) return
    ;[next[index], next[swap]] = [next[swap], next[index]]
    await Promise.all(next.map((h, i) => api.patch(`/api/habits/${h.id}/focus`, { inFocus: 1, focusOrder: i })))
    loadData()
  }

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
    loadData()
  }

  const MAX_SLOTS = 3

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Focus</h1>
      <p className="font-sans text-sm text-ink/50 mb-4">Build one habit solid before adding the next.</p>

      {/* Slot bar */}
      <div className="mb-2 flex gap-1">
        {Array.from({ length: MAX_SLOTS }).map((_, i) => (
          <div
            key={i}
            className={cn('h-1.5 flex-1',
              i < focusHabits.length ? 'bg-harbor' :
              i < slotsUnlocked ? 'bg-ink/15' :
              'bg-ink/5'
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-xs text-ink/40">
          {focusHabits.length}/{slotsUnlocked} slots used · {slotsUnlocked}/{MAX_SLOTS} unlocked
        </span>
        {slotsUnlocked < MAX_SLOTS && (
          <span className="font-sans text-xs text-ochre">
            {slotsUnlocked + 1 === 2 ? 'Slot 2' : 'Slot 3'} locked
          </span>
        )}
      </div>

      {/* Streak progress toward next unlock */}
      {nextUnlock && streaks.length > 0 && (
        <div className="mb-5 border border-ink-10 bg-white p-4">
          <p className="font-sans text-[10px] font-medium text-ink/40 uppercase tracking-widest mb-3">
            Next unlock — slot {nextUnlock.targetSlots}
          </p>
          {streaks.map((s) => {
            const pct = Math.min(100, Math.round((s.streak / s.target) * 100))
            return (
              <div key={s.habitId} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-sans text-xs text-ink/70">{s.habitName}</span>
                  <span className={cn('font-mono text-xs', s.streak >= s.target ? 'text-sage' : 'text-ink/40')}>
                    {s.streak}/{s.target} days
                  </span>
                </div>
                <div className="h-1 bg-ink/10 w-full">
                  <div
                    className={cn('h-full transition-all', s.streak >= s.target ? 'bg-sage' : 'bg-harbor')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
          <p className="font-sans text-xs text-ink/40 mt-3">{nextUnlock.requirement}</p>
        </div>
      )}

      {slotsUnlocked === MAX_SLOTS && (
        <div className="mb-5 px-3 py-2 bg-sage/10 border border-sage/30">
          <p className="font-sans text-xs text-sage font-medium">All slots unlocked. Consistency earned this.</p>
        </div>
      )}

      {/* Current focus */}
      {focusHabits.length > 0 && (
        <section className="mb-5">
          <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest mb-2">Current focus</h2>
          <div className="flex flex-col gap-2">
            {focusHabits.map((h, i) => {
              const streak = streaks.find((s) => s.habitId === h.id)
              return (
                <div key={h.id}>
                  <div className="flex gap-1">
                    {focusHabits.length > 1 && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => reorder(i, 'up')}
                          disabled={i === 0}
                          className="w-6 h-7 flex items-center justify-center border border-ink-10 text-ink/40 hover:text-harbor hover:border-harbor disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        ><ChevronUp size={12} /></button>
                        <button
                          onClick={() => reorder(i, 'down')}
                          disabled={i === focusHabits.length - 1}
                          className="w-6 h-7 flex items-center justify-center border border-ink-10 text-ink/40 hover:text-harbor hover:border-harbor disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        ><ChevronDown size={12} /></button>
                      </div>
                    )}
                    <div className="flex-1">
                      <HabitItem habit={h} inFocus={true} onToggle={() => toggleFocus(h)} disabled={false} />
                    </div>
                  </div>
                  {streak && streak.streak > 0 && (
                    <div className={cn('px-4 py-1.5 border-x border-b border-ink-10 bg-parchment/40 flex items-center gap-2', focusHabits.length > 1 && 'ml-7')}>
                      <div className={cn('w-2 h-2', streak.streak >= streak.target ? 'bg-sage' : 'bg-harbor')} />
                      <span className="font-mono text-xs text-ink/50">
                        {streak.streak} day streak
                        {streak.streak >= streak.target ? ' ✓' : ` · ${streak.target - streak.streak} to unlock`}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Backlog */}
      {backlog.length > 0 && (
        <section>
          <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest mb-2">Backlog</h2>
          {atCap && (
            <p className="font-sans text-xs text-ink/50 mb-3 px-3 py-2 bg-ink/5 border border-ink-10">
              {slotsUnlocked < MAX_SLOTS
                ? `Keep current habits for 7 days to unlock slot ${slotsUnlocked + 1}.`
                : 'Remove a habit from focus to swap.'}
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
