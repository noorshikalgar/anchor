# Anchor — AI-guided habit & life-routine planner

> "Stay anchored, even when the day isn't."

This folder is a **complete product + design + engineering brief** for an app called
**Anchor**. It was planned by Claude (chat) and handed off so that **Claude Code** can
implement it. Nothing here is code — it's the thinking that should happen *before* code,
done up front so Claude Code can move fast and not re-litigate product decisions
mid-build.

## Why this exists

The person this app is for has a common but under-served problem: they don't lack
motivation, they lack a **system that survives a messy, interrupt-heavy life**
(late nights, joint-family schedules, work spilling into personal time, unplanned
guests). Most habit trackers assume a clean, Western, single-person household and
just count streaks. This one is designed around **disruption-recovery**, not
streak-perfection.

## How to use this with Claude Code

Read the docs **in this order**:

1. `docs/01-problem-statement.md` — the actual problem, why existing apps fall short
2. `docs/02-users-personas-jtbd.md` — who this is for, jobs-to-be-done
3. `docs/03-competitive-research.md` — what exists today, gaps, positioning
4. `docs/04-product-principles-vision.md` — the non-negotiable design principles
5. `docs/05-feature-spec-core.md` — core (non-AI) features, MVP scope
6. `docs/06-feature-spec-ai.md` — what the AI layer actually does and why
7. `docs/07-ux-flows-information-architecture.md` — screens, navigation, flows
8. `docs/08-design-system.md` — visual identity: colors, type, components, charts
9. `docs/09-tech-architecture.md` — stack, folder structure, state, storage
10. `docs/10-data-model.md` — entities & schema
11. `docs/11-ai-integration-prompts.md` — system prompts & API call shapes
12. `docs/12-roadmap-mvp.md` — phased build plan, cut lines

Then start building **Phase 0** from `12-roadmap-mvp.md`. Don't build all phases in one
shot — ship Phase 0, let the person react to it, then continue.

## One-line brief (if you only read one thing)

Build a **local-first, mobile-first web app** (React + TypeScript + Vite + Tailwind +
shadcn/ui) where the person tracks a small number of "current focus" habits at a time,
logs quick daily check-ins, and gets a **weekly plan proposed by an AI coach** that
explicitly accounts for last week's disruptions instead of pretending they didn't
happen. No social features, no gamification, no streak-shaming. Calm, editorial,
trustworthy visual tone — not another cutesy pastel tracker.
