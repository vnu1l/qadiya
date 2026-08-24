import { describe, expect, it } from 'vitest';
import {
  ASSIGNABLE_ROLES,
  DEFAULT_CASUAL_RULES,
  DEFAULT_PRIVATE_RULES,
  type AssignableRole,
  type LobbyPlayerProfile,
  type LobbyRules,
} from '@qadiya/shared';
import { RoleAllocationCoordinator, RoleAllocationError } from '../src/domain/roleAllocationCoordinator';

function player(
  id: string,
  options: {
    rejectedRoles?: AssignableRole[];
    automaticDefense?: boolean;
    recentDefendantAssignments?: number;
  } = {},
): LobbyPlayerProfile {
  const rejected = new Set(options.rejectedRoles ?? []);
  return {
    playerId: id,
    displayName: id,
    connected: true,
    ready: true,
    rolePreferences: ASSIGNABLE_ROLES.map((role) => ({
      role,
      accepted: !rejected.has(role),
      priority: 50,
      allowAutomaticAssignment: role === 'defense' ? (options.automaticDefense ?? true) : true,
    })),
    roleHistory: [
      {
        role: 'defendant',
        completedCases: options.recentDefendantAssignments ? 3 : 0,
        recentAssignments: options.recentDefendantAssignments ?? 0,
      },
    ],
  };
}

const alwaysFirst = () => 0;

function casualRules(overrides: Partial<LobbyRules> = {}): LobbyRules {
  return { ...DEFAULT_CASUAL_RULES, ...overrides };
}

function privateRules(overrides: Partial<LobbyRules> = {}): LobbyRules {
  return { ...DEFAULT_PRIVATE_RULES, ...overrides };
}

