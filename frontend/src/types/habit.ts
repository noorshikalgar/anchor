export type HabitCategory =
  | 'sleep'
  | 'diet'
  | 'exercise'
  | 'deep-work'
  | 'reading'
  | 'grooming'
  | 'digital-wellbeing'
  | 'custom'

export type SlotAnchor =
  | 'morning'
  | 'after-breakfast'
  | 'midday'
  | 'after-work'
  | 'after-dinner'
  | 'before-sleep'
  | 'anytime'

export interface Habit {
  id: string
  name: string
  category: HabitCategory
  icon: string
  defaultVersion: string
  fallbackVersion: string
  slot: SlotAnchor
  inFocus: 0 | 1
  focusOrder: number
  createdAt: number
}
