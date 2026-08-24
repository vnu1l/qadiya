import type {
  CoreRoleAllocationPlan,
  DefenseRepresentationPlan,
  LobbyPlayerProfile,
  LobbyRules,
} from '@qadiya/shared';
import {
  rankCourtAppointedDefense,
  rankJudgeCandidates,
  roleOpportunityWeight,
  selectWeightedDefendants,
  type RandomSource,
} from './roleAllocator';

export type RoleAllocationStage =
  | 'not-started'
  | 'awaiting-private-defendants'
  | 'awaiting-judge-vote'
  | 'awaiting-private-judge'
  | 'awaiting-defense-choice'
  | 'awaiting-private-defense'
  | 'complete';

export class RoleAllocationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'RoleAllocationError';
  }
}

interface DefenseLawyerChoice {
  kind: 'lawyer';
  lawyerPlayerId: string;
  accepted: boolean;
}

interface SelfDefenseChoice {
  kind: 'self';
}

type DefenseChoice = DefenseLawyerChoice | SelfDefenseChoice;

export interface RoleAllocationSnapshot {
  stage: RoleAllocationStage;
  defendantPlayerIds: string[];
  judgeCandidateIds: string[];
  judgePlayerId?: string;
  prosecutionPlayerId?: string;
  requiredDefenseLawyerCount: number;
  pendingDefenseRequests: Array<{ defendantPlayerId: string; lawyerPlayerId: string }>;
  completedPlan?: CoreRoleAllocationPlan;
}

function acceptedRole(player: LobbyPlayerProfile, role: string): boolean {
  return player.rolePreferences.some((preference) => preference.role === role && preference.accepted);
}

function weightedPick(
  players: readonly LobbyPlayerProfile[],
  role: 'judge' | 'prosecution',
  random: RandomSource,
): LobbyPlayerProfile {
  if (players.length === 0) {
    throw new RoleAllocationError('NO_ROLE_CANDIDATE', `No eligible ${role} candidate is available.`);
  }

  const weighted = players.map((player) => ({ player, weight: roleOpportunityWeight(player, role) }));
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) {
    throw new RoleAllocationError('NO_ROLE_CANDIDATE', `No eligible ${role} candidate is available.`);
  }

  let cursor = Math.max(0, Math.min(0.999999999, random())) * total;
  for (const entry of weighted) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.player;
  }

  return weighted[weighted.length - 1]!.player;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

/**
 * Orchestrates only the human core-role assignment. It intentionally does not
 * mutate Colyseus state: once complete, its plan is passed to the atomic
 * roleTransaction boundary for a second server-side validation before commit.
 */
export class RoleAllocationCoordinator {
  private stage: RoleAllocationStage = 'not-started';
  private defendantPlayerIds: string[] = [];
  private judgeCandidateIds: string[] = [];
  private judgePlayerId?: string;
  private prosecutionPlayerId?: string;
  private readonly judgeVotes = new Map<string, string>();
  private readonly defenseChoices = new Map<string, DefenseChoice>();
  private readonly rejectedDefenseByDefendant = new Map<string, Set<string>>();
  private defenseRepresentations: DefenseRepresentationPlan[] = [];
  private completedPlan?: CoreRoleAllocationPlan;

  constructor(
    private readonly players: readonly LobbyPlayerProfile[],
    private readonly rules: LobbyRules,
    private readonly defendantCount: number,
    private readonly requiredDefenseLawyerCount: number,
    private readonly random: RandomSource = Math.random,
  ) {
    this.validateConfiguration();
  }

  getSnapshot(): RoleAllocationSnapshot {
    return {
      stage: this.stage,
      defendantPlayerIds: [...this.defendantPlayerIds],
      judgeCandidateIds: [...this.judgeCandidateIds],
      judgePlayerId: this.judgePlayerId,
      prosecutionPlayerId: this.prosecutionPlayerId,
      requiredDefenseLawyerCount: this.requiredDefenseLawyerCount,
      pendingDefenseRequests: [...this.defenseChoices.entries()]
        .filter((entry): entry is [string, DefenseLawyerChoice] => entry[1].kind === 'lawyer' && !entry[1].accepted)
        .map(([defendantPlayerId, choice]) => ({
          defendantPlayerId,
          lawyerPlayerId: choice.lawyerPlayerId,
        })),
      completedPlan: this.completedPlan
        ? {
            ...this.completedPlan,
            defendantPlayerIds: [...this.completedPlan.defendantPlayerIds],
            defenseRepresentations: this.completedPlan.defenseRepresentations.map((representation) => ({
              ...representation,
              defendantPlayerIds: [...representation.defendantPlayerIds],
            })),
          }
        : undefined,
    };
  }