describe('RoleAllocationCoordinator', () => {
  it('runs defendant -> judge vote -> accepted defense -> prosecution without core collisions', () => {
    const players = [player('p1'), player('p2'), player('p3'), player('p4'), player('p5'), player('p6')];
    const coordinator = new RoleAllocationCoordinator(players, casualRules(), 1, 1, alwaysFirst);

    const started = coordinator.start();
    expect(started.defendantPlayerIds).toEqual(['p1']);
    expect(started.stage).toBe('awaiting-judge-vote');
    expect(started.judgeCandidateIds).not.toContain('p1');

    coordinator.castJudgeVote('p5', 'p2');
    coordinator.castJudgeVote('p6', 'p2');
    const afterVote = coordinator.closeJudgeVote();
    expect(afterVote.judgePlayerId).toBe('p2');
    expect(afterVote.stage).toBe('awaiting-defense-choice');

    coordinator.proposeDefenseLawyer('p1', 'p3');
    coordinator.respondDefenseRequest('p3', 'p1', true);
    const completed = coordinator.finalizeDefenseChoices();

    expect(completed.stage).toBe('complete');
    expect(coordinator.getCompletedPlan()).toEqual({
      judgePlayerId: 'p2',
      prosecutionPlayerId: 'p4',
      defendantPlayerIds: ['p1'],
      defenseRepresentations: [
        {
          id: 'lawyer:p3',
          defendantPlayerIds: ['p1'],
          lawyerPlayerId: 'p3',
          selfRepresented: false,
        },
      ],
    });
  });

  it('does not court-appoint the same lawyer who already rejected that defendant', () => {
    const players = [player('p1'), player('p2'), player('p3'), player('p4'), player('p5'), player('p6')];
    const coordinator = new RoleAllocationCoordinator(players, casualRules(), 1, 1, alwaysFirst);

    coordinator.start();
    coordinator.castJudgeVote('p5', 'p2');
    coordinator.closeJudgeVote();
    coordinator.proposeDefenseLawyer('p1', 'p3');
    coordinator.respondDefenseRequest('p3', 'p1', false);

    coordinator.courtAppointUnresolvedDefense();
    const lawyer = coordinator.getCompletedPlan()?.defenseRepresentations[0]?.lawyerPlayerId;
    expect(lawyer).toBeDefined();
    expect(lawyer).not.toBe('p3');
  });

  it('supports the full three-player private core through self representation', () => {
    const players = [player('p1'), player('p2'), player('p3')];
    const coordinator = new RoleAllocationCoordinator(players, privateRules(), 1, 0, alwaysFirst);

    const started = coordinator.start();
    expect(started.defendantPlayerIds).toEqual(['p1']);
    expect(started.stage).toBe('awaiting-judge-vote');

    // A zero-vote close is an explicit recovery route: fairness weights break the tie.
    const completed = coordinator.closeJudgeVote();
    const plan = coordinator.getCompletedPlan();
    expect(completed.stage).toBe('complete');
    expect(plan?.defendantPlayerIds).toEqual(['p1']);
    expect(plan?.defenseRepresentations).toEqual([
      {
        id: 'self:p1',
        defendantPlayerIds: ['p1'],
        selfRepresented: true,
      },
    ]);
    expect(new Set([plan?.judgePlayerId, plan?.prosecutionPlayerId, plan?.defendantPlayerIds[0]]).size).toBe(3);
  });

  it('requires the selected number of distinct human defense seats for a multi-defendant case', () => {
    const players = Array.from({ length: 8 }, (_, index) => player(`p${index + 1}`));
    const coordinator = new RoleAllocationCoordinator(players, casualRules(), 2, 2, alwaysFirst);

    coordinator.start();
    coordinator.closeJudgeVote();
    const [firstDefendant, secondDefendant] = coordinator.getSnapshot().defendantPlayerIds;
    expect(firstDefendant).toBeDefined();
    expect(secondDefendant).toBeDefined();

    coordinator.proposeDefenseLawyer(firstDefendant!, 'p4');
    coordinator.respondDefenseRequest('p4', firstDefendant!, true);
    coordinator.proposeDefenseLawyer(secondDefendant!, 'p4');
    coordinator.respondDefenseRequest('p4', secondDefendant!, true);

    expect(() => coordinator.finalizeDefenseChoices()).toThrowError(
      expect.objectContaining({ code: 'DEFENSE_SEAT_COUNT_MISMATCH' }),
    );
  });

  it('never allows a judge candidate to vote for themselves', () => {
    const players = [player('p1'), player('p2'), player('p3'), player('p4'), player('p5'), player('p6')];
    const coordinator = new RoleAllocationCoordinator(players, casualRules(), 1, 1, alwaysFirst);
    const started = coordinator.start();
    const candidate = started.judgeCandidateIds[0]!;

    expect(() => coordinator.castJudgeVote(candidate, candidate)).toThrowError(
      expect.objectContaining({ code: 'JUDGE_SELF_VOTE' }),
    );
  });

  it('does not silently force a rejected prosecution role', () => {
    const players = [
      player('p1'),
      player('p2'),
      player('p3'),
      player('p4', { rejectedRoles: ['prosecution'] }),
      player('p5', { rejectedRoles: ['prosecution'] }),
      player('p6', { rejectedRoles: ['prosecution'] }),
    ];
    const coordinator = new RoleAllocationCoordinator(players, casualRules(), 1, 1, alwaysFirst);

    coordinator.start();
    coordinator.castJudgeVote('p5', 'p2');
    coordinator.closeJudgeVote();
    coordinator.proposeDefenseLawyer('p1', 'p3');
    coordinator.respondDefenseRequest('p3', 'p1', true);

    expect(() => coordinator.finalizeDefenseChoices()).toThrowError(
      expect.objectContaining({ code: 'NO_ROLE_CANDIDATE' }),
    );
  });

  it('uses a typed allocation error with a stable code', () => {
    const players = [player('p1'), player('p2'), player('p3'), player('p4'), player('p5'), player('p6')];
    const coordinator = new RoleAllocationCoordinator(players, casualRules(), 1, 1, alwaysFirst);
    coordinator.start();
    const candidate = coordinator.getSnapshot().judgeCandidateIds[0]!;

    try {
      coordinator.castJudgeVote(candidate, candidate);
      throw new Error('Expected self vote to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(RoleAllocationError);
      expect((error as RoleAllocationError).code).toBe('JUDGE_SELF_VOTE');
    }
  });
});
