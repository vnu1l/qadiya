# QADIYA — قضية

QADIYA is an Arabic-first online courtroom game built for long-form social deduction, advocacy, evidence analysis, dynamic cases, and persistent legal careers.

The project is designed as a fullscreen browser game with an authoritative realtime server, structured case engine, layered 2.5D presentation, and sessions that may run from short cases to multi-hour trials.

## Mandatory reading before changing the project

Every AI or developer must read, in order:

1. [`AGENTS.md`](./AGENTS.md)
2. [`docs/PROJECT_MEMORY.md`](./docs/PROJECT_MEMORY.md)
3. [`docs/MASTER_PLAN.md`](./docs/MASTER_PLAN.md)
4. [`docs/DECISIONS.md`](./docs/DECISIONS.md)
5. [`docs/STATUS.md`](./docs/STATUS.md)

`PROJECT_MEMORY.md` is the canonical continuity file and must be updated alongside meaningful source/gameplay architecture changes.

## Workspace

- `apps/web` — Svelte 5 game client and 2.5D scene/UI runtime.
- `apps/server` — authoritative Node/Colyseus realtime server.
- `packages/case-engine` — structured truth/timeline/knowledge/evidence generation and validation.
- `packages/shared` — shared protocol and domain contracts.
- `docs` — product memory, execution plan, decisions, architecture, and status.

## Status

Pre-alpha foundation. The current milestone and next exact actions are tracked in [`docs/STATUS.md`](./docs/STATUS.md).
