import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  aiEnabled: boolean
  weekStartsOn: 0 | 1
  setAiEnabled: (enabled: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      aiEnabled: false,
      weekStartsOn: 1,
      setAiEnabled: (enabled) => set({ aiEnabled: enabled }),
    }),
    { name: 'anchor-settings' },
  ),
)
