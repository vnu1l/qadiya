import type { CaseDNA } from './dna.js';
import { composeCaseTemplate, type ComposedCase } from './composer.js';
import type { CaseTemplate } from './templates.js';
import { validateCaseTemplate } from './templates.js';

export type CaseCatalogCompositionErrorCode =
  | 'INVALID_CATALOG_DEFENDANT_COUNT'
  | 'EMPTY_CATALOG_SEED'
  | 'NO_COMPATIBLE_CASE_TEMPLATE';

export class CaseCatalogCompositionError extends Error {
  constructor(
    public readonly code: CaseCatalogCompositionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CaseCatalogCompositionError';
  }
}

function hash32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function compatibleCaseTemplates(
  dna: CaseDNA,
  defendantCount: number,
  templates: readonly CaseTemplate[],
): CaseTemplate[] {
  if (!Number.isInteger(defendantCount) || defendantCount < 1) return [];

  return templates
    .filter((template) => template.dnaId === dna.id)
    .filter((template) => template.supportedDefendantCounts.includes(defendantCount))
    .filter((template) => template.defendantCharacterSlotIds.length === defendantCount)
    .filter((template) => validateCaseTemplate(template, dna).length === 0)
    .sort((a, b) => a.id.localeCompare(b.id) || a.revision - b.revision);
}

export interface ComposeCaseFromCatalogOptions {
  seed: string;
  defendantCount: number;
}

export function composeCaseFromCatalog(
  dna: CaseDNA,
  templates: readonly CaseTemplate[],
  options: ComposeCaseFromCatalogOptions,
): ComposedCase {
  if (!Number.isInteger(options.defendantCount) || options.defendantCount < 1) {
    throw new CaseCatalogCompositionError(
      'INVALID_CATALOG_DEFENDANT_COUNT',
      'Catalog composition requires a positive integer defendant count.',
    );
  }

  const seed = options.seed.trim();
  if (!seed) {
    throw new CaseCatalogCompositionError(
      'EMPTY_CATALOG_SEED',
      'Catalog composition requires a non-empty seed.',
    );
  }

  const candidates = compatibleCaseTemplates(dna, options.defendantCount, templates);
  if (candidates.length === 0) {
    throw new CaseCatalogCompositionError(
      'NO_COMPATIBLE_CASE_TEMPLATE',
      `No validated template can compose DNA ${dna.id} for ${options.defendantCount} defendant(s).`,
    );
  }

  const selectionHash = hash32(
    `qadiya:catalog:${dna.id}:${options.defendantCount}:${seed}`,
  );
  const template = candidates[selectionHash % candidates.length]!;

  return composeCaseTemplate(dna, template, { seed });
}
