# 04 — Product Principles & Vision

## Vision statement

Anchor helps someone build a sustainable, sequenced set of life habits, and
keeps the plan intact when real life — family, work, one bad night — gets in
the way.

## Core design principles (non-negotiable, cite these when making tradeoffs)

1. **Sequence, don't scatter.** The app always has a small, explicit "current
   focus" set of habits (default: 1–3). New habits are proposed, not just added
   on request, based on how stable the current ones are.

2. **Disruption is data, not failure.** Every habit has a defined "minimum
   viable version" for a bad day, and every disrupted day is logged with a
   *reason* (late night, work, guests, travel, health, other) rather than just
   marked as a miss. The AI planner reads these reasons.

3. **Never miss twice.** The single behavioral rule the whole product is built
   around: one missed day is noise, two in a row is a pattern the system should
   react to (nudge, or offer to shrink the habit further).

4. **Wake time over bedtime.** For sleep specifically, treat wake-up time as
   the primary lever, since it anchors circadian rhythm even when bedtime is
   pushed by external disruptions.

5. **The AI plans, the person decides.** Every week Anchor proposes a plan
   (what stays in focus, what gets added, what's the fallback for likely
   disruptions this week). The person can accept, tweak, or reject it in one
   or two taps — it should never feel like a black box or a lecture.

6. **Low logging friction.** Daily interaction should take under 15 seconds.
   Anything that requires opening multiple screens to log one habit is a
   design failure.

7. **No shame, no gamification.** No avatars, pets, XP, streak-loss "damage,"
   leaderboards, or guilt-based copy. Calm, respectful, adult tone throughout
   (see writing guidance in `08-design-system.md`).

8. **Local-first, private by default.** Habit and journal data is personal.
   Default to on-device storage; anything sent to the AI API is the minimum
   needed for planning, not a full personal diary.

9. **Small habit count on screen at any time.** The home screen never shows
   more "current focus" habits than the person can hold in their head (cap at
   3–4). Everything else lives in a backlog, not competing for attention.

## Product tone-of-voice

Direct, warm, competent — like a good coach, not a cheerleader and not a
drill sergeant. Examples:

- Bad: "You broke your streak! 😢 Don't give up!"
- Bad: "AMAZING JOB!!! You're CRUSHING it! 🔥🔥🔥"
- Good: "Missed sleep two nights running — want to shrink this to just a fixed
  wake-up time for the rest of the week?"
- Good: "Sleep's been steady for 6 days. Ready to bring diet into the mix?"

## Success looks like

- The person has a stable "current focus" habit running for 3+ weeks without
  abandoning the whole system after a single bad week.
- Weekly plan proposals are accepted with only minor edits most weeks (signal
  that the AI reasoning is actually useful, not generic).
- The person can recover from a disrupted week within 1–2 days instead of
  quitting the app.
