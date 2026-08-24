# QADIYA — STATUS

Last updated: 2026-08-24

## Current milestone

**Phase 4/8 foundation — authoritative allocation network flow → Preparation**

## Completed

- continuity/memory/worklog system enforced by CI.
- modular fullscreen Game Shell/scenes/camera registry.
- authoritative lobby rules/preferences/readiness.
- structured Case Engine with timeline/knowledge validation, Case DNA and variable-role adaptation.
- explicit pre-game pipeline: feasible Mode → defendant count → matching Case DNA.
- fair interactive `RoleAllocationCoordinator` with weighted defendants, judge vote/system/private selection, lawyer request/accept/refuse, court-appointed recovery, shared counsel and Private self-representation.
- atomic core role transaction and server-only private case vault.
- role-allocation public projection is now typed/shared and synchronized through Colyseus without exposing history weights or private knowledge.
- `CourtRoom` owns the coordinator; clients submit only allowed actions while defendant count/defense-seat count remain server-owned inputs.
- role preferences freeze during allocation, completed plans are revalidated atomically, and disconnect during allocation safely cancels back to Lobby.

## In progress

- Preparation coordinator and retained-memory notes.
- first deterministic Case DNA → Blueprint composer.
- pre-game room lock/timers and automatic start orchestration.
- client networking.

## Next exact implementation steps

1. Build Preparation coordinator: role-specific readiness, defense consultation groups, retained-note limits, privilege boundaries, and exit-to-court readiness without hard deadlocks.
2. Add first deterministic Case Composer template to prove DNA → validated Blueprint and populate private briefs.
3. Build pre-game coordinator that connects Mode/count/DNA selection → defense-seat requirement → role allocation and locks the room during the active pre-game transaction.
4. Connect LobbyScene to Colyseus and render authoritative allocation/preparation state.
5. Centralize design/motion/layer tokens and expand Camera Director.

## Known limitations right now

- no actual judge-vote/defense-response timers yet; server hooks exist for the future scheduler.
- late join during role allocation is not yet blocked at matchmaking/room-lock level.
- role history is not persisted yet and cannot come from clients; current room profiles use empty server history.
- required human defense-seat count is still supplied by the future case composition layer.
- Case DNA pool is not populated with production templates yet.
- `setPrivateBriefForSession` remains an internal integration point; Case Composer/Preparation will populate it next.