  start(): RoleAllocationSnapshot {
    if (this.stage !== 'not-started') {
      throw new RoleAllocationError('ALLOCATION_ALREADY_STARTED', 'Role allocation has already started.');
    }

    if (this.rules.defendantSelection === 'private-host') {
      this.requirePrivateRoom('PRIVATE_DEFENDANT_SELECTION_OUTSIDE_PRIVATE');
      this.stage = 'awaiting-private-defendants';
      return this.getSnapshot();
    }

    if (this.rules.defendantSelection === 'weighted-system') {
      this.defendantPlayerIds = selectWeightedDefendants(this.activePlayers(), this.defendantCount, this.random);
    } else {
      this.defendantPlayerIds = this.randomDefendants();
    }

    this.beginJudgeSelection();
    return this.getSnapshot();
  }

  setPrivateDefendants(playerIds: readonly string[]): RoleAllocationSnapshot {
    this.requireStage('awaiting-private-defendants');
    this.requirePrivateRoom('PRIVATE_DEFENDANT_SELECTION_OUTSIDE_PRIVATE');

    const ids = unique(playerIds);
    if (ids.length !== this.defendantCount || ids.length !== playerIds.length) {
      throw new RoleAllocationError('INVALID_PRIVATE_DEFENDANTS', 'Private defendant selection must match the selected defendant count exactly.');
    }

    for (const playerId of ids) this.requireEligiblePlayer(playerId, 'defendant');
    this.defendantPlayerIds = ids;
    this.beginJudgeSelection();
    return this.getSnapshot();
  }

  castJudgeVote(voterPlayerId: string, candidatePlayerId: string): RoleAllocationSnapshot {
    this.requireStage('awaiting-judge-vote');
    const voter = this.requireActivePlayer(voterPlayerId);
    if (!this.judgeCandidateIds.includes(candidatePlayerId)) {
      throw new RoleAllocationError('INVALID_JUDGE_CANDIDATE', 'The selected player is not a judge candidate.');
    }
    if (voter.playerId === candidatePlayerId) {
      throw new RoleAllocationError('JUDGE_SELF_VOTE', 'Judge candidates cannot vote for themselves.');
    }

    this.judgeVotes.set(voter.playerId, candidatePlayerId);
    return this.getSnapshot();
  }

  closeJudgeVote(): RoleAllocationSnapshot {
    this.requireStage('awaiting-judge-vote');
    const candidates = this.judgeCandidateIds.map((id) => this.requireActivePlayer(id));
    const tallies = new Map<string, number>();
    for (const candidateId of this.judgeCandidateIds) tallies.set(candidateId, 0);
    for (const candidateId of this.judgeVotes.values()) {
      tallies.set(candidateId, (tallies.get(candidateId) ?? 0) + 1);
    }

    const highest = Math.max(...tallies.values());
    const tiedIds = highest > 0
      ? this.judgeCandidateIds.filter((candidateId) => tallies.get(candidateId) === highest)
      : [...this.judgeCandidateIds];
    const tiedCandidates = candidates.filter((candidate) => tiedIds.includes(candidate.playerId));

    this.judgePlayerId = weightedPick(tiedCandidates, 'judge', this.random).playerId;
    this.beginDefenseSelection();
    return this.getSnapshot();
  }

  setPrivateJudge(playerId: string): RoleAllocationSnapshot {
    this.requireStage('awaiting-private-judge');
    this.requirePrivateRoom('PRIVATE_JUDGE_SELECTION_OUTSIDE_PRIVATE');
    this.requireEligiblePlayer(playerId, 'judge', new Set(this.defendantPlayerIds));
    this.judgePlayerId = playerId;
    this.beginDefenseSelection();
    return this.getSnapshot();
  }

