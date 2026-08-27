import type { LobbyRules } from '@qadiya/shared';
import type { CaseDNA } from './dna.js';
import { validateCaseDNA } from './dna.js';
import type { CaseMode } from './model.js';

export type RandomSource = () => number;

function pickOne<T>(values: readonly T[], random: RandomSource): T | null {
  if (values.length === 0) return null;
  const unit = Math.max(0, Math.min(0.999999999, random()));
  return values[Math.floor(unit * values.length)] ?? null;
}

function complexityAllowed(dna: CaseDNA, rules: LobbyRules): boolean {
  switch (rules.commitment) {
    case 'small':
      return dna.complexity <= 2;
    case 'standard':
      return dna.complexity <= 3;
    case 'large':
      return dna.complexity >= 2 && dna.complexity <= 4;
    case 'long':
      return dna.complexity >= 3;
    case 'any':
      return true;
  }
}

function dnaRespectsRoomModifiers(dna: CaseDNA, rules: LobbyRules): boolean {
  if (validateCaseDNA(dna).length > 0) return false;
  if (dna.minDefendants > rules.maxDefendants) return false;
  if (!rules.allowMultipleDefendants && dna.minDefendants > 1) return false;
  if (!rules.allowCrossDefendantContradictions && dna.modifiers.includes('cross-defendant-contradictions')) return false;
  return complexityAllowed(dna, rules);
}

/**
 * Returns possible core-seat counts for this defendant count. One defense
 * lawyer may represent all defendants; at the other end, each defendant may
 * have separate counsel. Private self-representation permits zero lawyers.
 */
export function possibleCoreHumanCounts(defendantCount: number, rules: LobbyRules): number[] {
  if (!Number.isInteger(defendantCount) || defendantCount < 1) return [];

  const baseWithoutLawyers = 2 + defendantCount; // judge + prosecution + defendants
  const minLawyers = rules.allowSelfRepresentation ? 0 : 1;
  const maxLawyers = defendantCount;
  const values: number[] = [];

  for (let lawyers = minLawyers; lawyers <= maxLawyers; lawyers += 1) {
    values.push(baseWithoutLawyers + lawyers);
  }

  return values;
}

export function dnaCanFitPlayerCount(
  dna: CaseDNA,
  defendantCount: number,
  playerCount: number,
  rules: LobbyRules,
): boolean {
  if (!dnaRespectsRoomModifiers(dna, rules)) return false;
  if (playerCount < rules.minPlayers || playerCount > rules.maxPlayers) return false;
  if (defendantCount < dna.minDefendants || defendantCount > dna.maxDefendants) return false;
  if (defendantCount > rules.maxDefendants) return false;
  if (defendantCount > 1 && !rules.allowMultipleDefendants) return false;

  return possibleCoreHumanCounts(defendantCount, rules).some((coreHumans) => {
    if (coreHumans > playerCount) return false;
    const variableHumans = playerCount - coreHumans;
    if (variableHumans > dna.variableRoleBudget.max) return false;
    if (!rules.allowSystemCharacters && variableHumans < dna.variableRoleBudget.min) return false;
    return true;
  });
}

function feasibleDefendantCounts(
  mode: CaseMode,
  dnaPool: readonly CaseDNA[],
  playerCount: number,
  rules: LobbyRules,
): number[] {
  const counts: number[] = [];

  for (let count = 1; count <= rules.maxDefendants; count += 1) {
    if (dnaPool.some((dna) => dna.mode === mode && dnaCanFitPlayerCount(dna, count, playerCount, rules))) {
      counts.push(count);
    }
  }

  return counts;
}

/** First public selection step: choose a mode that can actually produce a fair case for this lobby. */
export function selectCaseMode(
  dnaPool: readonly CaseDNA[],
  playerCount: number,
  rules: LobbyRules,
  random: RandomSource = Math.random,
): CaseMode | null {
  const modes = [...new Set(dnaPool.map((dna) => dna.mode))]
    .filter((mode) => feasibleDefendantCounts(mode, dnaPool, playerCount, rules).length > 0)
    .sort();

  return pickOne(modes, random);
}

/** Second step: after the mode is public, choose a defendant count that remains feasible. */
export function selectDefendantCount(
  mode: CaseMode,
  dnaPool: readonly CaseDNA[],
  playerCount: number,
  rules: LobbyRules,
  random: RandomSource = Math.random,
): number | null {
  return pickOne(feasibleDefendantCounts(mode, dnaPool, playerCount, rules), random);
}

/** Third step: choose the specific DNA only after mode and defendant count are fixed. */
export function selectCaseDNA(
  mode: CaseMode,
  defendantCount: number,
  dnaPool: readonly CaseDNA[],
  playerCount: number,
  rules: LobbyRules,
  random: RandomSource = Math.random,
): CaseDNA | null {
  const candidates = dnaPool
    .filter((dna) => dna.mode === mode && dnaCanFitPlayerCount(dna, defendantCount, playerCount, rules))
    .sort((a, b) => a.id.localeCompare(b.id));

  return pickOne(candidates, random);
}
