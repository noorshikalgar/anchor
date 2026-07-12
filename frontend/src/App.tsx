import { useState, useEffect } from 'react'
import { Layout, type Screen } from '@/components/Layout'
import { TodayScreen } from '@/screens/TodayScreen'
import { FocusScreen } from '@/screens/FocusScreen'
import { WeekScreen } from '@/screens/WeekScreen'
import { CoachScreen } from '@/screens/CoachScreen'
import { YouScreen } from '@/screens/YouScreen'
import { LoginScreen } from '@/screens/LoginScreen'
import { RegisterScreen } from '@/screens/RegisterScreen'
import { useAuthStore } from '@/lib/authStore'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'

export default function App() {
  const { user, setUser, loading, setLoading } = useAuthStore()
  const { setWeekStartsOn, setAiEnabled } = useAppStore()
  const [screen, setScreen] = useState<Screen>('today')
  const [authView, setAuthView] = useState<'login' | 'register'>('login')

  useEffect(() => {
    api.get<{ id: string; email: string; name: string }>('/auth/me')
      .then((u) => setUser(u))
      .catch((err: unknown) => {
        // Only a real 401 means logged out — a network failure (offline PWA,
        // backend restart) keeps the persisted user so the app stays usable
        if ((err as { status?: number }).status === 401) setUser(null)
      })
      .finally(() => setLoading(false))
  }, [setUser, setLoading])

  // Hydrate server-side settings whenever a user is present — covers both
  // session restore and fresh form logins
  useEffect(() => {
    if (!user) return
    api.get<{ weekStartsOn: 0 | 1; aiEnabled: boolean }>('/api/settings')
      .then((s) => {
        setWeekStartsOn(s.weekStartsOn)
        setAiEnabled(s.aiEnabled)
      })
      .catch(() => {})
  }, [user, setWeekStartsOn, setAiEnabled])

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-harbor border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) {
    return authView === 'login'
      ? <LoginScreen onRegister={() => setAuthView('register')} />
      : <RegisterScreen onLogin={() => setAuthView('login')} />
  }

  return (
    <Layout screen={screen} onNavigate={setScreen}>
      {screen === 'today' && <TodayScreen />}
      {screen === 'focus' && <FocusScreen />}
      {screen === 'week' && <WeekScreen />}
      {screen === 'coach' && <CoachScreen />}
      {screen === 'you' && <YouScreen />}
    </Layout>
  )
}