  proposeDefenseLawyer(defendantPlayerId: string, lawyerPlayerId: string): RoleAllocationSnapshot {
    this.requireStage('awaiting-defense-choice');
    this.requireDefendant(defendantPlayerId);
    this.requireEligiblePlayer(lawyerPlayerId, 'defense', this.coreReservedIds());

    if (this.rejectedDefenseByDefendant.get(defendantPlayerId)?.has(lawyerPlayerId)) {
      throw new RoleAllocationError('DEFENSE_REQUEST_ALREADY_REJECTED', 'This lawyer already rejected this defendant during the current allocation.');
    }

    this.defenseChoices.set(defendantPlayerId, {
      kind: 'lawyer',
      lawyerPlayerId,
      accepted: false,
    });
    return this.getSnapshot();
  }

  respondDefenseRequest(lawyerPlayerId: string, defendantPlayerId: string, accepted: boolean): RoleAllocationSnapshot {
    this.requireStage('awaiting-defense-choice');
    const choice = this.defenseChoices.get(defendantPlayerId);
    if (choice?.kind !== 'lawyer' || choice.lawyerPlayerId !== lawyerPlayerId) {
      throw new RoleAllocationError('NO_PENDING_DEFENSE_REQUEST', 'No matching defense request is pending.');
    }

    if (accepted) {
      choice.accepted = true;
      this.defenseChoices.set(defendantPlayerId, choice);
    } else {
      this.defenseChoices.delete(defendantPlayerId);
      const rejected = this.rejectedDefenseByDefendant.get(defendantPlayerId) ?? new Set<string>();
      rejected.add(lawyerPlayerId);
      this.rejectedDefenseByDefendant.set(defendantPlayerId, rejected);
    }

    return this.getSnapshot();
  }

  chooseSelfRepresentation(defendantPlayerId: string): RoleAllocationSnapshot {
    this.requireStage('awaiting-defense-choice');
    this.requireDefendant(defendantPlayerId);
    if (!this.rules.allowSelfRepresentation) {
      throw new RoleAllocationError('SELF_REPRESENTATION_DISABLED', 'This room does not allow self representation.');
    }

    this.defenseChoices.set(defendantPlayerId, { kind: 'self' });
    return this.getSnapshot();
  }

  finalizeDefenseChoices(): RoleAllocationSnapshot {
    this.requireStage('awaiting-defense-choice');
    this.defenseRepresentations = this.buildRepresentationsFromChoices();
    this.assignProsecutionAndComplete();
    return this.getSnapshot();
  }

  courtAppointUnresolvedDefense(): RoleAllocationSnapshot {
    this.requireStage('awaiting-defense-choice');

    for (const [defendantId, choice] of [...this.defenseChoices.entries()]) {
      if (choice.kind === 'lawyer' && !choice.accepted) this.defenseChoices.delete(defendantId);
    }

    const acceptedLawyers = unique(
      [...this.defenseChoices.values()]
        .filter((choice): choice is DefenseLawyerChoice => choice.kind === 'lawyer' && choice.accepted)
        .map((choice) => choice.lawyerPlayerId),
    );

    if (acceptedLawyers.length > this.requiredDefenseLawyerCount) {
      throw new RoleAllocationError('TOO_MANY_ACCEPTED_DEFENSE_LAWYERS', 'Accepted defense choices already exceed the case defense-seat requirement.');
    }

    const unresolved = this.defendantPlayerIds.filter((id) => !this.defenseChoices.has(id));
    const newLawyersNeeded = this.requiredDefenseLawyerCount - acceptedLawyers.length;
    if (newLawyersNeeded > unresolved.length) {
      throw new RoleAllocationError(
        'DEFENSE_RESELECTION_REQUIRED',
        'The current accepted/self choices leave too few unresolved defendants to satisfy the required number of defense seats.',
      );
    }

    const candidatePool = rankCourtAppointedDefense(
      this.activePlayers().filter((player) => !this.coreReservedIds().has(player.playerId) && !acceptedLawyers.includes(player.playerId)),
    );
    const newLawyers = candidatePool.slice(0, newLawyersNeeded).map((candidate) => candidate.playerId);
    if (newLawyers.length !== newLawyersNeeded) {
      throw new RoleAllocationError('NO_COURT_APPOINTED_DEFENSE', 'Not enough opted-in lawyers are available for court appointment.');
    }

    const allLawyers = [...acceptedLawyers, ...newLawyers];
    for (let index = 0; index < unresolved.length; index += 1) {
      const defendantId = unresolved[index]!;
      const rejected = this.rejectedDefenseByDefendant.get(defendantId) ?? new Set<string>();
      const preferred = allLawyers.find((lawyerId) => !rejected.has(lawyerId));
      if (!preferred) {
        throw new RoleAllocationError('ALL_DEFENSE_OPTIONS_REJECTED', `No court-appointed lawyer remains for ${defendantId}.`);
      }
      this.defenseChoices.set(defendantId, { kind: 'lawyer', lawyerPlayerId: preferred, accepted: true });
    }

    return this.finalizeDefenseChoices();
  }

