# 05 — Core Feature Spec (non-AI)

These are the features the app must have to function as a habit + weekly
planning tool, independent of the AI layer. AI features are specified
separately in `06-feature-spec-ai.md`.

## F1. Habit library & current focus

- A predefined starter library covering the categories from the brief: Sleep,
  Diet/Nutrition, Exercise, Deep Work (coding/learning), Reading, Grooming
  (hair/skin care), Digital Wellbeing (scroll/email control).
- Each habit has: name, category, icon, a **default version** and a
  **minimum-viable / disrupted-day version** (e.g. Sleep default = "Lights out
  by 11pm, up by 6:30am"; disrupted version = "Wake-up time stays 6:30am
  regardless of when you slept").
- The person can create custom habits with the same default/fallback pair.
- "Current focus" is capped (configurable, default 3). Habits not in focus sit
  in a Backlog list, visible but not demanding daily action.

## F2. Daily check-in

- One screen, one tap per habit: Done / Partial (fallback version done) /
  Missed.
- If Missed or Partial, a single required field: **reason** — quick-select
  chips (Late night / Work ran long / Guests or family event / Travel /
  Health / Forgot / Other) plus optional free-text note.
- Designed for under 15 seconds end-to-end for a 3-habit focus set.
- Can be logged retroactively for "yesterday" if the person forgot to open the
  app (common — don't punish this).

## F3. Habit stacking / routine slots

- The person can pin a habit to a "slot" relative to an anchor event they
  control (e.g. "right after dinner," "in bed before sleep," "right after
  shower") rather than a fixed clock time — this matches real household
  rhythms better than fixed times when the household schedule itself shifts.
- Slots are shown as a simple ordered list for the day ("your stack"), not a
  full calendar.

## F4. Streaks & patterns (de-emphasized, not primary UI)

- Track current streak and best streak per habit, but do not make this the
  dominant visual element (contrast with Streaks/Habitica).
- Pattern surfacing: "You've missed Gym 3 of the last 4 Fridays" style
  insights, computed from logged reasons — this is the more useful signal
  than a raw streak number.

## F5. Weekly review screen

- Auto-generated summary at the end of each week: completion rate per habit,
  most common disruption reason, comparison to prior week.
- This is the input the AI planner reads from (see AI spec) but must also be
  readable and useful with the AI off/unavailable.

## F6. Disrupted-day mode (manual trigger + auto-suggested)

- A one-tap toggle for "today is a disrupted day" (guests arrived, extreme
  work day, travel) that swaps every current-focus habit to its
  minimum-viable version for the day and adjusts the check-in screen
  accordingly.
- The app can also proactively suggest turning this on if it's a Friday
  evening/weekend during a period the person has marked as recurring family
  time — but this is a suggestion, never automatic silently.

## F7. Notifications / reminders

- Minimal by default: one check-in reminder near the person's usual
  wind-down time, one optional mid-day nudge for slot-based habits.
- No red badge anxiety-driving counters. Tone matches principle 7 (no shame).

## F8. Settings & data

- Export/import data as JSON (local-first principle).
- Adjust current-focus cap, reminder times, week start day.
- Toggle AI planning on/off entirely (app must be fully usable without it —
  see `06-feature-spec-ai.md` for what's lost without it).

## Explicit MVP cut line

Ship with: F1, F2, F3 (basic), F4 (streak number + one insight), F5, F6, F8.
Defer to Phase 2: notifications (F7), advanced pattern insights, data
export/import polish. See `12-roadmap-mvp.md`.
