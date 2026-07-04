import { useState, useEffect, useCallback } from 'react'
import { Plus, Minus, ChevronUp, ChevronDown, Pencil, Trash2, Check, X,
  Moon, Salad, Dumbbell, Code, BookOpen, Sparkles, Smartphone,
  Heart, Sun, Zap, Coffee, Music, Flame, Target, Wind, Droplets, Brain,
  type LucideIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Habit } from '@/types/habit'

export const ICONS: Record<string, LucideIcon> = {
  moon: Moon, salad: Salad, dumbbell: Dumbbell, code: Code,
  'book-open': BookOpen, sparkles: Sparkles, smartphone: Smartphone,
  heart: Heart, sun: Sun, zap: Zap, coffee: Coffee, music: Music,
  flame: Flame, target: Target, wind: Wind, droplets: Droplets, brain: Brain,
}

const SLOT_LABELS: Record<string, string> = {
  morning: 'Morning', 'after-breakfast': 'After breakfast', midday: 'Midday',
  'after-work': 'After work', 'after-dinner': 'After dinner',
  'before-sleep': 'Before sleep', anytime: 'Anytime',
}

const SLOTS = Object.entries(SLOT_LABELS)

interface SlotData {
  slotsUnlocked: number
  streaks: { habitId: string; habitName: string; streak: number; target: number }[]
  nextUnlock: { targetSlots: number; requirement: string } | null
}

interface HabitFormState {
  name: string
  slot: string
  icon: string
  defaultVersion: string
  fallbackVersion: string
}

const EMPTY_FORM: HabitFormState = { name: '', slot: 'anytime', icon: 'sparkles', defaultVersion: '', fallbackVersion: '' }

function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(ICONS).map(([key, Icon]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn('w-8 h-8 flex items-center justify-center border transition-colors',
            value === key ? 'border-harbor bg-harbor text-parchment' : 'border-ink-10 text-ink/40 hover:border-harbor hover:text-harbor'
          )}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}

function HabitForm({ initial, onSave, onCancel, saveLabel = 'Save' }: {
  initial: HabitFormState
  onSave: (f: HabitFormState) => Promise<void>
  onCancel: () => void
  saveLabel?: string
}) {
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const set = (k: keyof HabitFormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.name.trim() || !form.defaultVersion.trim() || !form.fallbackVersion.trim()) return
    setLoading(true)
    await onSave(form)
    setLoading(false)
  }

  return (
    <div className="border border-harbor/30 bg-harbor/3 p-3 flex flex-col gap-2">
      <div>
        <label className="font-sans text-xs text-ink/50 block mb-1">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Evening walk"
          maxLength={100}
          className="w-full border border-ink-10 px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor bg-white"
        />
      </div>
      <div>
        <label className="font-sans text-xs text-ink/50 block mb-1">When</label>
        <select
          value={form.slot}
          onChange={(e) => set('slot', e.target.value)}
          className="w-full border border-ink-10 px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor bg-white"
        >
          {SLOTS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
        </select>
      </div>
      <div>
        <label className="font-sans text-xs text-ink/50 block mb-1">Icon</label>
        <IconPicker value={form.icon} onChange={(v) => set('icon', v)} />
      </div>
      <div>
        <label className="font-sans text-xs text-ink/50 block mb-1">Done version</label>
        <input
          type="text"
          value={form.defaultVersion}
          onChange={(e) => set('defaultVersion', e.target.value)}
          placeholder="30 min walk after dinner"
          maxLength={500}
          className="w-full border border-ink-10 px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor bg-white"
        />
      </div>
      <div>
        <label className="font-sans text-xs text-ink/50 block mb-1">Fallback version</label>
        <input
          type="text"
          value={form.fallbackVersion}
          onChange={(e) => set('fallbackVersion', e.target.value)}
          placeholder="10 min walk, even inside the house"
          maxLength={500}
          className="w-full border border-ink-10 px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor bg-white"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={loading || !form.name.trim() || !form.defaultVersion.trim() || !form.fallbackVersion.trim()}
          className="flex items-center gap-1 px-3 py-1.5 bg-harbor text-parchment text-xs font-sans font-medium disabled:opacity-40"
        >
          <Check size={12} /> {loading ? 'Saving...' : saveLabel}
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 px-3 py-1.5 border border-ink-10 text-ink/50 text-xs font-sans">
          <X size={12} /> Cancel
        </button>
      </div>
    </div>
  )
}

