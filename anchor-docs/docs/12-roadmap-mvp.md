# 12 — Roadmap & MVP Phasing

Build in phases. Ship and get real reactions before moving to the next phase
— do not build all of this in one pass.

## Phase 0 — Skeleton & core logging (no AI yet)

- Project scaffold: Vite + React + TS + Tailwind + shadcn/ui installed and
  themed with the tokens from `08-design-system.md`.
- Habit library seeded (F1), Today screen with check-in (F2), basic slot
  stacking (F3, simple ordered list is enough — no drag-and-drop needed yet).
- Dexie local storage wired up, Settings screen with focus cap + AI toggle
  (default off until Phase 2).
- Rule-based fallback planner (`11-ai-integration-prompts.md` fallback
  section) powering the Week tab — this alone delivers real value
  (sequencing) even with zero AI.
- Disrupted-day toggle (F6).

**Definition of done for Phase 0:** a person can install this, do first-time
setup in under 2 minutes, log a day in under 15 seconds, and get a sensible
(rule-based) next-habit suggestion after a week of steady use.

## Phase 1 — Polish core UX + streaks/patterns

- Week-strip signature component, full visual polish pass per design system.
- Streak counters + basic pattern insight (F4).
- Weekly review screen (F5) using rule-based/template narrative (no AI yet).
- PWA installability, offline support hardened.

## Phase 2 — AI layer

- Server-side `/api/plan` endpoint, Anthropic API integration per
  `11-ai-integration-prompts.md`.
- A1 (weekly plan proposal) replacing the rule-based planner as the default
  when AI is enabled — fallback stays in code permanently, not deleted.
- A3 (weekly review narrative) replacing the template version.
- Settings toggle to turn AI off and confirm fallback still works end-to-end.

## Phase 3 — In-the-moment assistance & reminders

- A2 ("What should I do now?") button and logic.
- Notifications (F7) — minimal, respectful, per product principles.
- Data export/import polish (F8).

## Explicit cut lines (do not build unless the person asks)

- No social/sharing features, ever, unless explicitly requested later —
  contradicts positioning (`03-competitive-research.md`).
- No gamification (XP, avatars, pets) — contradicts principle 7.
- No open-ended AI chat surface in MVP — structured suggestions only
  (`06-feature-spec-ai.md`).
- No native iOS/Android app until the PWA has been used and validated —
  don't build three codebases before validating one.

## Suggested first Claude Code session

1. Scaffold the project and get Phase 0's Today screen rendering with dummy
   data, styled per `08-design-system.md`.
2. Wire Dexie + Zustand for real persistence.
3. Implement the rule-based fallback planner and the Week tab.
4. Only then move to Phase 1 polish — resist jumping to the AI integration
   before the core loop feels good to use.
