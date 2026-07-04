export interface WeekPlan {
  id: string
  weekStart: string
  focusHabitIds: string[]
  newHabitId?: string
  newHabitReason?: string
  summary: string
  source: 'ai' | 'rule-based'
  accepted: boolean
  createdAt: number
}
