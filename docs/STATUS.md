# QADIYA — STATUS

Last updated: 2026-08-27

## Current milestone

**Phase 6 foundation — explicit charge truth model under verification**

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
- explicit charge-element ground-truth model, then first deterministic Case DNA → validated CaseBlueprint composer.
- role-specific private briefs and variable-role Preparation integration.
- pre-game room lock/timers and client networking.

## Current verified blocker

Full source pipeline is verified green on commit `1c82cf2bdd6e391fc7d1d7a2b49f47e16f890563`: canonical install, build, typecheck, 54 unit tests, production Docker build, and same-container frontend/backend smoke all pass. The final documentation checkpoint must pass the same CI before it is treated as the deploy SHA.

## Next exact implementation steps

1. Verify the explicit charge-element truth model with full CI.
2. Add curated deterministic DNA/template input without composing yet.
3. Build the deterministic DNA → validated Blueprint composer only after the template layer passes its own tests.

## Known feature limitations (not build errors)

- no production Case DNA/template pool yet.
- no actual judge-vote/defense-response timers yet; server hooks exist.
- late join lock is not yet implemented during active pre-game/court lifecycle.
- persistent identity/reconnect and role history are not implemented yet.
- variable roles are definitions, not assigned room players yet.
- LobbyScene is still a visual placeholder and not connected to Colyseus.
