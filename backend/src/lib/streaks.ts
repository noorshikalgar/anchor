import { format, subDays, parseISO } from 'date-fns'

interface CheckinRow {
  habitId: string
  date: string
  status: string
}

export function computeStreak(habitId: string, checkins: CheckinRow[], today: string): number {
  let streak = 0
  let cursor = parseISO(today)

  // Start from today and walk backwards
  for (let i = 0; i < 365; i++) {
    const dateStr = format(cursor, 'yyyy-MM-dd')
    const checkin = checkins.find((c) => c.habitId === habitId && c.date === dateStr)

    if (!checkin) {
      // Today with no log yet — skip it (don't break streak for today)
      if (i === 0) { cursor = subDays(cursor, 1); continue }
      break
    }

    if (checkin.status === 'done' || checkin.status === 'partial') {
      streak++
    } else {
      // missed or pending — streak broken
      break
    }

    cursor = subDays(cursor, 1)
  }

  return streak
}

export function determineSlotsFromStreaks(streaks: number[], currentSlots: number): number {
  const habitsAt7 = streaks.filter((s) => s >= 7).length
  let earned = 1
  if (habitsAt7 >= 1) earned = 2
  if (habitsAt7 >= 2) earned = 3
  // Never revoke
  return Math.max(currentSlots, earned)
}
