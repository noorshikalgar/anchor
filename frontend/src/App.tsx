import { useState, useEffect } from 'react'
import { Layout, type Screen } from '@/components/Layout'
import { TodayScreen } from '@/screens/TodayScreen'
import { FocusScreen } from '@/screens/FocusScreen'
import { WeekScreen } from '@/screens/WeekScreen'
import { YouScreen } from '@/screens/YouScreen'
import { OnboardingScreen } from '@/screens/OnboardingScreen'
import { useAppStore } from '@/lib/store'

export default function App() {
  const { userName } = useAppStore()
  const [onboarded, setOnboarded] = useState<boolean | null>(null)
  const [screen, setScreen] = useState<Screen>('today')

  useEffect(() => {
    setOnboarded(userName !== 'there' || localStorage.getItem('anchor-onboarded') === 'true')
  }, [userName])

  function handleOnboardingDone() {
    localStorage.setItem('anchor-onboarded', 'true')
    setOnboarded(true)
  }

  if (onboarded === null) return null

  if (!onboarded) {
    return <OnboardingScreen onDone={handleOnboardingDone} />
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
