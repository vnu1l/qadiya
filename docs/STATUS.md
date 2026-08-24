# QADIYA — STATUS

Last updated: 2026-08-24

## Current milestone

**Phase 4/6/8 foundation — pre-game selection pipeline + secure roles/preparation**

## Completed

- durable continuity/memory/worklog system.
- modular fullscreen Game Shell/scenes/camera registry.
- authoritative lobby inputs, rules and readiness.
- fair role allocator, atomic core role transaction, defense representation and Private self-representation.
- server-only private brief/privileged consultation vault.
- structured Case Engine with timeline travel and knowledge precision validation.
- Case DNA and variable-role adaptation.
- explicit pre-game selection functions implement: feasible random Mode → feasible defendant count → matching Case DNA.
- CaseMode no longer mixes truth state (`wrongly-accused`) with presentation/focus mode; truth lives in TruthPattern.
- selection checks player capacity so a public case is not chosen if it cannot give everyone a meaningful human seat.

## In progress

- RoleAllocationCoordinator that consumes the selected mode/count/DNA and resolves actual players.
- Preparation coordinator.
- first Case DNA → Blueprint composer.

## Next exact implementation steps

1. Build RoleAllocationCoordinator with judge candidate/vote boundary, defendant weighted selection, defense selection/fallback, prosecution assignment.
2. Build Preparation coordinator and retained-note enforcement.
3. Add first deterministic Case Composer template to prove DNA → validated Blueprint.
4. Connect client to lobby state.
5. Build visual design tokens and camera runtime.

## Known limitations right now

- selection is uniform across feasible modes/DNAs; history/anti-repetition weights come later with persistence/analytics.
- defense-seat count feasibility assumes structural capacity; actual accepted-role availability is verified by allocation coordinator next.
- Case DNA pool is not populated with production templates yet.
