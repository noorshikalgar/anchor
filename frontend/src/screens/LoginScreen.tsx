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

          {error && (
            <p className="font-sans text-xs text-brick px-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-harbor text-parchment font-sans font-medium text-sm disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="font-sans text-xs text-ink/40 text-center mt-4">
          No account?{' '}
          <button onClick={onRegister} className="text-harbor underline">
            Create one
          </button>
        </p>
      </div>
    </div>
  )
}
