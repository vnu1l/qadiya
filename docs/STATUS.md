# QADIYA — STATUS

Last updated: 2026-08-24

## Current milestone

**Phase 4/5 foundation — authoritative lobby state + Case Engine core**

## Completed

- durable continuity/memory/worklog system enforced by CI.
- modular Game Shell/scenes/camera registry.
- shared roles, lobby rules, Court Events and role preferences.
- weighted role fairness and judge-controlled Official Floor.
- Case Engine Facts/Timeline/Knowledge/Evidence/Charges + travel/precision validation.
- Case DNA and variable-role adaptation including 3-player System Character path.
- Colyseus `CourtState` now has typed lobby rules, player readiness, role preferences, host and session kind.
- server sanitizes role preference payloads and Private settings; host-only Private rule updates.
- Private min=3/max=12 and Casual/Ranked max=10 are server-side room rules, not client assumptions.

## In progress

- actual role assignment application/state transition.
- preparation/privilege contracts.
- client connection to authoritative lobby.

## Next exact implementation steps

1. Add server-only role assignment transaction with invariant checks and multi-defendant groups.
2. Add Preparation state and private knowledge/privilege boundaries that are not included in public room state.
3. Connect web LobbyScene to Colyseus client with optimistic UI only for harmless local panels.
4. Add design/motion/layer tokens and evolve Camera Director.
5. Start Case composition from Case DNA into validated Blueprint.

## Known limitations right now

- host transfer is currently first connected remaining player; later persistence/party ownership may refine it.
- role history/reputation are not yet loaded from database, so allocator persistence inputs remain future work.
- no authentication or database yet.
- artwork remains placeholder.
