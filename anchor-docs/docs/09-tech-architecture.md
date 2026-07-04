# 09 — Tech Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 18 + TypeScript + Vite | Fast dev loop, what Claude Code handles best, easy to later wrap as a PWA |
| Styling | Tailwind CSS + shadcn/ui (Radix) | Matches design system doc; accessible primitives out of the box |
| Icons | lucide-react | See design system doc |
| Charts | Recharts | See design system doc |
| State | Zustand | Small, no boilerplate, easy to persist |
| Local storage | Dexie.js (IndexedDB wrapper) | Local-first principle — habit/check-in history lives on-device by default |
| Forms/validation | React Hook Form + Zod | Minimal, type-safe, used sparingly (this app is tap-first, not form-heavy) |
| Dates | date-fns | Lightweight, tree-shakeable |
| AI calls | Anthropic Messages API (`claude-sonnet-4-6`), called from a thin server function or edge function — **never** with the API key in client code | Structured JSON output for the weekly plan; see `11-ai-integration-prompts.md` |
| PWA | vite-plugin-pwa | Offline check-ins (F2), installable on phone home screen — matters a lot for a daily-use habit app |

## High-level folder structure

```
src/
  app/                  # routes/screens: Today, Focus, Week, You
  components/
    ui/                 # shadcn primitives, themed
    week-strip/         # signature component (see design system)
    habit-card/
    checkin-row/
  lib/
    db.ts               # Dexie schema + queries
    store.ts            # Zustand store(s)
    ai/
      client.ts         # wraps calls to the planning API route
      prompts.ts         # system prompts, see doc 11
      fallback.ts        # rule-based planner used when AI is off/unreachable
    dates.ts
  types/
    habit.ts
    checkin.ts
    plan.ts
  server/ (or /api if using a framework with API routes)
    plan.ts             # server-side endpoint that calls Anthropic API with the key
docs/                    # this planning folder — keep it in the repo for reference
```

## Data flow for the AI weekly plan (A1)

1. Client gathers last 1–4 weeks of check-in data + current focus/backlog
   state from Dexie (all local).
2. Client sends **only the structured summary** (not raw personal notes
   verbatim unless short) to a server-side endpoint (`/api/plan`).
3. Server endpoint calls the Anthropic Messages API with the system prompt
   from `11-ai-integration-prompts.md`, requesting strict JSON output.
4. Server validates the JSON shape (Zod schema) before returning it to the
   client — never trust/render unvalidated model output directly.
5. Client renders the proposal card; on Accept, writes the new focus/backlog
   state back to Dexie. Nothing is silently auto-applied (principle 5).

## Why local-first + thin server

The habit data is personal and the app should work fully offline for daily
logging (principle 8, F2). The only reason a server component exists at all
is to keep the Anthropic API key off the client — that endpoint should be as
thin as possible (validate input, call the API, validate/return output).

## Environments

- Local dev: Vite dev server + a local API route (or a serverless function
  emulator) for `/api/plan`.
- If deployed: any static host for the client (Vercel/Netlify/Cloudflare
  Pages) + one serverless function for the AI proxy endpoint.

## Non-functional requirements

- Time-to-interactive on Today screen: prioritize this above all else — it's
  opened daily, often one-handed.
- Works offline for all of F1–F6 (core spec); AI features clearly show a
  "reconnect to get this week's plan" state rather than erroring.
- No analytics/telemetry SDKs bundled by default — this is a personal habit
  app; if analytics are added later, make it opt-in and disclosed in Settings.
