import { describe, expect, it } from 'vitest';
import { applyPreparationSnapshot, PreparationState, resetPreparationState } from '../src/state/CourtState';

describe('PreparationState projection', () => {
  it('synchronizes only public readiness metadata and can reset cleanly', () => {
    const state = new PreparationState();

    applyPreparationSnapshot(state, {
      stage: 'ready-to-open',
      participantPlayerIds: ['judge', 'defendant', 'lawyer'],
      readyPlayerIds: ['judge', 'lawyer'],
      hardBlockerCount: 0,
      warningCount: 1,
    });

    expect(state.stage).toBe('ready-to-open');
    expect([...state.participantSessionIds]).toEqual(['judge', 'defendant', 'lawyer']);
    expect([...state.readySessionIds]).toEqual(['judge', 'lawyer']);
    expect(state.hardBlockerCount).toBe(0);
    expect(state.warningCount).toBe(1);

    // No private memory, note text, secret id or consultation content exists in this schema.
    expect(Object.keys(state)).not.toEqual(expect.arrayContaining(['memory', 'notes', 'secrets', 'consultations']));

    resetPreparationState(state);
    expect(state.stage).toBe('inactive');
    expect(state.participantSessionIds.length).toBe(0);
    expect(state.readySessionIds.length).toBe(0);
    expect(state.hardBlockerCount).toBe(0);
    expect(state.warningCount).toBe(0);
  });
});
