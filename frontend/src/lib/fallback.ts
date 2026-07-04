import type { Habit } from '@/types/habit'
import type { Checkin } from '@/types/checkin'

interface FallbackPlan {
  summary: string
  newHabitId?: string
  newHabitReason?: string
}

export function buildFallbackPlan(
  focusHabits: Habit[],
  backlog: Habit[],
  recentCheckins: Checkin[],
): FallbackPlan {
  if (focusHabits.length === 0) {
    const first = backlog.find((h) => h.id === 'sleep') ?? backlog[0]
    if (first) {
      return {
        summary: `Start with one habit this week: ${first.name}. Anchor every other change to getting this right first.`,
        newHabitId: first.id,
        newHabitReason: 'Start with one habit — focus beats multitasking.',
      }
    }
    return { summary: 'Add your first habit from the Focus tab to get started.' }
  }

  const checkinsLast7 = recentCheckins.filter((c) => {
    const days = (Date.now() - new Date(c.date).getTime()) / 86400000
    return days <= 7
  })

  const rates: Record<string, { done: number; total: number }> = {}
  for (const h of focusHabits) {
    rates[h.id] = { done: 0, total: 0 }
  }
  for (const c of checkinsLast7) {
    if (rates[c.habitId]) {
      rates[c.habitId].total++
      if (c.status === 'done' || c.status === 'partial') rates[c.habitId].done++
    }
  }

  const struggling = focusHabits.filter((h) => {
    const r = rates[h.id]
    return r.total >= 3 && r.done / r.total < 0.5
  })

  const steady = focusHabits.filter((h) => {
    const r = rates[h.id]
    return r.total >= 5 && r.done / r.total >= 0.7
  })

  const canAddNew = steady.length >= focusHabits.length && focusHabits.length < 3
  const nextHabit = canAddNew ? backlog[0] : undefined

  let summary = ''

  if (struggling.length > 0) {
    const names = struggling.map((h) => h.name).join(', ')
    summary = `${names} had a tough week — that's fine. Stick to the fallback version this week, not the full version. Don't add anything new yet.`
  } else if (nextHabit) {
    summary = `${steady.map((h) => h.name).join(' and ')} ${steady.length === 1 ? 'is' : 'are'} holding steady. Good time to add ${nextHabit.name} this week.`
  } else {
    const names = focusHabits.map((h) => h.name).join(', ')
    summary = `Keep going with ${names}. Consistency this week, no changes.`
  }

  return {
    summary,
    newHabitId: nextHabit?.id,
    newHabitReason: nextHabit ? `${steady.map((h) => h.name).join(' and ')} has been steady — ready to layer in ${nextHabit.name}.` : undefined,
  }
}
