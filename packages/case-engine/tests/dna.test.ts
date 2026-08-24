import { describe, expect, it } from 'vitest';
import { type CaseDNA, validateCaseDNA } from '../src';

function dna(overrides: Partial<CaseDNA> = {}): CaseDNA {
  return {
    id: 'dna-1',
    family: 'innocence',
    mode: 'single-defendant',
    complexity: 2,
    truthPattern: 'wrongly-accused',
    primaryEvidenceKind: 'digital',
    secondaryEvidenceKinds: ['testimony'],
    witnessPattern: 'mistaken-but-sincere',
    modifiers: ['alternative-suspect'],
    minDefendants: 1,
    maxDefendants: 1,
    variableRoleBudget: { min: 1, max: 4 },
    ...overrides,
  };
}

describe('validateCaseDNA', () => {
  it('accepts a coherent single-defendant DNA', () => {
    expect(validateCaseDNA(dna())).toEqual([]);
  });

  it('rejects a single-defendant mode that allows multiple defendants', () => {
    const issues = validateCaseDNA(
      dna({ minDefendants: 1, maxDefendants: 2, modifiers: ['multiple-defendants'] }),
    );
    expect(issues.some((issue) => issue.code === 'DNA_SINGLE_MODE_MULTIPLE_DEFENDANTS')).toBe(true);
  });

  it('requires cross-defendant contradictions to actually allow multiple defendants', () => {
    const issues = validateCaseDNA(dna({ modifiers: ['cross-defendant-contradictions'] }));
    expect(issues.some((issue) => issue.code === 'DNA_CROSS_DEFENDANT_WITH_SINGLE_DEFENDANT')).toBe(true);
  });
});
