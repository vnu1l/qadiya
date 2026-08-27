# QADIYA — STATUS

Last updated: 2026-08-27

## Current milestone

**Phase 6 foundation — deployment hardening audit, then deterministic Case Composer**

## Completed

- continuity/memory/worklog system and mandatory AI/developer instructions.
- modular fullscreen Game Shell/scenes/camera registry.
- authoritative lobby rules/preferences/readiness.
- structured Case Engine with timeline/knowledge validation, Case DNA and variable-role adaptation.
- explicit pre-game pipeline: feasible Mode → defendant count → matching Case DNA.
- fair interactive RoleAllocationCoordinator integrated into CourtRoom with server-owned state and atomic final application.
- shared counsel, lawyer accept/refuse, court-appointed fallback, Private host choices and 3-player self-representation.
- server-only PrivateCaseVault for briefs, secrets, privileged consultation and retained memory.
- PreparationCoordinator with hard blockers vs soft warnings, bounded retained notes, private defense consultations and note locking at court opening.
- public Colyseus PreparationState exposes readiness metadata only.
- atomic full-stack Docker deployment contract: frontend + backend ship from one image/commit.
- Render Free service/Blueprint exists and targets main with checksPass and /health.
- Google Fonts shortlist is preserved in docs/FONT_REFERENCES.md for later visual work.

## In progress

- full repository/build audit before accepting a new live deploy.
- dependency reproducibility recovery: Colyseus exact-version pin + canonical pnpm-lock.yaml.
- first deterministic Case DNA → validated CaseBlueprint composer.
- role-specific private briefs and variable-role Preparation integration.
- pre-game room lock/timers and client networking.

## Current verified blocker

Dependency install, canonical lockfile, Build, and Typecheck are now verified. The first complete test run found one court-appointed defense compatibility bug; its matching algorithm is being corrected and regression-tested. Docker/smoke remain gated until tests are all green.

## Next exact implementation steps

1. Require green build + typecheck + all unit tests + production Docker smoke test on the canonical lockfile.
2. Let Render deploy only the checks-passing main commit.
3. Verify live `/`, `/health`, and `/api/build`; live commitSha must equal GitHub main.
4. Resume Case Engine: explicit charge-element truth model → deterministic curated DNA → validated Blueprint composer.

## Known feature limitations (not build errors)

- no production Case DNA/template pool yet.
- no actual judge-vote/defense-response timers yet; server hooks exist.
- late join lock is not yet implemented during active pre-game/court lifecycle.
- persistent identity/reconnect and role history are not implemented yet.
- variable roles are definitions, not assigned room players yet.
- LobbyScene is still a visual placeholder and not connected to Colyseus.
