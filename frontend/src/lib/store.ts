import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  userName: string
  focusCap: number
  aiEnabled: boolean
  weekStartsOn: 0 | 1
  setUserName: (name: string) => void
  setFocusCap: (cap: number) => void
  setAiEnabled: (enabled: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userName: 'there',
      focusCap: 3,
      aiEnabled: false,
      weekStartsOn: 1,
      setUserName: (name) => set({ userName: name }),
      setFocusCap: (cap) => set({ focusCap: cap }),
      setAiEnabled: (enabled) => set({ aiEnabled: enabled }),
    }),
    { name: 'anchor-settings' },
  ),
)