  setPrivateDefenseRepresentations(representations: readonly DefenseRepresentationPlan[]): RoleAllocationSnapshot {
    this.requireStage('awaiting-private-defense');
    this.requirePrivateRoom('PRIVATE_DEFENSE_SELECTION_OUTSIDE_PRIVATE');
    this.validateRepresentations(representations);
    this.defenseRepresentations = representations.map((representation) => ({
      ...representation,
      defendantPlayerIds: [...representation.defendantPlayerIds],
    }));
    this.assignProsecutionAndComplete();
    return this.getSnapshot();
  }

  private validateConfiguration(): void {
    const activeCount = this.activePlayers().length;
    if (activeCount < this.rules.minPlayers || activeCount > this.rules.maxPlayers) {
      throw new RoleAllocationError('INVALID_ACTIVE_PLAYER_COUNT', 'Active ready players do not satisfy the room player bounds.');
    }
    if (!Number.isInteger(this.defendantCount) || this.defendantCount < 1 || this.defendantCount > this.rules.maxDefendants) {
      throw new RoleAllocationError('INVALID_DEFENDANT_COUNT', 'Defendant count is outside the room rules.');
    }
    if (!this.rules.allowMultipleDefendants && this.defendantCount > 1) {
      throw new RoleAllocationError('MULTIPLE_DEFENDANTS_DISABLED', 'This room does not allow multiple defendants.');
    }
    if (
      !Number.isInteger(this.requiredDefenseLawyerCount) ||
      this.requiredDefenseLawyerCount < 0 ||
      this.requiredDefenseLawyerCount > this.defendantCount
    ) {
      throw new RoleAllocationError('INVALID_DEFENSE_SEAT_COUNT', 'Defense lawyer count must be between zero and the defendant count.');
    }
    if (this.requiredDefenseLawyerCount === 0 && !this.rules.allowSelfRepresentation) {
      throw new RoleAllocationError('DEFENSE_REQUIRED', 'At least one defense lawyer is required when self representation is disabled.');
    }

    const requiredCoreHumans = 2 + this.defendantCount + this.requiredDefenseLawyerCount;
    if (requiredCoreHumans > activeCount) {
      throw new RoleAllocationError('NOT_ENOUGH_PLAYERS_FOR_CORE_ROLES', 'The selected core-role structure cannot fit the active lobby.');
    }
  }

  private activePlayers(): LobbyPlayerProfile[] {
    return this.players.filter((player) => player.connected && player.ready);
  }

  private randomDefendants(): string[] {
    let candidates = this.activePlayers().filter((player) => acceptedRole(player, 'defendant'));
    if (candidates.length < this.defendantCount) {
      throw new RoleAllocationError('NOT_ENOUGH_DEFENDANTS', 'Not enough players accepted the defendant role.');
    }

    const selected: string[] = [];
    while (selected.length < this.defendantCount) {
      const index = Math.floor(Math.max(0, Math.min(0.999999999, this.random())) * candidates.length);
      const picked = candidates[index]!;
      selected.push(picked.playerId);
      candidates = candidates.filter((candidate) => candidate.playerId !== picked.playerId);
    }
    return selected;
  }

