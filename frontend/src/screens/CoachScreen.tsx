import { useState, useEffect, useRef } from 'react'
import { Send, RotateCcw } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { useCoachStore } from '@/lib/coachStore'

const MAX_MESSAGES = 30

const STARTERS = [
  'Sleep is not working lately',
  'I keep missing my habit on workdays',
  'Help me pick what to focus on',
]

export function CoachScreen() {
  const { aiEnabled } = useAppStore()
  const { messages, append, reset, ensureToday } = useCoachStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { ensureToday() }, [ensureToday])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const sessionFull = messages.length >= MAX_MESSAGES

  async function send(text: string) {
    const content = text.trim()
    if (!content || loading || sessionFull) return
    setError('')
    setInput('')
    append({ role: 'user', content })
    setLoading(true)
    try {
      const { reply } = await api.post<{ reply: string }>('/api/coach/message', {
        messages: [...useCoachStore.getState().messages],
      })
      append({ role: 'model', content: reply })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Coach could not respond.')
    } finally {
      setLoading(false)
    }
  }

  if (!aiEnabled) {
    return (
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-display text-2xl font-semibold text-ink mb-5">Coach</h1>
        <div className="border border-dashed border-ink-10 p-6 text-center">
          <p className="font-sans text-sm text-ink/50 mb-1">Coach is offline.</p>
          <p className="font-sans text-xs text-ink/40">
            Turn on AI planning and add your Gemini key in the You tab to talk things through.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 flex flex-col" style={{ minHeight: 'calc(100vh - 5rem)' }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold text-ink">Coach</h1>
        {messages.length > 0 && (
          <button
            onClick={reset}
            className="flex items-center gap-1 px-2 py-1 border border-ink-10 text-ink/40 text-xs font-sans hover:border-harbor hover:text-harbor"
          >
            <RotateCcw size={11} /> New session
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="border border-ink-10 bg-white p-4">
            <p className="font-sans text-sm text-ink mb-1">What's not working?</p>
            <p className="font-sans text-xs text-ink/40 mb-3">
              Talk it through — I'll look at your actual data and suggest one small change. I can't change anything myself; you stay in control.
            </p>
            <div className="flex flex-col gap-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left px-3 py-2 border border-ink-10 text-xs font-sans text-ink/60 hover:border-harbor hover:text-harbor"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              'max-w-[85%] px-3 py-2 font-sans text-sm leading-relaxed whitespace-pre-wrap',
              m.role === 'user'
                ? 'self-end bg-harbor text-parchment'
                : 'self-start bg-white border border-ink-10 text-ink',
            )}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="self-start px-3 py-2 bg-white border border-ink-10">
            <span className="font-sans text-xs text-ink/40 animate-pulse">Coach is thinking…</span>
          </div>
        )}
        {error && <p className="font-sans text-xs text-brick px-1">{error}</p>}
        {sessionFull && (
          <p className="font-sans text-xs text-ink/40 px-1">
            Session is full — start a new one to keep going.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-20 mt-3 flex gap-2 bg-parchment pt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(input) }}
          placeholder={sessionFull ? 'Session full' : 'Tell the coach what’s up…'}
          maxLength={1000}
          disabled={loading || sessionFull}
          className="flex-1 border border-ink-10 bg-white px-3 py-2 text-sm font-sans text-ink outline-none focus:border-harbor placeholder:text-ink/25 disabled:opacity-50"
        />
        <button
          onClick={() => send(input)}
          disabled={loading || sessionFull || !input.trim()}
          className="px-3 border border-harbor bg-harbor text-parchment disabled:opacity-40"
          aria-label="Send"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
