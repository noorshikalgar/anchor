# 13 — AI Coach Chat (Phase D)

> Status: **approved design, not yet built**. Supersedes the MVP-era "no chat"
> rule in `06-feature-spec-ai.md` — that rule was correct for MVP and stays in
> force until Phase D starts. This doc defines the only kind of chat Anchor
> will ever ship.

## What it is — and is not

A **coach**, scoped to habits. The person talks about what's not working in
life terms; the coach reasons over their real data, guides toward one small
change at a time, and applies that change through the app's own primitives —
with explicit confirmation.

Not: a companion chatbot, a therapist, a general assistant, a diet/medical
adviser (see non-goals in `01-problem-statement.md`). The chat is an optional
convenience layer: **everything it can do must remain doable in the normal
UI**, so the app stays fully functional with AI off (F8 principle).

## Core loop

1. Person opens chat when stuck ("gym is just not happening").
2. Every message to the model carries a fresh **state snapshot**: focus habits,
   last 2 weeks of check-ins, disruption reason counts, day notes, backlog.
   The model never relies on chat memory for facts it can read from the DB.
3. Coach asks at most 1–2 clarifying questions, then proposes **one** small
   change, grounded in the snapshot ("4 of 5 gym misses say 'work ran long'").
4. Changes are **tool calls**, rendered as action cards with Confirm / Cancel:
   `create_habit`, `update_habit`, `archive_habit`, `set_focus`,
   `add_life_event`, `query_history`, `regenerate_plan`.
5. On confirm, the server validates and executes, and writes an audit row
   (`actor: ai-chat`).

## Hard rules (enforced server-side, not just in the prompt)

- **One write per session.** Server rejects a second write tool call.
- **No delete tools exist.** Archive only. Account/data deletion lives in
  Settings, never in chat.
- All tool targets validated against the session's `userId`. The model never
  sees or chooses user IDs.
- If a habit has been edited more than twice in 30 days, the coach must name
  the pattern ("we keep shrinking this — talk about why?") instead of
  complying again.

## Tone and safety

- Encouragement must cite real numbers from the snapshot; never fabricated
  praise. "Never miss twice" framing over streak guilt.
- Distress signals → acknowledge, suggest talking to a person, stop coaching.
- Diet/medical requests → redirect to habit-shaped versions, no numbers,
  no prescriptions.
- Mirror the person's language/register (incl. Hinglish).

## Sessions and memory

- A session is one conversation, capped ~30 messages, day-scoped.
- On close (or 30 min idle), a cheap summarization call produces
  `coach_notes` (< 200 words: problem, decision, commitment).
- Both the next chat session **and the weekly planner** read `coach_notes` —
  chat on Tuesday about travel means Monday's plan already knows.
- Verbatim messages are not kept beyond the session.

## Failure modes and handling

| Failure | Handling |
|---|---|
| Model cites wrong stats | Only snapshot numbers citable; stats render as UI cards from DB where possible |
| Wrong tool args | Confirm card shows exact diff; server validates; audit log |
| Coach becomes a yes-man | One-write cap + edit-frequency rule above |
| Off-topic use | Prompt scope + redirect; per-day message rate limit; message length cap |
| Gemini down / no key | Chat shows honest "coach offline"; core app unaffected |
| "Delete everything, I quit" | No delete tools; offer pause-all (archive focus); point to Settings |

## Build order (each independently shippable)

- **D1** Read-only coach: conversation + advice, zero writes. (~3–4 days)
- **D2** Tool calls + confirm cards + audit. (~1–2 weeks)
- **D3** Session summaries (`coach_notes`) feeding the weekly planner.
- **D4** Proactive check-ins via push notifications (needs `14`-era infra
  from the notifications feature, shipped v0.7.x).

## Explicit non-features

- No open-ended companion mode, no personality settings, no voice.
- No chat-only capabilities — parity with structured UI is a hard invariant.
- No retention of raw chat transcripts across sessions.
