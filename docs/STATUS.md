# QADIYA — STATUS

Last updated: 2026-08-24

## Current milestone

**Phase 0 — Governance & Continuity**

## Completed

- pnpm monorepo foundation.
- web/server/shared/case-engine initial packages.
- initial Svelte pre-alpha screen.
- initial Colyseus/server foundation.
- initial CI build/typecheck.
- `AGENTS.md` mandatory continuity protocol.
- `docs/PROJECT_MEMORY.md` canonical project memory.
- `docs/MASTER_PLAN.md` exhaustive execution plan.
- `docs/DECISIONS.md` long-lived architecture/product decisions.

## In progress

- enforce memory updates in CI.
- link repository entry points to continuity docs.
- finish Phase 0 governance files.

## Next exact implementation steps

1. Add CI memory gate and changelog.
2. Update README with mandatory reading order.
3. Refactor monolithic experimental `App.svelte` into Game Shell + scene components.
4. Add design tokens and camera contracts.
5. Add shared role/lobby contracts.
6. Start Case Engine primitive model and deterministic validation tests.

## Known limitations right now

- current court/menu UI is experimental and monolithic.
- no real matchmaking/session flow yet.
- no production case generation yet.
- no voice yet.
- no database/persistent accounts yet.
- art assets are placeholders/not final.

## Definition of "do not patch"

If a planned system is not ready, implement the correct interface and a transparent placeholder behind it. Do not replace the required design with a simplified permanent feature just to make the screen appear complete.
