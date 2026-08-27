import { describe, expect, it } from 'vitest';
import {
  CURATED_CASE_DNAS,
  CURATED_CASE_TEMPLATES,
  CaseCatalogCompositionError,
  compatibleCaseTemplates,
  composeCaseFromCatalog,
  type CaseTemplate,
} from '../src';

function expectCatalogError(action: () => unknown, code: CaseCatalogCompositionError['code']): void {
  try {
    action();
    throw new Error('Expected catalog composition to fail.');
  } catch (error) {
    expect(error).toBeInstanceOf(CaseCatalogCompositionError);
    if (error instanceof CaseCatalogCompositionError) {
      expect(error.code).toBe(code);
    }
  }
}

describe('catalog composition facade', () => {
  it('finds the curated template compatible with the selected DNA and defendant count', () => {
    const candidates = compatibleCaseTemplates(
      CURATED_CASE_DNAS[0]!,
      1,
      CURATED_CASE_TEMPLATES,
    );

    expect(candidates.map((template) => template.id)).toEqual([
      'warehouse-access-misdirection:v1',
    ]);
  });

  it('composes exactly the same selected template and blueprint for the same seed', () => {
    const first = composeCaseFromCatalog(
      CURATED_CASE_DNAS[0]!,
      CURATED_CASE_TEMPLATES,
      { seed: 'catalog-seed', defendantCount: 1 },
    );
    const second = composeCaseFromCatalog(
      CURATED_CASE_DNAS[0]!,
      CURATED_CASE_TEMPLATES,
      { seed: 'catalog-seed', defendantCount: 1 },
    );

    expect(second.templateId).toBe(first.templateId);
    expect(second.blueprint).toEqual(first.blueprint);
  });

  it('is stable even if the caller provides candidate templates in a different order', () => {
    const a = structuredClone(CURATED_CASE_TEMPLATES[0]!) as CaseTemplate;
    const b = structuredClone(CURATED_CASE_TEMPLATES[0]!) as CaseTemplate;
    a.id = 'warehouse-access-misdirection:a';
    b.id = 'warehouse-access-misdirection:b';

    const first = composeCaseFromCatalog(
      CURATED_CASE_DNAS[0]!,
      [a, b],
      { seed: 'order-independent', defendantCount: 1 },
    );
    const second = composeCaseFromCatalog(
      CURATED_CASE_DNAS[0]!,
      [b, a],
      { seed: 'order-independent', defendantCount: 1 },
    );

    expect(second.templateId).toBe(first.templateId);
    expect(second.blueprint).toEqual(first.blueprint);
  });

  it('filters invalid templates instead of composing them', () => {
    const invalid = structuredClone(CURATED_CASE_TEMPLATES[0]!) as CaseTemplate;
    invalid.timeline[0]!.factIds = ['missing-fact'];

    expect(
      compatibleCaseTemplates(CURATED_CASE_DNAS[0]!, 1, [invalid]),
    ).toEqual([]);

    expectCatalogError(
      () =>
        composeCaseFromCatalog(
          CURATED_CASE_DNAS[0]!,
          [invalid],
          { seed: 'invalid-filter', defendantCount: 1 },
        ),
      'NO_COMPATIBLE_CASE_TEMPLATE',
    );
  });

  it('rejects a defendant count with no compatible curated skeleton', () => {
    expectCatalogError(
      () =>
        composeCaseFromCatalog(
          CURATED_CASE_DNAS[0]!,
          CURATED_CASE_TEMPLATES,
          { seed: 'unsupported-count', defendantCount: 2 },
        ),
      'NO_COMPATIBLE_CASE_TEMPLATE',
    );
  });

  it('rejects invalid defendant count and empty seed before selection', () => {
    expectCatalogError(
      () =>
        composeCaseFromCatalog(
          CURATED_CASE_DNAS[0]!,
          CURATED_CASE_TEMPLATES,
          { seed: 'x', defendantCount: 0 },
        ),
      'INVALID_CATALOG_DEFENDANT_COUNT',
    );

    expectCatalogError(
      () =>
        composeCaseFromCatalog(
          CURATED_CASE_DNAS[0]!,
          CURATED_CASE_TEMPLATES,
          { seed: '   ', defendantCount: 1 },
        ),
      'EMPTY_CATALOG_SEED',
    );
  });
});
