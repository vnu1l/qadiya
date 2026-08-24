# QADIYA — STATUS

Last updated: 2026-08-24

## Current milestone

**Phase 6 foundation — live Render preview handoff + first deterministic Case Composer next**

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
- atomic full-stack Docker deployment: frontend + backend always ship from the same commit.
- GitHub CI builds/tests the final production container and smoke-tests `/`, `/health`, and `/api/build`.
- Render Free Blueprint added for the development preview: Frankfurt, Docker, `main`, `checksPass`, `/health`.
- live build metadata now supports Render's native Git commit/branch/repository environment variables.

## In progress

- one-time external Render account authorization / Blueprint creation to obtain the first public `onrender.com` URL.
- first deterministic Case DNA → validated CaseBlueprint composer.
- generation of role-specific private briefs from structured case knowledge.
- variable human-role assignment/adaptation into Preparation.
- pre-game room lock/timers and automatic start orchestration.
- client networking.

## Next exact implementation steps

1. Owner creates the Render Blueprint from `vnu1l/qadiya` once; no manual build configuration should be entered because `render.yaml` is authoritative.
2. Verify the live domain: `/health` is 200, `/api/build.platform` is `render`, and `commitSha` equals GitHub `main`.
3. Resume Case Engine work immediately: explicit charge-element truth model, then deterministic curated DNA → validated Blueprint composer.
4. Derive role-specific private briefs/memory from the composed Knowledge Graph and populate PrivateCaseVault before Preparation.
5. Connect variable-role adaptation to actual remaining human players and include those roles in Preparation.
6. Connect LobbyScene to Colyseus and then centralize visual design/motion/layer tokens.

## Known limitations right now

- there is no public Render URL until the repository is authorized in the owner's Render account once.
- Render Free sleeps when idle and has ephemeral local storage; it is Preview only, not final Production.
- no production Case DNA/template pool yet.
- no actual judge-vote/defense-response timers yet; server hooks exist.
- late join is not yet blocked during active pre-game/court lifecycle.
- persistent identity/reconnect and role history are not implemented yet.
- variable roles are still Case Engine definitions, not assigned room players.
- Preparation currently starts immediately after core roles and therefore waits on missing briefs until the composer integration populates them.
