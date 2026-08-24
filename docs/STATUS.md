# QADIYA — STATUS

Last updated: 2026-08-24

## Current milestone

**Phase 2 — Visual Foundation & Game Shell (started after Phase 0 continuity foundation)**

## Completed

- pnpm monorepo foundation.
- web/server/shared/case-engine initial packages.
- initial Colyseus/server foundation.
- CI build/typecheck.
- mandatory continuity documentation and AI protocol.
- CI continuity gate requiring `PROJECT_MEMORY.md` on source changes.
- repository README links mandatory reading order.
- monolithic experimental App split into Game Shell, Menu/Lobby/Court scenes, and camera contracts.

## In progress

- design tokens and scene/camera runtime hardening.
- shared lobby/role contracts.
- Case Engine primitive redesign.

## Next exact implementation steps

1. Add design tokens/motion/layer budgets without changing visual direction.
2. Add shared role/lobby/mode contracts including 3-player private and multi-defendant support.
3. Replace placeholder lobby data with typed client view models derived from shared contracts.
4. Build Case Engine IDs, Truth/Timeline/Knowledge primitives and validators.
5. Add deterministic unit tests before procedural generation.

## Known limitations right now

- court artwork remains CSS placeholder architecture; final layered art pipeline not present yet.
- no real matchmaking/session flow yet.
- no production case generation yet.
- no voice yet.
- no database/persistent accounts yet.
- art assets are placeholders/not final.

## Definition of "do not patch"

If a planned system is not ready, implement the correct interface and a transparent placeholder behind it. Do not replace the required design with a simplified permanent feature just to make the screen appear complete.
