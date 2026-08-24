# QADIYA — STATUS

Last updated: 2026-08-24

## Current milestone

**Phase 4/6/8 foundation — pre-game selection + interactive core role allocation**

## Completed

- continuity/memory/worklog system enforced by CI.
- modular fullscreen Game Shell/scenes/camera registry.
- authoritative lobby rules/preferences/readiness.
- role fairness allocator and judge-controlled Official Floor.
- structured Case Engine with timeline/knowledge validation, Case DNA and variable-role adaptation.
- explicit pre-game pipeline: feasible Mode → defendant count → matching Case DNA.
- atomic server-only core role transaction and private preparation vault.
- first-class defense representation supports shared counsel and 3-player self-representation.
- `RoleAllocationCoordinator` now models defendant selection, judge candidate voting/system/Private choice, lawyer request/accept/refuse, court-appointed recovery, Private defense plan, and prosecution assignment.
- judge candidates cannot self-vote; a zero-vote judge election has a deterministic fairness recovery path instead of deadlocking.
- a lawyer who rejects a defendant is not silently reappointed to that same defendant by fallback.
- core allocation never finalizes until the selected number of distinct human defense seats is satisfied.

## In progress

- server-room integration of the coordinator and authoritative allocation messages/timeouts.
- Preparation coordinator and retained-memory notes.
- first deterministic Case DNA → Blueprint composer.
- client networking.

## Next exact implementation steps

1. Integrate `RoleAllocationCoordinator` into `CourtRoom` with server-owned lifecycle and sanitized messages for judge vote/defense request-response.
2. Build Preparation coordinator that creates defense consultations and enforces retained-note limits.
3. Add first deterministic Case Composer template to prove DNA → validated Blueprint.
4. Connect LobbyScene to Colyseus and render authoritative room state.
5. Centralize design/motion/layer tokens and expand Camera Director.

## Known limitations right now

- the coordinator currently consumes a ready-player snapshot; room integration must revalidate disconnects before applying its completed plan through `applyCoreRolePlan`.
- role history is still in-memory/profile input only; persistence will become authoritative later.
- allocation timeouts are not yet implemented; fallback methods exist so the room can resolve timeout/no-response without inventing a new path.
- Case DNA pool is not populated with production templates yet.
- `setPrivateBriefForSession` remains an internal integration point; Case Engine does not yet populate it.
