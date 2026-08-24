import { describe, expect, it } from 'vitest';
import { applyRoleAllocationSnapshot, resetRoleAllocationState, RoleAllocationState } from '../src/state/CourtState';

describe('RoleAllocationState projection', () => {
  it('contains only the public allocation projection and can be reset without rebuilding CourtState', () => {
    const state = new RoleAllocationState();

    applyRoleAllocationSnapshot(state, {
      stage: 'awaiting-defense-choice',
      defendantPlayerIds: ['d1', 'd2'],
      judgeCandidateIds: ['j1', 'j2'],
      judgePlayerId: 'j1',
      requiredDefenseLawyerCount: 2,
      pendingDefenseRequests: [
        { defendantPlayerId: 'd1', lawyerPlayerId: 'l1' },
        { defendantPlayerId: 'd2', lawyerPlayerId: 'l2' },
      ],
    });

    expect([...state.defendantSessionIds]).toEqual(['d1', 'd2']);
    expect([...state.judgeCandidateSessionIds]).toEqual(['j1', 'j2']);
    expect(state.judgeSessionId).toBe('j1');
    expect(state.requiredDefenseLawyerCount).toBe(2);
    expect(state.pendingDefenseRequests.get('d1')?.lawyerSessionId).toBe('l1');

    resetRoleAllocationState(state);
    expect(state.stage).toBe('not-started');
    expect(state.defendantSessionIds.length).toBe(0);
    expect(state.judgeCandidateSessionIds.length).toBe(0);
    expect(state.pendingDefenseRequests.size).toBe(0);
  });
});
