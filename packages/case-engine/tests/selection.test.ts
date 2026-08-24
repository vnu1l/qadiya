import { describe, expect, it } from 'vitest';
import { DEFAULT_CASUAL_RULES, DEFAULT_PRIVATE_RULES } from '@qadiya/shared';
import { dnaCanFitPlayerCount, selectCaseDNA, selectCaseMode, selectDefendantCount, type CaseDNA } from '../src';

function dna(id: string, overrides: Partial<CaseDNA> = {}): CaseDNA {
  return {
    id,
    family: 'innocence',
    mode: 'standard',
    complexity: 2,
    truthPattern: 'wrongly-accused',
    primaryEvidenceKind: 'digital',
    secondaryEvidenceKinds: ['testimony'],
    witnessPattern: 'mistaken-but-sincere',
    modifiers: ['alternative-suspect'],
    minDefendants: 1,
    maxDefendants: 1,
    variableRoleBudget: { min: 2, max: 6 },
    ...overrides,
  };
}

describe('case selection order', () => {
  it('supports a three-player private case by allowing variable roles to become system characters', () => {
    expect(dnaCanFitPlayerCount(dna('private-3'), 1, 3, DEFAULT_PRIVATE_RULES)).toBe(true);
  });

  it('does not pretend a three-player casual lobby is valid', () => {
    expect(selectCaseMode([dna('casual')], 3, DEFAULT_CASUAL_RULES, () => 0)).toBeNull();
  });

  it('selects mode, then defendant count, then DNA deterministically when given a deterministic random source', () => {
    const pool = [
      dna('single-standard'),
      dna('joint', {
        mode: 'joint-case',
        modifiers: ['multiple-defendants'],
        minDefendants: 2,
        maxDefendants: 2,
        variableRoleBudget: { min: 1, max: 6 },
      }),
    ];

    const mode = selectCaseMode(pool, 6, DEFAULT_CASUAL_RULES, () => 0);
    expect(mode).not.toBeNull();
    const count = selectDefendantCount(mode!, pool, 6, DEFAULT_CASUAL_RULES, () => 0);
    expect(count).not.toBeNull();
    const selected = selectCaseDNA(mode!, count!, pool, 6, DEFAULT_CASUAL_RULES, () => 0);
    expect(selected).not.toBeNull();
    expect(selected?.mode).toBe(mode);
    expect(count! >= selected!.minDefendants && count! <= selected!.maxDefendants).toBe(true);
  });

  it('filters long/high-complexity DNA out of small-case matchmaking', () => {
    const smallRules = { ...DEFAULT_PRIVATE_RULES, commitment: 'small' as const };
    const complex = dna('complex', { complexity: 5 });
    expect(selectCaseMode([complex], 3, smallRules, () => 0)).toBeNull();
  });

  it('rejects a DNA that cannot give every public player a meaningful seat', () => {
    const narrow = dna('narrow', { variableRoleBudget: { min: 1, max: 2 } });
    expect(dnaCanFitPlayerCount(narrow, 1, 10, DEFAULT_CASUAL_RULES)).toBe(false);
  });
});