  private beginJudgeSelection(): void {
    const excluded = new Set(this.defendantPlayerIds);
    const judgePool = this.activePlayers().filter((player) => !excluded.has(player.playerId));

    if (this.rules.judgeSelection === 'private-host') {
      this.requirePrivateRoom('PRIVATE_JUDGE_SELECTION_OUTSIDE_PRIVATE');
      this.stage = 'awaiting-private-judge';
      return;
    }

    if (this.rules.judgeSelection === 'weighted-system') {
      this.judgePlayerId = weightedPick(
        judgePool.filter((player) => acceptedRole(player, 'judge')),
        'judge',
        this.random,
      ).playerId;
      this.beginDefenseSelection();
      return;
    }

    this.judgeCandidateIds = rankJudgeCandidates(judgePool, 3).map((candidate) => candidate.playerId);
    if (this.judgeCandidateIds.length === 0) {
      throw new RoleAllocationError('NO_JUDGE_CANDIDATES', 'No eligible judge candidates are available.');
    }
    if (this.judgeCandidateIds.length === 1) {
      this.judgePlayerId = this.judgeCandidateIds[0];
      this.beginDefenseSelection();
      return;
    }

    this.stage = 'awaiting-judge-vote';
  }

  private beginDefenseSelection(): void {
    if (!this.judgePlayerId) throw new RoleAllocationError('JUDGE_REQUIRED', 'Judge must be resolved before defense selection.');

    if (this.requiredDefenseLawyerCount === 0) {
      if (!this.rules.allowSelfRepresentation) {
        throw new RoleAllocationError('SELF_REPRESENTATION_DISABLED', 'Zero-lawyer defense requires self representation.');
      }
      this.defenseRepresentations = this.defendantPlayerIds.map((defendantId) => ({
        id: `self:${defendantId}`,
        defendantPlayerIds: [defendantId],
        selfRepresented: true,
      }));
      this.assignProsecutionAndComplete();
      return;
    }

    if (this.rules.defenseSelection === 'private-host') {
      this.requirePrivateRoom('PRIVATE_DEFENSE_SELECTION_OUTSIDE_PRIVATE');
      this.stage = 'awaiting-private-defense';
      return;
    }

    if (this.rules.defenseSelection === 'court-appointed') {
      this.stage = 'awaiting-defense-choice';
      this.courtAppointUnresolvedDefense();
      return;
    }

    this.stage = 'awaiting-defense-choice';
  }

  private buildRepresentationsFromChoices(): DefenseRepresentationPlan[] {
    for (const defendantId of this.defendantPlayerIds) {
      const choice = this.defenseChoices.get(defendantId);
      if (!choice) {
        throw new RoleAllocationError('DEFENSE_CHOICE_INCOMPLETE', `Defendant ${defendantId} has no completed defense choice.`);
      }
      if (choice.kind === 'lawyer' && !choice.accepted) {
        throw new RoleAllocationError('DEFENSE_REQUEST_PENDING', `Lawyer ${choice.lawyerPlayerId} has not accepted the defense request.`);
      }
    }

    const distinctLawyers = unique(
      [...this.defenseChoices.values()]
        .filter((choice): choice is DefenseLawyerChoice => choice.kind === 'lawyer')
        .map((choice) => choice.lawyerPlayerId),
    );
    if (distinctLawyers.length !== this.requiredDefenseLawyerCount) {
      throw new RoleAllocationError(
        'DEFENSE_SEAT_COUNT_MISMATCH',
        `The case requires exactly ${this.requiredDefenseLawyerCount} distinct defense lawyer seat(s).`,
      );
    }

    const representations: DefenseRepresentationPlan[] = [];
    for (const lawyerId of distinctLawyers) {
      const defendants = this.defendantPlayerIds.filter((defendantId) => {
        const choice = this.defenseChoices.get(defendantId);
        return choice?.kind === 'lawyer' && choice.lawyerPlayerId === lawyerId;
      });
      representations.push({
        id: `lawyer:${lawyerId}`,
        defendantPlayerIds: defendants,
        lawyerPlayerId: lawyerId,
        selfRepresented: false,
      });
    }

    for (const defendantId of this.defendantPlayerIds) {
      if (this.defenseChoices.get(defendantId)?.kind === 'self') {
        representations.push({
          id: `self:${defendantId}`,
          defendantPlayerIds: [defendantId],
          selfRepresented: true,
        });
      }
    }

    this.validateRepresentations(representations);
    return representations;
  }

