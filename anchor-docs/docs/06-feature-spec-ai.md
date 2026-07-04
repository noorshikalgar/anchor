# 06 — AI Feature Spec

## What problem the AI is actually solving

Not chit-chat, not a generic chatbot bolted onto a tracker. The AI's job is
narrowly: **take the burden of weekly re-planning off the person's shoulders**,
using the same reasoning a thoughtful coach would use (see the sequencing and
"never miss twice" logic in `04-product-principles-vision.md`), grounded in
what actually happened last week — not generic advice.

Three AI-powered features, in priority order:

## A1. Weekly Plan Proposal (the core AI feature)

**Trigger:** automatically generated at the start of each week (person's chosen
week-start day), also re-runnable on demand.

**Input to the model:** last 1–4 weeks of check-in data — per habit: completion
rate, streak, disruption reasons logged, notes; current focus set; backlog;
any recurring pattern the person has previously confirmed (e.g. "weekends are
usually disrupted by family visits").

**Output the model must produce (structured JSON, see `11-ai-integration-prompts.md`):**
- Whether each current-focus habit should: stay as-is, get "graduated" (person
  ready for the next habit to be added), or get shrunk to its fallback version
  as the *default* for the week (not just the disrupted-day fallback) because
  it's clearly not sticking at full strength.
- At most one new habit to introduce this week, pulled from backlog, with a
  one-line reason ("Sleep's been steady for 8 days — good time to add Diet").
- A short, specific prediction of likely disruptions this week if the pattern
  data supports it ("Last 3 Sundays were disrupted by family visits — want
  Sunday habits pre-set to fallback versions?").
- 2–4 sentence plain-language summary a person can read in 10 seconds, in the
  tone defined in `04-product-principles-vision.md`.

**Person's interaction with the output:** three buttons — Accept plan / Adjust
(opens the plan pre-filled, editable) / Skip this week. Never auto-applies
without at least one screen of confirmation.

## A2. In-the-moment "what's next" suggestion

**Trigger:** person taps a "What should I do now?" button (not a background
nag) — e.g. after dinner, unsure whether to do the coding practice or just
watch something.

**Input:** current time, today's remaining unlogged focus habits, today's
slot stack, whether today is marked disrupted.

**Output:** one concrete suggestion with a one-line reason, e.g. "Do 20 min of
coding practice now — it's on your after-dinner slot and you haven't logged it
yet. Reading can slide to bed-time if you run out of time." Never a generic
motivational message with no specific action.

## A3. Weekly review narrative

**Trigger:** end-of-week review screen (F5 in core spec).

**Input:** the week's full check-in log.

**Output:** a short (3–5 sentence) narrative summary highlighting one genuine
pattern (not generic praise) — e.g. "Diet held up fine except on the two days
marked 'guests' — worth deciding in advance what your fallback meal plan is
for those days." This feeds directly into the next week's plan proposal (A1).

## Guardrails for all AI features

- The AI never invents data — it only reasons over what was actually logged.
  If there isn't enough history (first week), A1 falls back to a simple
  rule-based default (start with Sleep only) rather than hallucinating
  patterns.
- No AI feature should require the person to write long free-text prompts —
  all inputs are structured (taps, chip selections) already captured by the
  core app; the AI consumes that structured data.
- AI is additive: every feature above must degrade gracefully to a
  rule-based fallback (documented in `11-ai-integration-prompts.md`) if the
  API is unavailable or the person has turned AI off (F8).
- Keep prompts and outputs scoped to habit-planning. This is not a general
  assistant chat surface — no open-ended chat box in MVP.

## Explicit non-features (avoid scope creep)

- No AI-generated diet plans with specific calorie/macro numbers, no medical
  or clinical advice — see `01-problem-statement.md` non-goals. If diet or
  sleep patterns suggest something concerning, the copy should suggest
  talking to a professional, not attempt to diagnose or prescribe.
- No open-ended AI chatbot in the MVP. Structured suggestions only.
