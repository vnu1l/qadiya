# QADIYA — STATUS

Last updated: 2026-08-24

## Current milestone

**Phase 4/5 foundation — role fairness, authoritative room behavior, Case Engine core**

## Completed

- continuity governance and CI memory gate.
- modular Game Shell, scenes, and camera registry.
- shared role/lobby/court contracts.
- Case Engine structured truth/timeline/knowledge/evidence/charge models and validator tests.
- server-side weighted defendant allocator with anti-repeat behavior.
- judge candidate ranking that does not lock beginners out of the role.
- defense candidate ranking that keeps rookies visible and honors automatic-assignment opt-in.
- CourtRoom floor control fixed: a player can request the floor, but only the assigned judge can grant official speaking status.
- server role-allocation unit tests.

## In progress

- deeper Case Engine timeline and knowledge validation.
- typed lobby state wiring into Colyseus.
- design tokens and camera runtime hardening.

## Next exact implementation steps

1. Add travel/location feasibility to Master Timeline validation.
2. Add Case DNA + variable-role value/adaptation system.
3. Introduce typed private lobby settings on the server and a safe role-assignment application path.
4. Add preparation-state contracts and privileged defense consultation boundaries.
5. Continue Visual Foundation with centralized design/motion/layer tokens.

## Known limitations right now

- allocator currently consumes precomputed `recentAssignments`; persistence that calculates the rolling history comes later.
- judge candidate ranking does not yet include Conduct because Conduct persistence is not implemented.
- court artwork remains CSS placeholder architecture.
- lobby UI is not connected to Colyseus yet.
