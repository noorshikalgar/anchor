import { CalendarDays, ListChecks, LayoutGrid, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Screen = 'today' | 'focus' | 'week' | 'you'

const TABS: { id: Screen; label: string; Icon: LucideIcon }[] = [
  { id: 'today', label: 'Today', Icon: CalendarDays },
  { id: 'focus', label: 'Focus', Icon: LayoutGrid },
  { id: 'week', label: 'Week', Icon: ListChecks },
  { id: 'you', label: 'You', Icon: User },
]

interface LayoutProps {
  screen: Screen
  onNavigate: (screen: Screen) => void
  children: React.ReactNode
}

export function Layout({ screen, onNavigate, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-parchment flex flex-col max-w-md mx-auto relative">
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-ink-10 flex">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 transition-colors font-sans text-[10px] font-medium',
              screen === id ? 'text-harbor' : 'text-ink/40',
            )}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
