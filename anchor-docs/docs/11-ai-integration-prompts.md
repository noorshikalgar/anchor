# 11 — AI Integration & Prompts

## API shape

Server-side endpoint only (see `09-tech-architecture.md`). Uses the Anthropic
Messages API with a strict-JSON system prompt and Zod validation on the way
back out. Model: `claude-sonnet-4-6` (good balance of reasoning quality and
cost for a weekly-cadence feature — this is not a high-frequency call).

```ts
// server/plan.ts (shape, not final code)
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: WEEKLY_PLAN_SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify(weeklyPlanInput) }],
  }),
});
```

## A1 — Weekly Plan system prompt (draft, tune during build)

```
You are a habit-planning coach embedded in a personal habit app called Anchor.
You will be given a JSON object describing:
- the person's current focus habits and their fallback ("minimum viable")
  versions
- their backlog of not-yet-active habits
- the last 1-4 weeks of daily check-ins per habit, including any disruption
  reasons logged on missed/partial days
- the focus cap (max number of habits allowed in focus at once)

Your job is to propose next week's plan. Follow these rules strictly:
1. Never propose more total focus habits than the given focus cap.
2. Only propose adding a new habit from the backlog if at least one current
   focus habit has a completion rate of 80%+ over the last 7+ days. If none
   qualify, do not add anything new.
3. If a focus habit has been missed 2+ days in a row at any point in the last
   7 days, propose shrinking it to its fallback version as the week's default
   (not just for disrupted days) rather than dropping it or keeping it
   unchanged.
4. If a disruption reason (e.g. "guests_family") appears on the same day of
   week in 3 or more of the last 4 weeks, surface it as a predicted
   disruption for that day this coming week.
5. Never invent a pattern from fewer than 3 data points. If there isn't
   enough history, say so plainly in the summary and default to the
   simplest reasonable plan (keep current focus unchanged, no additions).
6. Write the summary in a calm, specific, adult tone: no exclamation points,
   no generic praise, no guilt. Reference actual numbers/days where possible.
7. Respond with ONLY valid JSON matching the schema below. No markdown, no
   prose outside the JSON.

Schema:
{
  "keepInFocus": string[],           // habit ids
  "shrinkToFallback": string[],      // habit ids, subset of keepInFocus
  "newlyAdded": { "habitId": string, "reason": string } | null,
  "predictedDisruptions": [
    { "dayOfWeek": number, "reason": string, "note": string }
  ],
  "summary": string                  // 2-4 sentences
}
```

## A2 — "What's next" system prompt (draft)

```
You are suggesting the single next action for someone using the Anchor habit
app, right now. You will be given: the current time, today's remaining
unlogged focus habits with their slot labels (if any), and whether today is
in disrupted mode.

Pick exactly one habit to suggest doing next. Prefer habits with a slot label
matching the current time of day. If today is disrupted, only suggest
fallback versions. Respond with ONLY valid JSON:
{ "habitId": string, "message": string }
`message` is one sentence, specific, no exclamation points.
```

## A3 — Weekly review narrative system prompt (draft)

```
You are writing a short end-of-week reflection for someone using the Anchor
habit app. You will be given this week's check-in log per habit (completion
state and disruption reasons per day). Identify at most one genuine pattern
worth naming (e.g. a specific day or reason that recurred). Do not praise
generically. If nothing notable stands out, say the week was steady and leave
it at that — do not manufacture insight. Respond with ONLY valid JSON:
{ "narrative": string }
`narrative` is 3-5 sentences, calm and specific.
```

## Fallback (rule-based) planner — required, not optional

Used when AI is off (Settings) or the API call fails/times out. Lives in
`lib/ai/fallback.ts`. Logic:

1. If no history at all (brand new user): focus = `["sleep"]` only (per
   product principle "sequence, don't scatter" — sleep is the default first
   habit, see `01-problem-statement.md`).
2. If a focus habit's 7-day completion rate ≥ 80%: propose adding the
   highest-priority backlog habit (priority order: sleep → diet → exercise →
   deep_work/reading → grooming/digital_wellbeing), respecting the focus cap.
3. If a focus habit has 2+ consecutive missed/partial days: propose shrinking
   it to fallback as this week's default.
4. Otherwise: keep the plan unchanged.
5. Summary text is a template string, not model-generated, e.g.: "Keeping
   your current focus the same this week — [habit] is at N% this week."

This fallback must produce a plan of the *same shape* (`WeeklyPlan.proposal`)
as the AI path so the rest of the UI doesn't need to branch on which one ran.

## Cost/latency notes

- A1 runs at most once per week per user (plus manual re-runs) — cheap even
  at higher per-call cost.
- A2 is user-triggered (tap), not polled — keep max_tokens low (~150) for
  fast response.
- A3 runs once per week alongside A1 — can be combined into a single API call
  with two JSON keys if latency/cost matters more than separation of concerns;
  document that decision in code if you do this.
