import { create } from 'zustand'

export interface CoachMessage {
  role: 'user' | 'model'
  content: string
}

interface CoachState {
  day: string
  messages: CoachMessage[]
  append: (m: CoachMessage) => void
  reset: () => void
  ensureToday: () => void
}

const today = () => new Date().toDateString()

// Session is day-scoped and in-memory by design (spec 13): no transcript retention
export const useCoachStore = create<CoachState>((set, get) => ({
  day: today(),
  messages: [],
  append: (m) => set((s) => ({ messages: [...s.messages, m] })),
  reset: () => set({ day: today(), messages: [] }),
  ensureToday: () => { if (get().day !== today()) set({ day: today(), messages: [] }) },
}))
