# 07 — UX Flows & Information Architecture

## Platform & shape

Mobile-first responsive web app (works great at ~390px width, scales up
cleanly to desktop/tablet — this becomes a Claude Code artifact/PWA-style app,
not two separate native apps). Bottom tab navigation on mobile widths,
left rail on desktop widths.

## Top-level navigation (4 tabs, deliberately not more)

1. **Today** — the default screen on open. Today's slot stack, check-in
   controls, "What should I do now?" button (A2), disrupted-day toggle (F6).
2. **Focus** — the current-focus habit set + backlog. Where habits get
   added/removed/edited, where "graduation" from the AI plan gets reviewed.
3. **Week** — the weekly plan proposal (A1) and the weekly review narrative
   (A3), plus a simple 7-day grid of completion per current habit.
4. **You** — settings (F8), streak/pattern history (F4), data export.

## Key flow: first-time setup (must be short — under 2 minutes)

1. Welcome screen — one sentence of value prop, no lecture.
2. "What's on your mind?" — multi-select from the habit library categories
   (Sleep, Diet, Exercise, Deep work/learning, Reading, Grooming, Digital
   habits) — this seeds the Backlog, not the focus set.
3. App explains, in one short screen, the sequencing principle: "We'll start
   with just one or two of these and add more as they stick. Which feels most
   overdue right now?" → person picks, or accepts the app's rule-based
   suggestion (Sleep first, per product principles) — this seeds Focus.
4. Done — lands on Today screen with the first day's check-in ready.

## Key flow: daily check-in (must be under 15 seconds)

Today screen shows each current-focus habit as a row with three tap targets
(Done / Partial / Missed). Tapping Partial or Missed reveals the reason-chip
row inline (no new screen, no modal that blocks the rest of the list). No
required text entry. Confirmation is a subtle inline state change, not a full
screen or popup animation.

## Key flow: weekly plan proposal

1. Sunday (or person's chosen week-start) — a card appears at the top of
   Today: "Your plan for this week is ready." Tapping it opens the Week tab
   scrolled to the proposal.
2. Proposal shown as a short readable card: what stays, what's new, what's
   shrunk, why — plus the 2–4 sentence summary from A1.
3. Three actions always visible: Accept / Adjust / Skip this week. Adjust
   opens the same card in an editable state (toggle habits in/out, doesn't
   require typing).

## Key flow: disrupted-day mode

One switch on the Today screen, always visible but unobtrusive (not a big red
warning — a calm toggle). Flipping it swaps visible habit copy to fallback
versions and changes the check-in framing ("Wake-up time" instead of full
sleep routine, etc). If the AI proactively suggested this (A1 disruption
prediction), it's pre-suggested with one tap to confirm, not auto-applied.

## Empty / low-data states

- First week: no streak charts yet — replace with the seeded focus habit and
  a short "building your first week of data" message, not an empty broken
  chart.
- If AI is off or unreachable: Week tab shows the rule-based fallback plan
  with a small note explaining AI planning is unavailable, not an error
  screen.

## Accessibility & resilience baseline

- Full keyboard navigation and visible focus states (desktop widths).
- Color is never the only signal for Done/Partial/Missed — use icon shape +
  color together.
- Respect `prefers-reduced-motion`.
- Works fully offline for check-ins (F2); AI features queue and sync when
  back online.
