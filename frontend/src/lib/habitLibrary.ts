import type { Habit } from '@/types/habit'

export const STARTER_HABITS: Omit<Habit, 'inFocus' | 'focusOrder' | 'createdAt'>[] = [
  {
    id: 'sleep',
    name: 'Sleep',
    category: 'sleep',
    icon: 'moon',
    defaultVersion: 'Lights out by 11pm, up by 6:30am',
    fallbackVersion: 'Wake-up at 6:30am regardless of when you slept',
    slot: 'before-sleep',
  },
  {
    id: 'diet',
    name: 'Diet',
    category: 'diet',
    icon: 'salad',
    defaultVersion: 'No junk food after 9pm, drink 2L water',
    fallbackVersion: 'Just drink water today, skip the junk rule',
    slot: 'after-dinner',
  },
  {
    id: 'gym',
    name: 'Gym / Exercise',
    category: 'exercise',
    icon: 'dumbbell',
    defaultVersion: '45 min workout at gym',
    fallbackVersion: '10 min walk or 20 bodyweight squats at home',
    slot: 'morning',
  },
  {
    id: 'coding',
    name: 'Coding / Learning',
    category: 'deep-work',
    icon: 'code',
    defaultVersion: '45 min focused coding or course session',
    fallbackVersion: '15 min — read docs or watch one tutorial video',
    slot: 'after-dinner',
  },
  {
    id: 'reading',
    name: 'Reading',
    category: 'reading',
    icon: 'book-open',
    defaultVersion: '30 min reading before sleep',
    fallbackVersion: '10 min — read one chapter or article',
    slot: 'before-sleep',
  },
  {
    id: 'hair-care',
    name: 'Hair Care',
    category: 'grooming',
    icon: 'sparkles',
    defaultVersion: 'Oil + scalp massage 3x/week, consistent shampoo schedule',
    fallbackVersion: 'Apply oil — even 5 min counts',
    slot: 'morning',
  },
  {
    id: 'digital-detox',
    name: 'Screen Limit',
    category: 'digital-wellbeing',
    icon: 'smartphone',
    defaultVersion: 'No phone after 10pm, max 1hr YouTube/day',
    fallbackVersion: 'Put phone away 30 min before sleep',
    slot: 'before-sleep',
  },
]

export function seedHabits(): Habit[] {
  const now = Date.now()
  return STARTER_HABITS.map((h, i) => ({
    ...h,
    inFocus: 0 as const,
    focusOrder: i,
    createdAt: now,
  }))
}