function HabitCard({ habit, inFocus, onToggle, disabled, onEdit, onDelete, showReorder, isFirst, isLast, onUp, onDown }: {
  habit: Habit; inFocus: boolean; onToggle: () => void; disabled: boolean
  onEdit: () => void; onDelete: () => void
  showReorder: boolean; isFirst: boolean; isLast: boolean; onUp: () => void; onDown: () => void
}) {
  const Icon = ICONS[habit.icon] ?? Sparkles
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="border border-ink-10 bg-white flex items-start gap-3 p-4">
      {showReorder && (
        <div className="flex flex-col gap-1 mt-0.5">
          <button onClick={onUp} disabled={isFirst} className="w-5 h-5 flex items-center justify-center border border-ink-10 text-ink/40 hover:text-harbor hover:border-harbor disabled:opacity-20 disabled:cursor-not-allowed">
            <ChevronUp size={10} />
          </button>
          <button onClick={onDown} disabled={isLast} className="w-5 h-5 flex items-center justify-center border border-ink-10 text-ink/40 hover:text-harbor hover:border-harbor disabled:opacity-20 disabled:cursor-not-allowed">
            <ChevronDown size={10} />
          </button>
        </div>
      )}
      <Icon size={18} className={inFocus ? 'text-harbor mt-0.5' : 'text-ink/30 mt-0.5'} />
      <div className="flex-1 min-w-0">
        <p className={cn('font-sans font-medium text-sm', inFocus ? 'text-ink' : 'text-ink/50')}>{habit.name}</p>
        <p className="font-sans text-xs text-ink/40 mt-0.5">{SLOT_LABELS[habit.slot] ?? habit.slot}</p>
        <p className="font-sans text-xs text-ink/40 mt-1 leading-snug">{habit.defaultVersion}</p>
      </div>
      <div className="flex flex-col gap-1 items-end">
        <button
          onClick={onToggle}
          disabled={disabled && !inFocus}
          className={cn('w-7 h-7 flex items-center justify-center border transition-colors',
            inFocus ? 'border-brick text-brick hover:bg-brick hover:text-white'
              : disabled ? 'border-ink-10 text-ink/20 cursor-not-allowed'
              : 'border-sage text-sage hover:bg-sage hover:text-white',
          )}
          title={inFocus ? 'Remove from focus' : disabled ? 'Unlock more slots first' : 'Add to focus'}
        >
          {disabled && !inFocus ? <span className="text-xs">🔒</span> : inFocus ? <Minus size={12} /> : <Plus size={12} />}
        </button>
        <button onClick={onEdit} className="w-7 h-7 flex items-center justify-center border border-ink-10 text-ink/30 hover:text-harbor hover:border-harbor transition-colors">
          <Pencil size={11} />
        </button>
        {confirmDelete ? (
          <button
            onClick={() => { setConfirmDelete(false); onDelete() }}
            className="w-7 h-7 flex items-center justify-center border border-brick text-brick bg-brick/5"
            title="Tap again to delete"
          >
            <Trash2 size={11} />
          </button>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            onBlur={() => setTimeout(() => setConfirmDelete(false), 200)}
            className="w-7 h-7 flex items-center justify-center border border-ink-10 text-ink/20 hover:text-brick hover:border-brick transition-colors"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  )
}

export function FocusScreen() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [slotData, setSlotData] = useState<SlotData>({ slotsUnlocked: 1, streaks: [], nextUnlock: null })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

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
  const MAX_SLOTS = 3

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

  async function saveEdit(id: string, form: HabitFormState) {
    await api.patch(`/api/habits/${id}`, form)
    setEditingId(null)
    loadData()
  }

  async function createHabit(form: HabitFormState) {
    await api.post('/api/habits', form)
    setAddOpen(false)
    loadData()
  }

  async function deleteHabit(id: string) {
    await api.del(`/api/habits/${id}`)
    loadData()
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Focus</h1>
      <p className="font-sans text-sm text-ink/50 mb-4">Build one habit solid before adding the next.</p>

      {/* Slot bar */}
      <div className="mb-2 flex gap-1">
        {Array.from({ length: MAX_SLOTS }).map((_, i) => (
          <div key={i} className={cn('h-1.5 flex-1', i < focusHabits.length ? 'bg-harbor' : i < slotsUnlocked ? 'bg-ink/15' : 'bg-ink/5')} />
        ))}
      </div>
      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-xs text-ink/40">{focusHabits.length}/{slotsUnlocked} used · {slotsUnlocked}/{MAX_SLOTS} unlocked</span>
        {slotsUnlocked < MAX_SLOTS && <span className="font-sans text-xs text-ochre">Slot {slotsUnlocked + 1} locked</span>}
      </div>

      {/* Next unlock progress */}
      {nextUnlock && streaks.length > 0 && (
        <div className="mb-5 border border-ink-10 bg-white p-4">
          <p className="font-sans text-[10px] font-medium text-ink/40 uppercase tracking-widest mb-3">Next unlock — slot {nextUnlock.targetSlots}</p>
          {streaks.map((s) => {
            const pct = Math.min(100, Math.round((s.streak / s.target) * 100))
            return (
              <div key={s.habitId} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-sans text-xs text-ink/70">{s.habitName}</span>
                  <span className={cn('font-mono text-xs', s.streak >= s.target ? 'text-sage' : 'text-ink/40')}>{s.streak}/{s.target} days</span>
                </div>
                <div className="h-1 bg-ink/10 w-full">
                  <div className={cn('h-full transition-all', s.streak >= s.target ? 'bg-sage' : 'bg-harbor')} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          <p className="font-sans text-xs text-ink/40 mt-3">{nextUnlock.requirement}</p>
        </div>
      )}

      {slotsUnlocked === MAX_SLOTS && (
        <div className="mb-5 px-3 py-2 bg-sage/10 border border-sage/30">
          <p className="font-sans text-xs text-sage font-medium">All slots unlocked.</p>
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
                  <HabitCard
                    habit={h} inFocus={true} onToggle={() => toggleFocus(h)} disabled={false}
                    onEdit={() => setEditingId(editingId === h.id ? null : h.id)}
                    onDelete={() => deleteHabit(h.id)}
                    showReorder={focusHabits.length > 1} isFirst={i === 0} isLast={i === focusHabits.length - 1}
                    onUp={() => reorder(i, 'up')} onDown={() => reorder(i, 'down')}
                  />
                  {editingId === h.id && (
                    <HabitForm
                      initial={{ name: h.name, slot: h.slot, icon: h.icon, defaultVersion: h.defaultVersion, fallbackVersion: h.fallbackVersion }}
                      onSave={(f) => saveEdit(h.id, f)}
                      onCancel={() => setEditingId(null)}
                      saveLabel="Update"
                    />
                  )}
                  {streak && streak.streak > 0 && editingId !== h.id && (
                    <div className="px-4 py-1.5 border-x border-b border-ink-10 bg-parchment/40 flex items-center gap-2">
                      <div className={cn('w-2 h-2', streak.streak >= streak.target ? 'bg-sage' : 'bg-harbor')} />
                      <span className="font-mono text-xs text-ink/50">
                        {streak.streak} day streak{streak.streak >= streak.target ? ' ✓' : ` · ${streak.target - streak.streak} to unlock`}
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
      <section>
        <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest mb-2">Backlog</h2>
        {atCap && (
          <p className="font-sans text-xs text-ink/50 mb-3 px-3 py-2 bg-ink/5 border border-ink-10">
            {slotsUnlocked < MAX_SLOTS ? `Keep current habits for 7 days to unlock slot ${slotsUnlocked + 1}.` : 'Remove a habit from focus to swap.'}
          </p>
        )}
        <div className="flex flex-col gap-2">
          {backlog.map((h) => (
            <div key={h.id}>
              <HabitCard
                habit={h} inFocus={false} onToggle={() => toggleFocus(h)} disabled={atCap}
                onEdit={() => setEditingId(editingId === h.id ? null : h.id)}
                onDelete={() => deleteHabit(h.id)}
                showReorder={false} isFirst={true} isLast={true} onUp={() => {}} onDown={() => {}}
              />
              {editingId === h.id && (
                <HabitForm
                  initial={{ name: h.name, slot: h.slot, icon: h.icon, defaultVersion: h.defaultVersion, fallbackVersion: h.fallbackVersion }}
                  onSave={(f) => saveEdit(h.id, f)}
                  onCancel={() => setEditingId(null)}
                  saveLabel="Update"
                />
              )}
            </div>
          ))}
        </div>

        {/* Add habit */}
        <div className="mt-3">
          {addOpen ? (
            <HabitForm initial={EMPTY_FORM} onSave={createHabit} onCancel={() => setAddOpen(false)} saveLabel="Add habit" />
          ) : (
            <button
              onClick={() => setAddOpen(true)}
              className="w-full border border-dashed border-ink-10 py-3 flex items-center justify-center gap-2 text-xs font-sans text-ink/40 hover:text-harbor hover:border-harbor transition-colors"
            >
              <Plus size={13} /> Add custom habit
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
