# 10 — Data Model

All entities live in IndexedDB (via Dexie) on-device by default. Shapes below
are TypeScript-flavored for direct use in `types/`.

```ts
type HabitCategory =
  | "sleep" | "diet" | "exercise" | "deep_work"
  | "reading" | "grooming" | "digital_wellbeing" | "custom";

interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  icon: string;                 // lucide icon name
  defaultVersion: string;       // e.g. "Lights out by 11pm, up by 6:30am"
  fallbackVersion: string;      // e.g. "Wake-up time stays 6:30am"
  slot?: {
    label: string;              // "After dinner", "Before sleep"
    order: number;              // position within the day's stack
  };
  status: "focus" | "backlog" | "archived";
  createdAt: string;            // ISO date
}

type CheckinState = "done" | "partial" | "missed";
type DisruptionReason =
  | "late_night" | "work" | "guests_family" | "travel"
  | "health" | "forgot" | "other" | null;

interface Checkin {
  id: string;
  habitId: string;
  date: string;                 // ISO date, no time (one per habit per day)
  state: CheckinState;
  reason: DisruptionReason;     // required if state !== "done"
  note?: string;                // optional free text, short
  loggedAt: string;             // actual ISO timestamp (may differ from `date` for retroactive logs)
}

interface DayFlag {
  date: string;                 // ISO date
  disruptedMode: boolean;       // F6 toggle state for that day
  disruptionReason?: DisruptionReason;
}

interface WeeklyPlan {
  id: string;
  weekStart: string;            // ISO date of week start
  generatedBy: "ai" | "rule_based";
  proposal: {
    keepInFocus: string[];      // habit ids
    shrinkToFallback: string[]; // habit ids defaulted to fallback this week
    newlyAdded?: { habitId: string; reason: string };
    predictedDisruptions?: { dayOfWeek: number; reason: DisruptionReason; note: string }[];
    summary: string;            // 2-4 sentence plain-language summary
  };
  personResponse: "accepted" | "adjusted" | "skipped" | "pending";
  finalFocusSet: string[];      // after any manual adjustment
  createdAt: string;
}

interface WeeklyReview {
  id: string;
  weekStart: string;
  narrative: string;            // A3 output
  stats: {
    habitId: string;
    completionRate: number;     // 0-1
    topReason?: DisruptionReason;
  }[];
}

interface Settings {
  focusCap: number;             // default 3
  weekStartsOn: 0 | 1;          // Sunday=0 / Monday=1
  aiEnabled: boolean;
  reminderTime?: string;        // "HH:mm", local
}
```

## Key invariants to enforce in code

- At most one `Checkin` per `(habitId, date)` — upsert, don't append.
- `Habit.status === "focus"` count must never exceed `Settings.focusCap`
  without an explicit override action from the person (the AI proposal
  respects this cap too — see `11-ai-integration-prompts.md`).
- `reason` is required whenever `state !== "done"` — enforce at the form
  layer, not just in the type.
- `WeeklyPlan.finalFocusSet` is what the rest of the app reads from once a
  plan has been accepted/adjusted — never read `proposal.keepInFocus`
  directly outside the plan-review screen, to avoid divergence between what
  was proposed and what was actually accepted.
