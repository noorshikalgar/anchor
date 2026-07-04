import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function YouScreen() {
  const { user, setUser } = useAuthStore()
  const { focusCap, aiEnabled, setFocusCap, setAiEnabled } = useAppStore()
  const [nameInput, setNameInput] = useState(user?.name ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => { setNameInput(user?.name ?? '') }, [user])

  async function saveName() {
    const updated = await api.patch<{ id: string; email: string; name: string }>('/api/settings/name', { name: nameInput.trim() || user?.name })
    setUser({ ...user!, name: updated.name })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function handleAiToggle() {
    const next = !aiEnabled
    setAiEnabled(next)
    await api.patch('/api/settings', { aiEnabled: next })
  }

  async function logout() {
    await api.post('/auth/logout', {})
    setUser(null)
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="font-display text-2xl font-semibold text-ink mb-5">You</h1>

      <section className="mb-6">
        <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest mb-3">Profile</h2>
        <div className="border border-ink-10 bg-white p-4">
          <p className="font-sans text-xs text-ink/40 mb-1">{user?.email}</p>
          <label className="font-sans text-xs text-ink/50 block mb-1 mt-3">Display name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              className="flex-1 border border-ink-10 px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor bg-parchment/30"
            />
            <button onClick={saveName} className="px-4 py-2 bg-harbor text-parchment text-sm font-sans font-medium">
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest mb-3">Settings</h2>
        <div className="border border-ink-10 bg-white divide-y divide-ink-10">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-sans text-sm font-medium text-ink">Focus cap</p>
              <p className="font-sans text-xs text-ink/40 mt-0.5">Max habits in focus at once</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFocusCap(Math.max(1, focusCap - 1))} className="w-8 h-8 border border-ink-10 flex items-center justify-center font-mono text-sm text-ink hover:border-harbor">−</button>
              <span className="font-mono text-sm w-4 text-center text-ink">{focusCap}</span>
              <button onClick={() => setFocusCap(Math.min(5, focusCap + 1))} className="w-8 h-8 border border-ink-10 flex items-center justify-center font-mono text-sm text-ink hover:border-harbor">+</button>
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-sans text-sm font-medium text-ink">AI planning</p>
              <p className="font-sans text-xs text-ink/40 mt-0.5">{aiEnabled ? 'On — AI proposes weekly plan' : 'Off — rule-based planner active'}</p>
            </div>
            <button
              onClick={handleAiToggle}
              className={cn('px-3 py-1.5 border text-xs font-sans font-medium transition-colors min-w-[48px] text-center',
                aiEnabled ? 'bg-harbor border-harbor text-parchment' : 'bg-white border-ink-10 text-ink/50 hover:border-harbor hover:text-harbor'
              )}
            >
              {aiEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest mb-3">Account</h2>
        <div className="border border-ink-10 bg-white p-4">
          <p className="font-sans text-xs text-ink/50 mb-3">All data is stored on your server. Nothing leaves it.</p>
          <button onClick={logout} className="px-4 py-2 border border-ink-10 text-ink/60 text-sm font-sans font-medium hover:border-brick hover:text-brick transition-colors">
            Sign out
          </button>
        </div>
      </section>
    </div>
  )
}
