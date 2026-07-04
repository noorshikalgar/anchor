import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  aiEnabled: boolean
  weekStartsOn: 0 | 1
  setAiEnabled: (enabled: boolean) => void
  setWeekStartsOn: (day: 0 | 1) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      aiEnabled: false,
      weekStartsOn: 1,
      setAiEnabled: (enabled) => set({ aiEnabled: enabled }),
      setWeekStartsOn: (day) => set({ weekStartsOn: day }),
    }),
    { name: 'anchor-settings' },
  ),
)
