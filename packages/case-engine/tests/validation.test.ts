import { describe, expect, it } from 'vitest';
import { hasValidationErrors, type CaseBlueprint, validateCaseBlueprint } from '../src';

function validCase(): CaseBlueprint {
  return {
    id: 'case-1',
    mode: 'standard',
    complexity: 2,
    characters: [
      { id: 'def-1', publicName: 'سالم', age: 33, gender: 'male', occupation: 'موظف', memoryProfile: 'normal' },
      { id: 'wit-1', publicName: 'مريم', age: 29, gender: 'female', occupation: 'شاهدة', memoryProfile: 'uncertain' },
    ],
    defendantIds: ['def-1'],
    facts: [
      { id: 'fact-presence', description: 'سالم كان قرب المستودع.', subjectId: 'def-1', predicate: 'was-near', objectId: 'warehouse' },
      { id: 'fact-street', description: 'سالم وصل إلى الشارع لاحقًا.', subjectId: 'def-1', predicate: 'was-at', objectId: 'street' },
    ],
    locations: [
      { id: 'warehouse', label: 'المستودع' },
      { id: 'street', label: 'الشارع الرئيسي' },
    ],
    travelLinks: [
      { id: 'warehouse-street', fromLocationId: 'warehouse', toLocationId: 'street', minTravelMinutes: 5, bidirectional: true },
    ],
    timeline: [
      { id: 'event-1', startMinute: 540, endMinute: 545, locationId: 'warehouse', actorIds: ['def-1'], factIds: ['fact-presence'] },
      { id: 'event-2', startMinute: 551, locationId: 'street', actorIds: ['def-1'], factIds: ['fact-street'] },
    ],
    knowledge: [
      {
        id: 'knowledge-1',
        holderCharacterId: 'wit-1',
        factId: 'fact-presence',
        source: { kind: 'direct-observation', sourceTimelineEventId: 'event-1', precisionLimit: 'approximate' },
        accuracy: 0.8,
        confidence: 0.95,
        precision: 'approximate',
        belief: 'believes-true',
      },
    ],
    evidence: [
      {
        id: 'evidence-1',
        title: 'سجل بوابة',
        factIds: ['fact-presence'],
        provenance: { kind: 'digital', sourceTimelineEventId: 'event-1', description: 'سجل إلكتروني من بوابة المستودع.' },
        reliability: 0.92,
        ambiguity: 0.5,
        discoverableByRoleIds: ['prosecution', 'defense'],
      },
    ],
    roles: [
      {
        id: 'role-witness',
        roleKind: 'witness',
        characterId: 'wit-1',
        required: true,
        replaceable: false,
        canBecomeSystemCharacter: true,
        canBecomeDocument: false,
        critical: false,
        engagement: {
          exclusiveInformation: 0.8,
          meaningfulDecisions: 0.4,
          concealmentPressure: 0.3,
          influencePotential: 0.7,
          personalRisk: 0.2,
        },
      },
    ],
    charges: [
      { id: 'charge-1', title: 'دخول غير مشروع', defendantIds: ['def-1'], elementFactIds: ['fact-presence'] },
    ],
  };
}

describe('validateCaseBlueprint', () => {
  it('accepts a structurally and temporally coherent case', () => {
    expect(hasValidationErrors(validateCaseBlueprint(validCase()))).toBe(false);
  });

  it('rejects evidence that points to a fact that does not exist', () => {
    const blueprint = validCase();
    blueprint.evidence[0]!.factIds = ['missing-fact'];
    expect(validateCaseBlueprint(blueprint).some((issue) => issue.code === 'EVIDENCE_UNKNOWN_FACT')).toBe(true);
  });

  it('rejects knowledge with hearsay but no identified source person', () => {
    const blueprint = validCase();
    blueprint.knowledge[0]!.source = { kind: 'heard-from-person', precisionLimit: 'approximate' };
    expect(validateCaseBlueprint(blueprint).some((issue) => issue.code === 'KNOWLEDGE_MISSING_SOURCE_PERSON')).toBe(true);
  });

  it('rejects a timeline event that ends before it starts', () => {
    const blueprint = validCase();
    blueprint.timeline[0]!.endMinute = 500;
    expect(validateCaseBlueprint(blueprint).some((issue) => issue.code === 'INVALID_TIME_RANGE')).toBe(true);
  });

  it('rejects impossible travel between locations', () => {
    const blueprint = validCase();
    blueprint.timeline[1]!.startMinute = 547;
    expect(validateCaseBlueprint(blueprint).some((issue) => issue.code === 'ACTOR_TRAVEL_IMPOSSIBLE')).toBe(true);
  });

  it('rejects overlapping presence in two different locations', () => {
    const blueprint = validCase();
    blueprint.timeline[1]!.startMinute = 544;
    expect(validateCaseBlueprint(blueprint).some((issue) => issue.code === 'ACTOR_OVERLAPPING_LOCATIONS')).toBe(true);
  });

  it('rejects exact knowledge when the source only supports approximate precision', () => {
    const blueprint = validCase();
    blueprint.knowledge[0]!.precision = 'exact';
    expect(validateCaseBlueprint(blueprint).some((issue) => issue.code === 'KNOWLEDGE_EXCEEDS_SOURCE_PRECISION')).toBe(true);
  });
});
