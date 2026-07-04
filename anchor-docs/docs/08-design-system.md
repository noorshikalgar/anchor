# 08 — Design System

Read `/mnt/skills/public/frontend-design/SKILL.md` (or the frontend-design skill
in whatever environment Claude Code is running) before implementing this. The
direction below is a starting *plan*, not final code — treat it the way that
skill describes: brainstorm → critique against the brief → build.

## Explicitly avoid the current AI-generated-design defaults

Do not default to: (1) warm cream background + serif + terracotta accent near
`#D97757`, (2) near-black background with one neon accent, (3) broadsheet
hairline-rule newspaper layout. The palette and type system below are chosen
specifically to avoid all three while still fitting a calm, trustworthy,
"grounded" brief.

## Concept: "Harbor" — steady, not sterile

The subject is stability inside a chaotic week. The visual metaphor is a
harbor — calm water, a fixed anchor point, a horizon line — rendered through a
recurring UI motif rather than literal boat/anchor iconography: a **7-cell
week strip** that appears on the Today and Week screens as a textured ribbon,
each cell representing a day's state. This is the signature element (see
frontend-design skill: spend the one bold idea here, keep the rest quiet).

## Color tokens (light mode primary; dark mode variants noted)

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#1C2321` | Primary text, icons |
| `--harbor` | `#2E5359` | Primary brand color — buttons, active tab, links |
| `--parchment` | `#EAE4D6` | App background (warm, muted — not the cliché bright cream) |
| `--ochre` | `#B8843B` | Accent — used only for AI-generated insight callouts and the "new habit suggested" badge, nowhere else |
| `--sage` | `#6E8F73` | Positive / "Done" state |
| `--brick` | `#A15046` | "Missed" state / attention — warm, not alarm-red |
| `--ink-10` | `#1C2321` @ 10% | Hairline borders, dividers |

Dark mode: invert to `--ink` as background (`#14181A`, slightly warmer than
pure black), `--parchment` becomes the text color at reduced opacity, harbor/
ochre/sage/brick stay the same hue family but desaturate ~10% and lighten
~15% for contrast on dark.

Do not introduce additional brand hues beyond this table. "Partial" state
uses `--ochre` at 60% opacity rather than inventing a fourth semantic color.

## Typography

- **Display** — *Fraunces* (variable serif, warm but has real character/
  opticals — used for the weekly plan headline, the "Today" greeting, and
  section titles only). Weight 500–600, slightly negative letter-spacing at
  large sizes.
- **Body / UI** — *Work Sans* (humanist grotesque, friendly but not as
  ubiquitous as Inter — used for all body copy, buttons, form labels).
- **Utility / numeric** — *IBM Plex Mono* for streak counts, timestamps,
  percentages, and the week-strip day labels — gives data a quiet
  "instrument panel" feel that reinforces the calm/trustworthy tone without
  extra chrome.

Type scale (rem, mobile base 16px): 2.25 / 1.5 / 1.25 / 1.125 / 1 / 0.875.
Only Display uses the top two sizes; body text never exceeds 1.125rem.

Load via Google Fonts or self-hosted variable fonts; all three are free/
open-license.

## Layout concept

```
┌─────────────────────────────┐
│  Good evening, Rohan          │ ← Fraunces, greeting + date
│  ░░▓▓▓▓░░░  (week strip)      │ ← signature element
├─────────────────────────────┤
│  Today                        │
│  ┌───────────────────────┐   │
│  │ ● Sleep      Done      │   │
│  │ ● Coding     [slot: PM]│   │
│  │ ○ Reading    –          │   │
│  └───────────────────────┘   │
│  [ What should I do now? ]    │ ← ochre-accented AI CTA
├─────────────────────────────┤
│ Today | Focus | Week | You    │ ← bottom tab bar
└─────────────────────────────┘
```

Card-based, generous whitespace, 12–16px corner radius (soft but not
bubble-app rounded), 1px hairline borders in `--ink-10` rather than heavy
drop shadows. Motion: one orchestrated moment — the week-strip cell fills
with a short (200ms) ease-out when a habit is logged; everything else is
static/instant. Respect `prefers-reduced-motion` by disabling that fill
animation.

## Component library & stack

- **shadcn/ui** (Radix primitives + Tailwind) for buttons, switches, tabs,
  dialogs, toasts — restyled with the token system above, not left as
  Radix/shadcn defaults.
- **lucide-react** for icons — outline style, 1.5px stroke, never filled
  (keeps the calm/editorial tone; avoid playful filled icon sets).
- **Recharts** for the Week tab's 7-day completion chart and the pattern
  trend line — muted single-hue bars using `--harbor`/`--sage`/`--brick`
  semantic mapping, thin gridlines in `--ink-10`, no default rainbow
  categorical palette.
- **Tailwind CSS** utility classes throughout, tokens above wired in as
  CSS variables + Tailwind theme extension (not hardcoded hex in components).

## Writing / microcopy rules (ties to product principles doc)

- Sentence case everywhere, no ALL CAPS except tiny eyebrow labels.
- Buttons name the action, not a generic verb: "Accept this week's plan," not
  "Submit."
- Empty states are invitations, not apologies: "No history yet — your first
  week starts today," not "No data available."
- Never use exclamation points for praise; a plain, specific observation is
  the reward ("Sleep's been consistent for 6 days" beats "Amazing job! 🔥").
