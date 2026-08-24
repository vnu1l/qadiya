# QADIYA — STATUS

Last updated: 2026-08-24

## Current milestone

**Phase 6 foundation + atomic deployment pipeline — first deterministic Case Composer next**

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
- production deployment architecture is now one atomic container: Vite frontend + Colyseus/Express backend from the same Git SHA and same domain.
- `/health` validates that the frontend bundle exists; `/api/build` exposes the live Git SHA/deployment metadata.
- the UI shows the live server commit SHA so a deployed version can be verified without trusting a chat response.
- GitHub CI validates build/typecheck/tests plus the exact production Docker image and smoke-tests both `/` and `/health` from that container.
- `docs/DEPLOYMENT.md` defines the one-time Railway GitHub Autodeploy setup and the invariant that frontend/backend are not deployed independently.

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

## Deployment status — do not misreport

- **Repository is deployment-ready.**
- **No public live Railway URL is recorded in the repository yet.** Do not claim the site is live until a Railway service is actually connected and a domain passes `/health`.
- One external one-time action is still required in Railway: connect `vnu1l/qadiya` to a service on `main`, enable Autodeploy + Wait for CI, set Healthcheck `/health`, then Generate Domain.
- After that one-time connection, every successful push to `main` updates frontend and backend together from the same commit.

## Known limitations right now

- no production Case DNA/template pool yet.
- no actual judge-vote/defense-response timers yet; server hooks exist.
- late join is not yet blocked during active pre-game/court lifecycle.
- persistent identity/reconnect and role history are not implemented yet.
- variable roles are still Case Engine definitions, not assigned room players.
- Preparation currently starts immediately after core roles and therefore waits on missing briefs until the composer integration populates them.
- Railway account/project is not connected through an available tool in this environment, so repository automation can be prepared but the external service/domain cannot be created from chat without that connection.
