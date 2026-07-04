import { useState } from 'react'
import { db } from '@/lib/db'
import { seedHabits } from '@/lib/habitLibrary'
import { useAppStore } from '@/lib/store'

interface OnboardingScreenProps {
  onDone: () => void
}

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const { setUserName } = useAppStore()
  const [name, setName] = useState('')

  async function handleStart() {
    const trimmed = name.trim()
    setUserName(trimmed || 'there')
    const count = await db.habits.count()
    if (count === 0) {
      await db.habits.bulkAdd(seedHabits())
    }
    onDone()
  }

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center px-6 max-w-md mx-auto">
      <div className="w-full">
        <div className="mb-8">
          <div className="w-10 h-10 border-2 border-harbor mb-6 flex items-center justify-center">
            <div className="w-4 h-4 bg-harbor" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink leading-tight mb-3">
            Anchor
          </h1>
          <p className="font-sans text-sm text-ink/60 leading-relaxed">
            A habit planner that survives real life — late nights, guests,
            work that doesn't stop at 6pm.
          </p>
        </div>

        <div className="border border-ink-10 bg-white p-5 mb-4">
          <label className="font-sans text-xs text-ink/50 block mb-2">What should we call you?</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="Your name"
            autoFocus
            className="w-full border border-ink-10 px-3 py-2.5 text-sm font-sans text-ink outline-none focus:border-harbor bg-parchment/30"
          />
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3 bg-harbor text-parchment font-sans font-medium text-sm"
        >
          Get started
        </button>

        <p className="font-sans text-xs text-ink/30 text-center mt-4">
          All data stays on your device
        </p>
      </div>
    </div>
  )
}