  private validateRepresentations(representations: readonly DefenseRepresentationPlan[]): void {
    const covered = new Map<string, number>();
    const lawyers = new Set<string>();
    const reserved = this.coreReservedIds();

    for (const representation of representations) {
      if (representation.defendantPlayerIds.length === 0) {
        throw new RoleAllocationError('EMPTY_DEFENSE_REPRESENTATION', 'A defense representation cannot be empty.');
      }
      for (const defendantId of representation.defendantPlayerIds) {
        this.requireDefendant(defendantId);
        covered.set(defendantId, (covered.get(defendantId) ?? 0) + 1);
      }

      if (representation.selfRepresented) {
        if (!this.rules.allowSelfRepresentation || representation.lawyerPlayerId || representation.defendantPlayerIds.length !== 1) {
          throw new RoleAllocationError('INVALID_SELF_REPRESENTATION', 'Self representation must be enabled and cover exactly one defendant without a lawyer.');
        }
        continue;
      }

      if (!representation.lawyerPlayerId) {
        throw new RoleAllocationError('DEFENSE_LAWYER_REQUIRED', 'Non-self representation requires a lawyer.');
      }
      if (lawyers.has(representation.lawyerPlayerId)) {
        throw new RoleAllocationError('DUPLICATE_DEFENSE_LAWYER_RECORD', 'A lawyer must use one shared representation record for all represented defendants.');
      }
      this.requireEligiblePlayer(representation.lawyerPlayerId, 'defense', reserved);
      lawyers.add(representation.lawyerPlayerId);
    }

    for (const defendantId of this.defendantPlayerIds) {
      if (covered.get(defendantId) !== 1) {
        throw new RoleAllocationError('DEFENDANT_NOT_EXACTLY_ONCE', `Defendant ${defendantId} must be represented exactly once.`);
      }
    }
    if (lawyers.size !== this.requiredDefenseLawyerCount) {
      throw new RoleAllocationError('DEFENSE_SEAT_COUNT_MISMATCH', 'Defense plan does not match the selected case human-seat requirement.');
    }
  }

  private assignProsecutionAndComplete(): void {
    const excluded = this.coreReservedIds();
    for (const representation of this.defenseRepresentations) {
      if (representation.lawyerPlayerId) excluded.add(representation.lawyerPlayerId);
    }

    const candidates = this.activePlayers().filter(
      (player) => !excluded.has(player.playerId) && acceptedRole(player, 'prosecution'),
    );
    this.prosecutionPlayerId = weightedPick(candidates, 'prosecution', this.random).playerId;

    this.completedPlan = {
      judgePlayerId: this.judgePlayerId!,
      prosecutionPlayerId: this.prosecutionPlayerId,
      defendantPlayerIds: [...this.defendantPlayerIds],
      defenseRepresentations: this.defenseRepresentations.map((representation) => ({
        ...representation,
        defendantPlayerIds: [...representation.defendantPlayerIds],
      })),
    };
    this.stage = 'complete';
  }

  private coreReservedIds(): Set<string> {
    return new Set([...(this.judgePlayerId ? [this.judgePlayerId] : []), ...this.defendantPlayerIds]);
  }

  private requireDefendant(playerId: string): void {
    if (!this.defendantPlayerIds.includes(playerId)) {
      throw new RoleAllocationError('NOT_A_DEFENDANT', `${playerId} is not a defendant in this allocation.`);
    }
  }

  private requireActivePlayer(playerId: string): LobbyPlayerProfile {
    const player = this.activePlayers().find((candidate) => candidate.playerId === playerId);
    if (!player) throw new RoleAllocationError('PLAYER_NOT_ACTIVE', `${playerId} is not an active ready player.`);
    return player;
  }

  private requireEligiblePlayer(playerId: string, role: 'defendant' | 'judge' | 'defense', excluded = new Set<string>()): LobbyPlayerProfile {
    if (excluded.has(playerId)) {
      throw new RoleAllocationError('ROLE_COLLISION', `${playerId} is already reserved for an incompatible core role.`);
    }
    const player = this.requireActivePlayer(playerId);
    if (!acceptedRole(player, role)) {
      throw new RoleAllocationError('ROLE_NOT_ACCEPTED', `${playerId} did not accept role ${role}.`);
    }
    return player;
  }

  private requirePrivateRoom(code: string): void {
    if (this.rules.sessionKind !== 'private') {
      throw new RoleAllocationError(code, 'Private-host role selection is only valid in a private room.');
    }
  }

  private requireStage(stage: RoleAllocationStage): void {
    if (this.stage !== stage) {
      throw new RoleAllocationError('INVALID_ALLOCATION_STAGE', `Expected allocation stage ${stage}, found ${this.stage}.`);
    }
  }
}
