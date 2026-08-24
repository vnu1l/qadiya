import { describe, expect, it } from 'vitest';
import { DEFAULT_CASUAL_RULES, DEFAULT_PRIVATE_RULES, type CoreRoleAllocationPlan } from '@qadiya/shared';
import { applyCoreRolePlan } from '../src/domain/roleTransaction';
import { applyRolePreferencesState, CourtState, PlayerState } from '../src/state/CourtState';

function addPlayer(state: CourtState, id: string, acceptedRoles: Array<'judge' | 'prosecution' | 'defendant' | 'defense'>) {
  const player = new PlayerState();
  player.displayName = id;
  player.ready = true;
  applyRolePreferencesState(
    player,
    acceptedRoles.map((role) => ({ role, accepted: true, priority: 50, allowAutomaticAssignment: true })),
  );
  state.players.set(id, player);
}

function threePlayerPlan(): CoreRoleAllocationPlan {
  return {
    judgePlayerId: 'judge',
    prosecutionPlayerId: 'prosecution',
    defendantPlayerIds: ['defendant'],
    defenseRepresentations: [
      { id: 'defense-self', defendantPlayerIds: ['defendant'], selfRepresented: true },
    ],
  };
}

describe('applyCoreRolePlan', () => {
  it('supports the three-player private self-representation path atomically', () => {
    const state = new CourtState();
    addPlayer(state, 'judge', ['judge']);
    addPlayer(state, 'prosecution', ['prosecution']);
    addPlayer(state, 'defendant', ['defendant']);

    const issues = applyCoreRolePlan(state, threePlayerPlan(), DEFAULT_PRIVATE_RULES);
    expect(issues).toEqual([]);
    expect(state.players.get('judge')?.role).toBe('judge');
    expect(state.players.get('prosecution')?.role).toBe('prosecution');
    expect(state.players.get('defendant')?.role).toBe('defendant');
    expect(state.phase).toBe('preparation');
  });

  it('rejects self representation in casual and leaves all roles untouched', () => {
    const state = new CourtState();
    addPlayer(state, 'judge', ['judge']);
    addPlayer(state, 'prosecution', ['prosecution']);
    addPlayer(state, 'defendant', ['defendant']);

    const issues = applyCoreRolePlan(state, threePlayerPlan(), DEFAULT_CASUAL_RULES);
    expect(issues.some((issue) => issue.code === 'SELF_REPRESENTATION_DISABLED')).toBe(true);
    expect([...state.players.values()].every((player) => player.role === 'unassigned')).toBe(true);
    expect(state.phase).toBe('lobby');
  });

  it('rejects a lawyer who did not accept defense', () => {
    const state = new CourtState();
    addPlayer(state, 'judge', ['judge']);
    addPlayer(state, 'prosecution', ['prosecution']);
    addPlayer(state, 'defendant', ['defendant']);
    addPlayer(state, 'lawyer', ['prosecution']);

    const plan: CoreRoleAllocationPlan = {
      judgePlayerId: 'judge',
      prosecutionPlayerId: 'prosecution',
      defendantPlayerIds: ['defendant'],
      defenseRepresentations: [
        { id: 'defense-1', defendantPlayerIds: ['defendant'], lawyerPlayerId: 'lawyer', selfRepresented: false },
      ],
    };

    const issues = applyCoreRolePlan(state, plan, DEFAULT_PRIVATE_RULES);
    expect(issues.some((issue) => issue.code === 'ROLE_NOT_ACCEPTED' && issue.playerId === 'lawyer')).toBe(true);
    expect(state.players.get('lawyer')?.role).toBe('unassigned');
  });

  it('allows one consenting defense lawyer to represent multiple defendants', () => {
    const state = new CourtState();
    addPlayer(state, 'judge', ['judge']);
    addPlayer(state, 'prosecution', ['prosecution']);
    addPlayer(state, 'def-a', ['defendant']);
    addPlayer(state, 'def-b', ['defendant']);
    addPlayer(state, 'lawyer', ['defense']);

    const plan: CoreRoleAllocationPlan = {
      judgePlayerId: 'judge',
      prosecutionPlayerId: 'prosecution',
      defendantPlayerIds: ['def-a', 'def-b'],
      defenseRepresentations: [
        { id: 'joint-defense', defendantPlayerIds: ['def-a', 'def-b'], lawyerPlayerId: 'lawyer', selfRepresented: false },
      ],
    };

    const issues = applyCoreRolePlan(state, plan, DEFAULT_PRIVATE_RULES);
    expect(issues).toEqual([]);
    expect(state.players.get('lawyer')?.role).toBe('defense');
    expect(state.defenseRepresentations.get('joint-defense')?.defendantSessionIds.length).toBe(2);
  });
});
