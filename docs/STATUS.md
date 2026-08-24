# QADIYA — STATUS

Last updated: 2026-08-24

## Current milestone

**Phase 4/8 foundation — atomic roles + private preparation boundary**

## Completed

- continuity/memory/worklog system enforced by CI.
- modular Game Shell/scenes/camera registry.
- authoritative lobby rules/preferences/readiness.
- role fairness allocator and judge-controlled Official Floor.
- Case Engine structured model, timeline/knowledge validation, Case DNA and variable-role adaptation.
- atomic server-only core role plan validation/application.
- first-class defense representation model supports one lawyer for multiple defendants and 3-player self-representation.
- role plans cannot force a player into an unaccepted role.
- private `PrivateCaseVault` keeps character briefs/secrets/privileged consultation data outside synchronized Colyseus CourtState.
- clients can request only their own private brief through a direct room message.

## In progress

- production role-allocation orchestration (mode → defendant count → judge vote/system → defense selection → prosecution).
- preparation room lifecycle and retained-memory notes.
- client networking.

## Next exact implementation steps

1. Build RoleAllocationCoordinator state machine without rigid gameplay phases: mode choice, defendant count, judge candidate/vote, defense choice/fallback, prosecution.
2. Build Preparation coordinator that creates defense consultations and enforces retained-note limits.
3. Add Case composition skeleton from validated DNA.
4. Connect LobbyScene to Colyseus and render authoritative room state.
5. Centralize design/motion/layer tokens and expand Camera Director.

## Known limitations right now

- `setPrivateBriefForSession` is an internal integration point; Case Engine does not yet populate it.
- privileged notes are server-only storage and not persisted; database phase will add encrypted/access-controlled persistence strategy if needed.
- self representation defaults to Private only; this can change only through a documented product decision.
