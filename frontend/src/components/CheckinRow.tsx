import { useState } from 'react'
import { Moon, Salad, Dumbbell, Code, BookOpen, Sparkles, Smartphone, Check, Minus, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Habit } from '@/types/habit'
import type { Checkin, CheckinStatus, DisruptionReason } from '@/types/checkin'

const ICONS: Record<string, LucideIcon> = {
  moon: Moon,
  salad: Salad,
  dumbbell: Dumbbell,
  code: Code,
  'book-open': BookOpen,
  sparkles: Sparkles,
  smartphone: Smartphone,
}

const DISRUPTION_REASONS: { value: DisruptionReason; label: string }[] = [
  { value: 'late-night', label: 'Late night' },
  { value: 'work-ran-long', label: 'Work ran long' },
  { value: 'guests-family', label: 'Guests / family' },
  { value: 'travel', label: 'Travel' },
  { value: 'health', label: 'Health' },
  { value: 'forgot', label: 'Forgot' },
  { value: 'other', label: 'Other' },
]

interface CheckinRowProps {
  habit: Habit
  status: CheckinStatus
  checkin?: Checkin
  disrupted: boolean
  onLog: (status: CheckinStatus, reason?: DisruptionReason, note?: string) => void
}

export function CheckinRow({ habit, status, checkin, disrupted, onLog }: CheckinRowProps) {
  const [showReason, setShowReason] = useState(false)
  // Prefill from the saved checkin so reopening the panel doesn't look blank
  const [selectedReason, setSelectedReason] = useState<DisruptionReason | null>(
    (checkin?.reason as DisruptionReason) ?? null,
  )
  const [note, setNote] = useState(checkin?.note ?? '')

  const Icon = ICONS[habit.icon] ?? Check
  const version = disrupted ? habit.fallbackVersion : habit.defaultVersion

  function handleStatus(s: CheckinStatus) {
    if (s === 'missed' || s === 'partial') {
      setShowReason(true)
      onLog(s)
    } else {
      setShowReason(false)
      onLog(s)
    }
  }

  function submitReason() {
    onLog(status, selectedReason ?? undefined, note || undefined)
    setShowReason(false)
  }

  return (
    <div className="border border-ink-10 bg-white">
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">
          <Icon size={18} className="text-harbor" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans font-medium text-ink text-sm leading-tight">{habit.name}</p>
          <p className="font-sans text-xs text-ink/50 mt-0.5 leading-snug">
            {disrupted && <span className="text-ochre font-medium">fallback · </span>}
            {version}
          </p>
          {!showReason && checkin && (checkin.reason || checkin.note) && (
            <p className="font-sans text-xs text-ink/40 mt-1 leading-snug">
              <span className={cn('font-medium', status === 'missed' ? 'text-brick' : 'text-ochre')}>
                {DISRUPTION_REASONS.find((r) => r.value === checkin.reason)?.label ?? ''}
              </span>
              {checkin.reason && checkin.note && ' — '}
              {checkin.note}
            </p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => handleStatus('done')}
            className={cn(
              'w-8 h-8 flex items-center justify-center border transition-colors',
              status === 'done'
                ? 'bg-sage border-sage text-white'
                : 'border-ink-10 text-ink/40 hover:border-sage hover:text-sage',
            )}
            title="Done"
          >
            <Check size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => handleStatus('partial')}
            className={cn(
              'w-8 h-8 flex items-center justify-center border transition-colors',
              status === 'partial'
                ? 'bg-ochre border-ochre text-white'
                : 'border-ink-10 text-ink/40 hover:border-ochre hover:text-ochre',
            )}
            title="Partial"
          >
            <Minus size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => handleStatus('missed')}
            className={cn(
              'w-8 h-8 flex items-center justify-center border transition-colors',
              status === 'missed'
                ? 'bg-brick border-brick text-white'
                : 'border-ink-10 text-ink/40 hover:border-brick hover:text-brick',
            )}
            title="Missed"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {showReason && (
        <div className="border-t border-ink-10 px-4 pb-4 pt-3 bg-parchment/40">
          <p className="font-sans text-xs text-ink/60 mb-2">What got in the way?</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {DISRUPTION_REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setSelectedReason(r.value)}
                className={cn(
                  'px-2.5 py-1 text-xs font-sans border transition-colors',
                  selectedReason === r.value
                    ? 'bg-harbor text-parchment border-harbor'
                    : 'border-ink-10 text-ink/60 hover:border-harbor',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border border-ink-10 px-3 py-1.5 text-xs font-sans text-ink placeholder:text-ink/30 outline-none focus:border-harbor bg-white"
          />
          <button
            onClick={submitReason}
            className="mt-2 px-3 py-1.5 text-xs font-sans font-medium bg-harbor text-parchment"
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}
