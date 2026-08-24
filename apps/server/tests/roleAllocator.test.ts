import { describe, expect, it } from 'vitest';
import type { AssignableRole, LobbyPlayerProfile } from '@qadiya/shared';
import {
  rankCourtAppointedDefense,
  rankDefenseCandidates,
  rankJudgeCandidates,
  selectWeightedDefendants,
} from '../src/domain/roleAllocator';

function player(
  id: string,
  role: AssignableRole,
  options: { accepted?: boolean; auto?: boolean; completed?: number; recent?: number; priority?: number } = {},
): LobbyPlayerProfile {
  return {
    playerId: id,
    displayName: id,
    connected: true,
    ready: true,
    reputationBand: 'new',
    rolePreferences: [
      {
        role,
        accepted: options.accepted ?? true,
        priority: options.priority ?? 50,
        allowAutomaticAssignment: options.auto ?? true,
      },
    ],
    roleHistory: [
      {
        role,
        completedCases: options.completed ?? 0,
        recentAssignments: options.recent ?? 0,
      },
    ],
  };
}

describe('role allocator', () => {
  it('never assigns defendant to a player who rejected the role', () => {
    const players = [player('a', 'defendant', { accepted: false }), player('b', 'defendant'), player('c', 'defendant')];
    const selected = selectWeightedDefendants(players, 1, () => 0);
    expect(selected).not.toContain('a');
  });

  it('removes recent defendants from the pool when enough alternatives exist', () => {
    const players = [
      player('recent', 'defendant', { recent: 2, completed: 10 }),
      player('fresh-a', 'defendant', { recent: 0 }),
      player('fresh-b', 'defendant', { recent: 0 }),
    ];

    const selected = selectWeightedDefendants(players, 2, () => 0);
    expect(selected.sort()).toEqual(['fresh-a', 'fresh-b']);
  });

  it('keeps rookie lawyers visible to the defendant', () => {
    const candidates = rankDefenseCandidates([
      player('rookie', 'defense', { completed: 0 }),
      player('veteran', 'defense', { completed: 80 }),
    ]);

    expect(candidates.map((candidate) => candidate.playerId)).toContain('rookie');
  });

  it('court-appointed defense only includes players who opted into automatic assignment', () => {
    const candidates = rankCourtAppointedDefense([
      player('auto', 'defense', { auto: true }),
      player('manual-only', 'defense', { auto: false }),
    ]);

    expect(candidates.map((candidate) => candidate.playerId)).toEqual(['auto']);
  });

  it('judge candidate ranking does not require prior judge cases', () => {
    const candidates = rankJudgeCandidates([player('new-judge', 'judge', { completed: 0 })]);
    expect(candidates[0]?.playerId).toBe('new-judge');
  });
});
