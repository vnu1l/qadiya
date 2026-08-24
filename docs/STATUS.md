# QADIYA — STATUS

Last updated: 2026-08-24

## Current milestone

**Phase 4/5 foundation — shared lobby/role contracts + Case Engine primitives**

## Completed

- continuity governance and CI memory gate.
- modular Game Shell, scenes, and camera registry.
- shared role preference/assignment contracts.
- shared Casual/Ranked/Private lobby rule contracts, including 3-player Private and multi-defendant flags.
- expanded court event contract.
- Case Engine structured models for truth facts, timeline, knowledge provenance, evidence provenance, roles, and charges.
- Case Engine validation for references, scores, timeline ranges, knowledge source rules, and role engagement warnings.
- deterministic validator unit tests wired into CI.

## In progress

- design tokens and camera runtime hardening.
- role allocation fairness algorithm.
- deeper Case Engine temporal/knowledge validation.

## Next exact implementation steps

1. Add weighted role allocator with anti-repeat and rookie-safe defense selection inputs.
2. Add Timeline collision/travel feasibility primitives.
3. Add Knowledge precision/source validation rules beyond reference integrity.
4. Add Case DNA and variable-role selection scoring.
5. Wire typed lobby contracts into server room state instead of raw strings.

## Known limitations right now

- court artwork remains CSS placeholder architecture.
- lobby is still visual placeholder and not connected to Colyseus state.
- Case Engine is structural, not yet a procedural generator.
- no voice, database, or persistent accounts yet.
