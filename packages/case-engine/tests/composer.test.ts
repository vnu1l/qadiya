import { describe, expect, it } from 'vitest';
import {
  CURATED_CASE_DNAS,
  CURATED_CASE_TEMPLATES,
  CaseCompositionError,
  chargeGroundTruthSatisfied,
  composeCaseTemplate,
  hasValidationErrors,
  validateCaseBlueprint,
} from '../src';

function expectCompositionError(action: () => unknown, code: CaseCompositionError['code']): void {
  try {
    action();
    throw new Error('Expected composition to fail.');
  } catch (error) {
    expect(error).toBeInstanceOf(CaseCompositionError);
    if (error instanceof CaseCompositionError) {
      expect(error.code).toBe(code);
    }
  }
}

describe('deterministic case composer', () => {
  it('produces exactly the same CaseBlueprint for the same seed', () => {
    const first = composeCaseTemplate(
      CURATED_CASE_DNAS[0]!,
      CURATED_CASE_TEMPLATES[0]!,
      { seed: 'same-seed' },
    );
    const second = composeCaseTemplate(
      CURATED_CASE_DNAS[0]!,
      CURATED_CASE_TEMPLATES[0]!,
      { seed: 'same-seed' },
    );

    expect(second.seedToken).toBe(first.seedToken);
    expect(second.blueprint).toEqual(first.blueprint);
  });

  it('uses different case ids for different seeds without changing the curated logical skeleton', () => {
    const first = composeCaseTemplate(
      CURATED_CASE_DNAS[0]!,
      CURATED_CASE_TEMPLATES[0]!,
      { seed: 'seed-a' },
    );
    const second = composeCaseTemplate(
      CURATED_CASE_DNAS[0]!,
      CURATED_CASE_TEMPLATES[0]!,
      { seed: 'seed-b' },
    );

    expect(second.blueprint.id).not.toBe(first.blueprint.id);
    expect(second.blueprint.mode).toBe(first.blueprint.mode);
    expect(second.blueprint.complexity).toBe(first.blueprint.complexity);
    expect(second.blueprint.facts.map((fact) => fact.predicate)).toEqual(
      first.blueprint.facts.map((fact) => fact.predicate),
    );
    expect(second.blueprint.charges[0]!.elements[0]!.truth).toBe(
      first.blueprint.charges[0]!.elements[0]!.truth,
    );
  });

  it('only returns a blueprint that passes structural validation', () => {
    const composed = composeCaseTemplate(
      CURATED_CASE_DNAS[0]!,
      CURATED_CASE_TEMPLATES[0]!,
      { seed: 'validated' },
    );

    const issues = validateCaseBlueprint(composed.blueprint);
    expect(hasValidationErrors(issues)).toBe(false);
    expect(composed.validationIssues).toEqual(issues);
  });

  it('preserves wrongful-accusation ground truth independently from evidence strength', () => {
    const composed = composeCaseTemplate(
      CURATED_CASE_DNAS[0]!,
      CURATED_CASE_TEMPLATES[0]!,
      { seed: 'truth-check' },
    );

    expect(chargeGroundTruthSatisfied(composed.blueprint.charges[0]!)).toBe(false);
    expect(composed.blueprint.evidence.length).toBeGreaterThan(0);
  });

  it('rejects an empty seed', () => {
    expectCompositionError(
      () =>
        composeCaseTemplate(
          CURATED_CASE_DNAS[0]!,
          CURATED_CASE_TEMPLATES[0]!,
          { seed: '   ' },
        ),
      'EMPTY_COMPOSITION_SEED',
    );
  });

  it('rejects an invalid template before producing a blueprint', () => {
    const invalid = structuredClone(CURATED_CASE_TEMPLATES[0]!);
    invalid.timeline[0]!.factIds = ['missing-fact'];

    expectCompositionError(
      () =>
        composeCaseTemplate(
          CURATED_CASE_DNAS[0]!,
          invalid,
          { seed: 'invalid-template' },
        ),
      'INVALID_CASE_TEMPLATE',
    );
  });
});
