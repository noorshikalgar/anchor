import { useState, useEffect } from 'react'
import { Layout, type Screen } from '@/components/Layout'
import { TodayScreen } from '@/screens/TodayScreen'
import { FocusScreen } from '@/screens/FocusScreen'
import { WeekScreen } from '@/screens/WeekScreen'
import { YouScreen } from '@/screens/YouScreen'
import { LoginScreen } from '@/screens/LoginScreen'
import { RegisterScreen } from '@/screens/RegisterScreen'
import { useAuthStore } from '@/lib/authStore'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'

export default function App() {
  const { user, setUser, loading, setLoading } = useAuthStore()
  const { setWeekStartsOn } = useAppStore()
  const [screen, setScreen] = useState<Screen>('today')
  const [authView, setAuthView] = useState<'login' | 'register'>('login')

  useEffect(() => {
    api.get<{ id: string; email: string; name: string }>('/auth/me')
      .then((u) => {
        setUser(u)
        api.get<{ weekStartsOn: 0 | 1 }>('/api/settings')
          .then((s) => setWeekStartsOn(s.weekStartsOn))
          .catch(() => {})
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [setUser, setLoading, setWeekStartsOn])

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
      {screen === 'you' && <YouScreen />}
    </Layout>
  )
}
