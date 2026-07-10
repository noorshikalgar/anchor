import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { getPushState, subscribePush, unsubscribePush, sendTestPush } from '@/lib/push'
import { useAuthStore } from '@/lib/authStore'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface SlotData {
  slotsUnlocked: number
  nextUnlock: { targetSlots: number; requirement: string } | null
}

interface ApiKeyStatus {
  configured: boolean
  provider: string | null
  model: string | null
}

interface ModelOption {
  id: string
  displayName: string
}

export function YouScreen() {
  const { user, setUser } = useAuthStore()
  const { aiEnabled, setAiEnabled, weekStartsOn, setWeekStartsOn } = useAppStore()
  const [nameInput, setNameInput] = useState(user?.name ?? '')
  const [saved, setSaved] = useState(false)
  const [slotData, setSlotData] = useState<SlotData>({ slotsUnlocked: 1, nextUnlock: null })
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({ configured: false, provider: null, model: null })
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [keyLoading, setKeyLoading] = useState(false)
  const [keyError, setKeyError] = useState('')
  const [models, setModels] = useState<ModelOption[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const modelRef = useRef<HTMLDivElement>(null)
  const [pwOpen, setPwOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pushState, setPushState] = useState<'unsupported' | 'denied' | 'subscribed' | 'off' | 'loading'>('loading')
  const [pushError, setPushError] = useState('')
  const MAX_SLOTS = 3

  useEffect(() => {
    setNameInput(user?.name ?? '')
    api.get<SlotData>('/api/slots').then(setSlotData).catch(() => {})
    api.get<ApiKeyStatus>('/api/settings/apikey/status').then((status) => {
      setApiKeyStatus(status)
      if (status.configured) loadModels()
    }).catch(() => {})
    getPushState().then(setPushState).catch(() => setPushState('unsupported'))
  }, [user])

  async function togglePush() {
    setPushError('')
    try {
      if (pushState === 'subscribed') {
        await unsubscribePush()
        setPushState('off')
      } else {
        await subscribePush()
        setPushState('subscribed')
      }
    } catch (err: unknown) {
      setPushError(err instanceof Error ? err.message : 'Could not update notifications')
      getPushState().then(setPushState).catch(() => {})
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelOpen(false)
      }
    }
    if (modelOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [modelOpen])

  async function loadModels() {
    setModelsLoading(true)
    try {
      const { models } = await api.get<{ models: ModelOption[] }>('/api/settings/models')
      setModels(models)
    } catch {
      setModels([])
    } finally {
      setModelsLoading(false)
    }
  }

  async function handleModelChange(modelId: string) {
    setApiKeyStatus((s) => ({ ...s, model: modelId }))
    setModelOpen(false)
    await api.patch('/api/settings', { apiModel: modelId })
  }

  async function changePassword() {
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters'); return }
    setPwLoading(true)
    setPwError('')
    try {
      await api.post('/auth/change-password', { currentPassword: currentPw, newPassword: newPw })
      setPwSaved(true)
      setCurrentPw('')
      setNewPw('')
      setPwOpen(false)
      setTimeout(() => setPwSaved(false), 2000)
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setPwLoading(false)
    }
  }

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

  async function handleWeekStartChange(day: 0 | 1) {
    setWeekStartsOn(day)
    await api.patch('/api/settings', { weekStartsOn: day })
  }

  async function saveApiKey() {
    if (!apiKeyInput.trim()) return
    setKeyLoading(true)
    setKeyError('')
    try {
      const res = await api.put<ApiKeyStatus & { masked: string }>('/api/settings/apikey', { apiKey: apiKeyInput.trim() })
      setApiKeyStatus({ configured: res.configured, provider: res.provider, model: res.model })
      loadModels()
      setApiKeyInput('')
    } catch (err: unknown) {
      setKeyError(err instanceof Error ? err.message : 'Failed to save key')
    } finally {
      setKeyLoading(false)
    }
  }

  async function removeApiKey() {
    await api.del('/api/settings/apikey')
    setApiKeyStatus({ configured: false, provider: null, model: null })
  }

  async function logout() {
    await api.post('/auth/logout', {})
    setUser(null)
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="font-display text-2xl font-semibold text-ink mb-5">You</h1>

      {/* Profile */}
      <section className="mb-6">
        <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest mb-3">Profile</h2>
        <div className="border border-ink-10 bg-white p-4">
          <p className="font-sans text-xs text-ink/40 mb-3">{user?.email}</p>
          <label className="font-sans text-xs text-ink/50 block mb-1">Display name</label>
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

      {/* Focus slots */}
      <section className="mb-6">
        <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest mb-3">Focus slots</h2>
        <div className="border border-ink-10 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-sans text-sm font-medium text-ink">Slots unlocked</span>
            <span className="font-mono text-sm text-harbor font-medium">{slotData.slotsUnlocked}/{MAX_SLOTS}</span>
          </div>
          <div className="flex gap-1 mb-3">
            {Array.from({ length: MAX_SLOTS }).map((_, i) => (
              <div key={i} className={cn('h-2 flex-1', i < slotData.slotsUnlocked ? 'bg-harbor' : 'bg-ink/10')} />
            ))}
          </div>
          {slotData.nextUnlock
            ? <p className="font-sans text-xs text-ink/50">{slotData.nextUnlock.requirement}</p>
            : <p className="font-sans text-xs text-sage">All slots unlocked. You earned them.</p>
          }
        </div>
      </section>

      {/* AI settings */}
      <section className="mb-6">
        <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest mb-3">AI planning</h2>
        <div className="border border-ink-10 bg-white divide-y divide-ink-10">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-sans text-sm font-medium text-ink">AI planning</p>
              <p className="font-sans text-xs text-ink/40 mt-0.5">
                {aiEnabled ? 'On — Gemini proposes weekly plan' : 'Off — rule-based planner active'}
              </p>
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

          {aiEnabled && (
            <div className="p-4">
              <p className="font-sans text-xs font-medium text-ink/60 mb-3">
                Gemini API key
                {apiKeyStatus.configured && (
                  <span className="ml-2 text-sage font-normal">● configured</span>
                )}
              </p>

              {apiKeyStatus.configured ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-ink/40 flex-1">Key saved — never shown again</p>
                    <button
                      onClick={removeApiKey}
                      className="flex items-center gap-1 px-2 py-1 border border-brick/40 text-brick text-xs font-sans hover:bg-brick hover:text-white transition-colors"
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>

                  <div>
                    <p className="font-sans text-xs text-ink/50 mb-1">Model</p>
                    {modelsLoading ? (
                      <p className="font-sans text-xs text-ink/30 animate-pulse">Loading models...</p>
                    ) : models.length > 0 ? (
                      <div className="relative" ref={modelRef}>
                        <button
                          onClick={() => setModelOpen((o) => !o)}
                          className="w-full border border-ink-10 bg-white px-3 py-2 text-sm font-sans text-ink text-left flex items-center justify-between focus:border-harbor outline-none"
                        >
                          <span>{models.find((m) => m.id === apiKeyStatus.model)?.displayName ?? 'Default (gemini-2.5-flash)'}</span>
                          <span className="text-ink/30 text-xs ml-2">▾</span>
                        </button>
                        {modelOpen && (
                          <div className="absolute z-10 w-full border border-ink-10 bg-white shadow-sm bottom-full mb-px max-h-48 overflow-y-auto">
                            <button
                              onClick={() => handleModelChange('')}
                              className={cn('w-full text-left px-3 py-2 text-sm font-sans hover:bg-harbor/5 transition-colors', !apiKeyStatus.model ? 'text-harbor font-medium' : 'text-ink')}
                            >
                              Default (gemini-2.5-flash)
                            </button>
                            {models.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => handleModelChange(m.id)}
                                className={cn('w-full text-left px-3 py-2 text-sm font-sans hover:bg-harbor/5 transition-colors border-t border-ink-10/50', apiKeyStatus.model === m.id ? 'text-harbor font-medium' : 'text-ink')}
                              >
                                {m.displayName}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="font-sans text-xs text-ink/30">Could not load models</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="Paste Gemini API key"
                        className="w-full border border-ink-10 px-3 py-2 pr-9 text-sm font-sans text-ink outline-none focus:border-harbor bg-parchment/30 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60"
                      >
                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <button
                      onClick={saveApiKey}
                      disabled={keyLoading || !apiKeyInput.trim()}
                      className="px-4 py-2 bg-harbor text-parchment text-sm font-sans font-medium disabled:opacity-40"
                    >
                      {keyLoading ? '...' : 'Save'}
                    </button>
                  </div>
                  {keyError && <p className="font-sans text-xs text-brick">{keyError}</p>}
                  <p className="font-sans text-xs text-ink/30">
                    Key is encrypted before storage. Never logged or shared.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Preferences */}
      <section className="mb-6">
        <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest mb-3">Preferences</h2>
        <div className="border border-ink-10 bg-white p-4">
          <p className="font-sans text-xs font-medium text-ink/60 mb-2">Week starts on</p>
          <div className="flex gap-2">
            {([1, 0] as const).map((day) => (
              <button
                key={day}
                onClick={() => handleWeekStartChange(day)}
                className={cn(
                  'flex-1 py-2 border text-xs font-sans font-medium transition-colors',
                  weekStartsOn === day
                    ? 'bg-harbor border-harbor text-parchment'
                    : 'border-ink-10 text-ink/50 hover:border-harbor hover:text-harbor',
                )}
              >
                {day === 1 ? 'Monday' : 'Sunday'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-6">
        <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest mb-3">Notifications</h2>
        <div className="border border-ink-10 bg-white p-4">
          {pushState === 'unsupported' ? (
            <p className="font-sans text-xs text-ink/40">
              Not supported in this browser. On iPhone, add Anchor to your home screen first, then enable here.
            </p>
          ) : pushState === 'denied' ? (
            <p className="font-sans text-xs text-ink/40">
              Notifications are blocked. Allow them for Anchor in your device settings, then reopen the app.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-xs font-medium text-ink/60">Evening reminder</p>
                  <p className="font-sans text-xs text-ink/40 mt-0.5">A nudge when habits are still unlogged.</p>
                </div>
                <button
                  onClick={togglePush}
                  disabled={pushState === 'loading'}
                  className={cn(
                    'px-3 py-1.5 border text-xs font-sans font-medium transition-colors',
                    pushState === 'subscribed'
                      ? 'bg-harbor border-harbor text-parchment'
                      : 'border-ink-10 text-ink/50 hover:border-harbor hover:text-harbor',
                  )}
                >
                  {pushState === 'subscribed' ? 'On' : 'Off'}
                </button>
              </div>
              {pushState === 'subscribed' && (
                <button
                  onClick={() => sendTestPush().catch(() => setPushError('Test failed — check server VAPID config'))}
                  className="mt-3 px-3 py-1.5 border border-ink-10 text-ink/50 text-xs font-sans hover:border-harbor hover:text-harbor"
                >
                  Send test notification
                </button>
              )}
              {pushError && <p className="font-sans text-xs text-brick mt-2">{pushError}</p>}
            </>
          )}
        </div>
      </section>

      {/* Account */}
      <section>
        <h2 className="font-sans text-xs font-medium text-ink/50 uppercase tracking-widest mb-3">Account</h2>
        <div className="border border-ink-10 bg-white divide-y divide-ink-10">
          <div className="p-4">
            <button
              onClick={() => { setPwOpen((o) => !o); setPwError('') }}
              className="font-sans text-sm font-medium text-ink hover:text-harbor transition-colors"
            >
              {pwOpen ? 'Cancel' : 'Change password'}
              {pwSaved && <span className="ml-2 text-sage text-xs font-normal">Changed</span>}
            </button>
            {pwOpen && (
              <div className="mt-3 flex flex-col gap-2">
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Current password"
                  className="w-full border border-ink-10 px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor bg-parchment/30"
                />
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="New password (min 8 chars)"
                  className="w-full border border-ink-10 px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor bg-parchment/30"
                />
                {pwError && <p className="font-sans text-xs text-brick">{pwError}</p>}
                <button
                  onClick={changePassword}
                  disabled={pwLoading || !currentPw || !newPw}
                  className="px-4 py-2 bg-harbor text-parchment text-sm font-sans font-medium disabled:opacity-40 self-start"
                >
                  {pwLoading ? 'Saving...' : 'Update password'}
                </button>
              </div>
            )}
          </div>
          <div className="p-4">
            <p className="font-sans text-xs text-ink/40 mb-3">All data stored on your server.</p>
            <button onClick={logout} className="px-4 py-2 border border-ink-10 text-ink/60 text-sm font-sans font-medium hover:border-brick hover:text-brick transition-colors">
              Sign out
            </button>
          </div>
          <div className="px-4 py-3">
            <p className="font-mono text-xs text-ink/25">Anchor v{__APP_VERSION__}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
