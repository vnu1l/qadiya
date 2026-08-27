import { describe, expect, it } from 'vitest';
import {
  CURATED_CASE_DNAS,
  CURATED_CASE_TEMPLATES,
  CaseBriefError,
  composeCaseFromCatalog,
  derivePrivateRoleBrief,
} from '../src';

function blueprint() {
  return composeCaseFromCatalog(
    CURATED_CASE_DNAS[0]!,
    CURATED_CASE_TEMPLATES,
    { seed: 'brief-tests', defendantCount: 1 },
  ).blueprint;
}

function expectBriefError(action: () => unknown, code: CaseBriefError['code']): void {
  try {
    action();
    throw new Error('Expected brief derivation to fail.');
  } catch (error) {
    expect(error).toBeInstanceOf(CaseBriefError);
    if (error instanceof CaseBriefError) {
      expect(error.code).toBe(code);
    }
  }
}

describe('private role brief derivation', () => {
  it('gives the judge procedural charges only, without evidence, memory, or ground truth fields', () => {
    const caseFile = blueprint();
    const brief = derivePrivateRoleBrief(caseFile, { role: 'judge' });
    const serialized = JSON.stringify(brief);

    expect(brief.evidence).toEqual([]);
    expect(brief.memory).toEqual([]);
    expect(serialized).not.toContain('"truth"');
    expect(serialized).not.toContain('basisFactIds');
    expect(serialized).not.toContain('not-satisfied');
  });

  it('gives prosecution only discoverable evidence stripped of hidden fact/reliability metadata', () => {
    const caseFile = blueprint();
    const brief = derivePrivateRoleBrief(caseFile, { role: 'prosecution' });
    const serialized = JSON.stringify(brief);

    expect(brief.evidence.length).toBeGreaterThan(0);
    expect(serialized).not.toContain('factIds');
    expect(serialized).not.toContain('reliability');
    expect(serialized).not.toContain('ambiguity');
    expect(serialized).not.toContain('basisFactIds');
    expect(serialized).not.toContain('"truth"');
  });

  it('does not automatically give defense counsel the defendant memory', () => {
    const caseFile = blueprint();
    const defendantId = caseFile.defendantIds[0]!;
    const brief = derivePrivateRoleBrief(caseFile, {
      role: 'defense',
      representedDefendantIds: [defendantId],
    });

    expect(brief.representedDefendantIds).toEqual([defendantId]);
    expect(brief.memory).toEqual([]);
    expect(brief.evidence.length).toBeGreaterThan(0);
  });

  it('gives a defendant only their own perceived memory, not another character knowledge', () => {
    const caseFile = blueprint();
    const defendantId = caseFile.defendantIds[0]!;
    const ownKnowledge = caseFile.knowledge.filter((item) => item.holderCharacterId === defendantId);
    const otherKnowledge = caseFile.knowledge.filter((item) => item.holderCharacterId !== defendantId);
    const brief = derivePrivateRoleBrief(caseFile, {
      role: 'defendant',
      characterId: defendantId,
    });
    const memoryText = brief.memory.map((item) => item.perceivedDescription).join(' ');

    expect(brief.memory.map((item) => item.knowledgeId)).toEqual(ownKnowledge.map((item) => item.id));
    for (const item of otherKnowledge) {
      expect(memoryText).not.toContain(item.perceivedDescription);
    }
  });

  it('gives a witness only the witness perception, never the objective fact description', () => {
    const caseFile = blueprint();
    const witnessRole = caseFile.roles.find((role) => role.roleKind === 'witness')!;
    const witnessKnowledge = caseFile.knowledge.filter(
      (item) => item.holderCharacterId === witnessRole.characterId,
    );
    const brief = derivePrivateRoleBrief(caseFile, {
      role: 'witness',
      characterId: witnessRole.characterId,
    });

    expect(brief.memory.map((item) => item.knowledgeId)).toEqual(witnessKnowledge.map((item) => item.id));

    for (const item of witnessKnowledge) {
      const fact = caseFile.facts.find((candidate) => candidate.id === item.factId)!;
      expect(brief.memory.some((memory) => memory.perceivedDescription === fact.description)).toBe(false);
    }
  });

  it('rejects a variable role request for the wrong character', () => {
    const caseFile = blueprint();
    const defendantId = caseFile.defendantIds[0]!;

    expectBriefError(
      () =>
        derivePrivateRoleBrief(caseFile, {
          role: 'witness',
          characterId: defendantId,
        }),
      'BRIEF_ROLE_CHARACTER_MISMATCH',
    );
  });

  it('rejects defense briefs without a client or with a non-defendant client id', () => {
    const caseFile = blueprint();

    expectBriefError(
      () => derivePrivateRoleBrief(caseFile, { role: 'defense', representedDefendantIds: [] }),
      'BRIEF_DEFENSE_HAS_NO_CLIENT',
    );

    expectBriefError(
      () =>
        derivePrivateRoleBrief(caseFile, {
          role: 'defense',
          representedDefendantIds: ['missing-defendant'],
        }),
      'BRIEF_UNKNOWN_REPRESENTED_DEFENDANT',
    );
  });
});
