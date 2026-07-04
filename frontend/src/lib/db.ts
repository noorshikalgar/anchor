import Dexie, { type Table } from 'dexie'
import type { Habit } from '@/types/habit'
import type { Checkin, DayLog } from '@/types/checkin'
import type { WeekPlan } from '@/types/plan'

export class AnchorDB extends Dexie {
  habits!: Table<Habit>
  checkins!: Table<Checkin>
  dayLogs!: Table<DayLog>
  plans!: Table<WeekPlan>

  constructor() {
    super('anchor-db')
    this.version(1).stores({
      habits: 'id, category, inFocus, focusOrder',
      checkins: 'id, habitId, date, status',
      dayLogs: 'date',
      plans: 'id, weekStart',
    })
  }
}

export const db = new AnchorDB()
