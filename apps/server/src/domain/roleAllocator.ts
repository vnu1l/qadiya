import type {
  AssignableRole,
  LobbyPlayerProfile,
  RoleHistorySummary,
  RolePreference,
} from '@qadiya/shared';

export type RandomSource = () => number;

export interface WeightedRoleCandidate {
  playerId: string;
  displayName: string;
  weight: number;
  completedCases: number;
  recentAssignments: number;
  rookie: boolean;
}

function rolePreference(player: LobbyPlayerProfile, role: AssignableRole): RolePreference | undefined {
  return player.rolePreferences.find((preference) => preference.role === role);
}

function roleHistory(player: LobbyPlayerProfile, role: AssignableRole): RoleHistorySummary {
  return (
    player.roleHistory.find((history) => history.role === role) ?? {
      role,
      completedCases: 0,
      recentAssignments: 0,
    }
  );
}

function clampPriority(priority: number): number {
  if (!Number.isFinite(priority)) return 0;
  return Math.max(0, Math.min(100, priority));
}

export function roleOpportunityWeight(player: LobbyPlayerProfile, role: AssignableRole): number {
  const preference = rolePreference(player, role);
  if (!preference?.accepted) return 0;

  const history = roleHistory(player, role);
  const preferenceFactor = 1 + clampPriority(preference.priority) / 250;
  const antiRepeatFactor = 1 / (1 + history.recentAssignments * 2.5);
  const firstExperienceFactor = history.completedCases === 0 ? 1.2 : 1;

  return preferenceFactor * antiRepeatFactor * firstExperienceFactor;
}

function toCandidate(player: LobbyPlayerProfile, role: AssignableRole): WeightedRoleCandidate | null {
  const weight = roleOpportunityWeight(player, role);
  if (weight <= 0 || !player.connected || !player.ready) return null;

  const history = roleHistory(player, role);
  return {
    playerId: player.playerId,
    displayName: player.displayName,
    weight,
    completedCases: history.completedCases,
    recentAssignments: history.recentAssignments,
    rookie: history.completedCases < 5,
  };
}

function weightedPick(candidates: readonly WeightedRoleCandidate[], random: RandomSource): WeightedRoleCandidate {
  if (candidates.length === 0) throw new Error('Cannot pick from an empty candidate list.');

  const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  if (totalWeight <= 0) return candidates[0]!;

  const normalizedRandom = Math.max(0, Math.min(0.999999999, random()));
  let cursor = normalizedRandom * totalWeight;

  for (const candidate of candidates) {
    cursor -= candidate.weight;
    if (cursor <= 0) return candidate;
  }

  return candidates[candidates.length - 1]!;
}

/**
 * Selects defendants without replacement. If enough eligible players have not
 * recently been defendants, recent defendants are removed from the candidate
 * pool entirely instead of merely receiving a smaller chance.
 */
export function selectWeightedDefendants(
  players: readonly LobbyPlayerProfile[],
  count: number,
  random: RandomSource = Math.random,
): string[] {
  if (!Number.isInteger(count) || count < 1) throw new Error('Defendant count must be a positive integer.');

  let candidates = players
    .map((player) => toCandidate(player, 'defendant'))
    .filter((candidate): candidate is WeightedRoleCandidate => candidate !== null);

  if (candidates.length < count) {
    throw new Error(`Not enough eligible defendants: need ${count}, found ${candidates.length}.`);
  }

  const notRecentlyDefendant = candidates.filter((candidate) => candidate.recentAssignments === 0);
  if (notRecentlyDefendant.length >= count) candidates = notRecentlyDefendant;

  const selected: string[] = [];
  let remaining = [...candidates];

  while (selected.length < count) {
    const picked = weightedPick(remaining, random);
    selected.push(picked.playerId);
    remaining = remaining.filter((candidate) => candidate.playerId !== picked.playerId);
  }

  return selected;
}

/**
 * Casual judge candidates are intentionally opportunity-based rather than
 * win-rate-based so new players are not permanently excluded from the role.
 */
export function rankJudgeCandidates(
  players: readonly LobbyPlayerProfile[],
  limit = 3,
): WeightedRoleCandidate[] {
  return players
    .map((player) => toCandidate(player, 'judge'))
    .filter((candidate): candidate is WeightedRoleCandidate => candidate !== null)
    .sort((a, b) => b.weight - a.weight || a.completedCases - b.completedCases || a.playerId.localeCompare(b.playerId))
    .slice(0, Math.max(0, limit));
}

/**
 * This list is for the defendant-facing lawyer choice UI. Rookies stay visible
 * and receive a small presentation-order boost; no win-rate is part of the score.
 */
export function rankDefenseCandidates(players: readonly LobbyPlayerProfile[]): WeightedRoleCandidate[] {
  return players
    .map((player) => toCandidate(player, 'defense'))
    .filter((candidate): candidate is WeightedRoleCandidate => candidate !== null)
    .map((candidate) => ({
      ...candidate,
      weight: candidate.weight * (candidate.rookie ? 1.08 : 1),
    }))
    .sort((a, b) => b.weight - a.weight || a.completedCases - b.completedCases || a.playerId.localeCompare(b.playerId));
}

export function rankCourtAppointedDefense(players: readonly LobbyPlayerProfile[]): WeightedRoleCandidate[] {
  return rankDefenseCandidates(
    players.filter((player) => rolePreference(player, 'defense')?.allowAutomaticAssignment === true),
  );
}
