import { describe, expect, it } from 'vitest';
import {
  CURATED_CASE_DNAS,
  CURATED_CASE_TEMPLATES,
  type CaseTemplate,
  validateCaseTemplate,
  validateCaseTemplateCatalog,
} from '../src';

function templateCopy(): CaseTemplate {
  return structuredClone(CURATED_CASE_TEMPLATES[0]!);
}

describe('curated case template catalog', () => {
  it('ships with a fully self-consistent curated DNA/template pair', () => {
    expect(validateCaseTemplateCatalog(CURATED_CASE_DNAS, CURATED_CASE_TEMPLATES)).toEqual([]);
  });

  it('is pure structured input with no runtime functions or hidden randomness', () => {
    const serializedA = JSON.stringify(CURATED_CASE_TEMPLATES);
    const serializedB = JSON.stringify(structuredClone(CURATED_CASE_TEMPLATES));
    expect(serializedB).toBe(serializedA);
    expect(serializedA).not.toContain('Math.random');
  });

  it('rejects an empty deterministic choice pool before composition', () => {
    const template = templateCopy();
    template.characterSlots[0]!.publicNames.values = [];
    const issues = validateCaseTemplate(template, CURATED_CASE_DNAS[0]!);
    expect(issues.some((issue) => issue.code === 'TEMPLATE_EMPTY_CHOICE_POOL')).toBe(true);
  });

  it('rejects a knowledge item without perceived text', () => {
    const template = templateCopy();
    template.knowledge[0]!.perceivedDescription = ' ';
    const issues = validateCaseTemplate(template, CURATED_CASE_DNAS[0]!);
    expect(issues.some((issue) => issue.code === 'TEMPLATE_KNOWLEDGE_MISSING_PERCEPTION')).toBe(true);
  });

  it('rejects timeline references to facts that the template does not define', () => {
    const template = templateCopy();
    template.timeline[0]!.factIds = ['missing-fact'];
    const issues = validateCaseTemplate(template, CURATED_CASE_DNAS[0]!);
    expect(issues.some((issue) => issue.code === 'TEMPLATE_TIMELINE_UNKNOWN_FACT')).toBe(true);
  });

  it('rejects duplicate symbolic ids before they can collide during composition', () => {
    const template = templateCopy();
    template.facts[1]!.id = template.facts[0]!.id;
    const issues = validateCaseTemplate(template, CURATED_CASE_DNAS[0]!);
    expect(issues.some((issue) => issue.code === 'TEMPLATE_DUPLICATE_FACT')).toBe(true);
  });

  it('rejects a template defendant count outside its DNA bounds', () => {
    const template = templateCopy();
    template.supportedDefendantCounts = [2];
    const issues = validateCaseTemplate(template, CURATED_CASE_DNAS[0]!);
    expect(issues.some((issue) => issue.code === 'TEMPLATE_DEFENDANT_COUNT_OUTSIDE_DNA')).toBe(true);
  });

  it('rejects an orphan template that references an unknown DNA id', () => {
    const template = templateCopy();
    template.dnaId = 'missing-dna';
    const issues = validateCaseTemplateCatalog(CURATED_CASE_DNAS, [template]);
    expect(issues.some((issue) => issue.code === 'CATALOG_TEMPLATE_UNKNOWN_DNA')).toBe(true);
  });
});
