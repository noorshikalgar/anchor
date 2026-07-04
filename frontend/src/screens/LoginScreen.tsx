import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'

interface Props {
  onRegister: () => void
}

export function LoginScreen({ onRegister }: Props) {
  const { setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'login' | 'reset'>('login')

  const [resetEmail, setResetEmail] = useState('')
  const [resetNewPw, setResetNewPw] = useState('')
  const [resetAdminKey, setResetAdminKey] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetDone, setResetDone] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await api.post<{ id: string; email: string; name: string }>('/auth/login', { email, password })
      setUser(user)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setResetError('')
    setResetLoading(true)
    try {
      await api.post('/auth/reset-password', { email: resetEmail, newPassword: resetNewPw, adminKey: resetAdminKey })
      setResetDone(true)
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center justify-center px-6 max-w-md mx-auto">
      <div className="w-full">
        <div className="mb-8">
          <div className="w-10 h-10 border-2 border-harbor mb-6 flex items-center justify-center">
            <div className="w-4 h-4 bg-harbor" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink mb-1">Anchor</h1>
          <p className="font-sans text-sm text-ink/50">Stay anchored, even when the day isn't.</p>
        </div>

        {view === 'login' ? (
          <>
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <div className="border border-ink-10 bg-white p-4 flex flex-col gap-3">
                <div>
                  <label className="font-sans text-xs text-ink/50 block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full border border-ink-10 px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor bg-parchment/30"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs text-ink/50 block mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full border border-ink-10 px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor bg-parchment/30"
                  />
                </div>
              </div>

              {error && <p className="font-sans text-xs text-brick px-1">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-harbor text-parchment font-sans font-medium text-sm disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="flex items-center justify-between mt-4">
              <p className="font-sans text-xs text-ink/40">
                No account?{' '}
                <button onClick={onRegister} className="text-harbor underline">Create one</button>
              </p>
              <button onClick={() => setView('reset')} className="font-sans text-xs text-ink/40 hover:text-ink/60 underline">
                Forgot password?
              </button>
            </div>
          </>
        ) : resetDone ? (
          <div className="border border-sage bg-sage/5 p-4 mb-4">
            <p className="font-sans text-sm text-ink font-medium mb-1">Password reset.</p>
            <p className="font-sans text-xs text-ink/50 mb-3">You can now sign in with the new password.</p>
            <button onClick={() => { setView('login'); setResetDone(false) }} className="font-sans text-xs text-harbor underline">
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <p className="font-sans text-xs text-ink/50 mb-4">
              Ask your admin for the reset key, then set a new password below.
            </p>
            <form onSubmit={handleReset} className="flex flex-col gap-3">
              <div className="border border-ink-10 bg-white p-4 flex flex-col gap-3">
                <div>
                  <label className="font-sans text-xs text-ink/50 block mb-1">Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full border border-ink-10 px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor bg-parchment/30"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs text-ink/50 block mb-1">New password</label>
                  <input
                    type="password"
                    value={resetNewPw}
                    onChange={(e) => setResetNewPw(e.target.value)}
                    required
                    minLength={8}
                    className="w-full border border-ink-10 px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor bg-parchment/30"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs text-ink/50 block mb-1">Admin reset key</label>
                  <input
                    type="password"
                    value={resetAdminKey}
                    onChange={(e) => setResetAdminKey(e.target.value)}
                    required
                    className="w-full border border-ink-10 px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor bg-parchment/30"
                  />
                </div>
              </div>

              {resetError && <p className="font-sans text-xs text-brick px-1">{resetError}</p>}

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3 bg-harbor text-parchment font-sans font-medium text-sm disabled:opacity-50"
              >
                {resetLoading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>

            <button onClick={() => setView('login')} className="font-sans text-xs text-ink/40 hover:text-ink/60 underline mt-4 block">
              Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  )
}
