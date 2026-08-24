# QADIYA — STATUS

Last updated: 2026-08-24

## Current milestone

**Phase 6 foundation — first deterministic Case Composer next**

## Completed

- continuity/memory/worklog system enforced by CI.
- modular fullscreen Game Shell/scenes/camera registry.
- authoritative lobby rules/preferences/readiness.
- structured Case Engine with timeline/knowledge validation, Case DNA and variable-role adaptation.
- explicit pre-game pipeline: feasible Mode → defendant count → matching Case DNA.
- fair interactive RoleAllocationCoordinator integrated into CourtRoom with server-owned state and atomic final application.
- shared counsel, lawyer accept/refuse, court-appointed fallback, Private host choices and 3-player self-representation.
- server-only PrivateCaseVault for briefs, secrets, privileged consultation and retained memory.
- PreparationCoordinator with hard blockers vs soft warnings, bounded retained notes, private defense consultations and note locking at court opening.
- public Colyseus PreparationState exposes only readiness metadata, never memory or secret text.
- judge-only court opening; unready state can be explicitly overridden, missing required participant/brief cannot.

## In progress

- first deterministic Case DNA → validated CaseBlueprint composer.
- generation of role-specific private briefs from structured case knowledge.
- variable human-role assignment/adaptation into Preparation.
- pre-game room lock/timers and automatic start orchestration.
- client networking.

## Next exact implementation steps

1. Build a deterministic curated Case Composer that turns supported Case DNA + seed + defendant count into a fully validated CaseBlueprint without AI.
2. Derive role-specific private briefs/memory from the composed Knowledge Graph and populate PrivateCaseVault before opening Preparation.
3. Connect variable-role adaptation to actual remaining human players and include those roles in Preparation.
4. Build a pre-game coordinator connecting Mode/count/DNA → compose/validate → core/variable role allocation → Preparation.
5. Connect LobbyScene to Colyseus and then centralize visual design/motion/layer tokens.

## Known limitations right now

- no production Case DNA/template pool yet.
- no actual judge-vote/defense-response timers yet; server hooks exist.
- late join is not yet blocked during active pre-game/court lifecycle.
- persistent identity/reconnect and role history are not implemented yet.
- variable roles are still Case Engine definitions, not assigned room players.
- Preparation currently starts immediately after core roles and therefore waits on missing briefs until the composer integration populates them.
