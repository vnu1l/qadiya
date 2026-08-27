import type { CaseDNA } from './dna.js';
import type { CaseBlueprint, CaseCharacter, CaseFact, LocationDefinition } from './model.js';
import type { CaseTemplate, TemplateChoicePool } from './templates.js';
import { validateCaseTemplate } from './templates.js';
import { hasValidationErrors, validateCaseBlueprint, type ValidationIssue } from './validation.js';

export type CaseCompositionErrorCode =
  | 'EMPTY_COMPOSITION_SEED'
  | 'INVALID_CASE_TEMPLATE'
  | 'COMPOSED_BLUEPRINT_INVALID';

export class CaseCompositionError extends Error {
  constructor(
    public readonly code: CaseCompositionErrorCode,
    message: string,
    public readonly issues: readonly { code: string; message: string; entityId?: string }[] = [],
  ) {
    super(message);
    this.name = 'CaseCompositionError';
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

function seedToken(value: string): string {
  const a = hash32(`qadiya:a:${value}`).toString(16).padStart(8, '0');
  const b = hash32(`qadiya:b:${value}`).toString(16).padStart(8, '0');
  return `${a}${b}`;
}

class DeterministicRandom {
  private state: number;

  constructor(seed: string) {
    this.state = hash32(seed) || 0x6d2b79f5;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  integer(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(pool: TemplateChoicePool<T>): T {
    if (pool.values.length === 0) {
      throw new CaseCompositionError('INVALID_CASE_TEMPLATE', 'Cannot compose from an empty choice pool.');
    }
    const index = Math.min(pool.values.length - 1, Math.floor(this.next() * pool.values.length));
    return pool.values[index]!;
  }
}

function mapRef(
  ref: string | undefined,
  characterIds: ReadonlyMap<string, string>,
  locationIds: ReadonlyMap<string, string>,
): string | undefined {
  if (!ref) return undefined;
  return characterIds.get(ref) ?? locationIds.get(ref) ?? ref;
}

function mapRequired(
  map: ReadonlyMap<string, string>,
  id: string,
  context: string,
): string {
  const mapped = map.get(id);
  if (!mapped) {
    throw new CaseCompositionError(
      'INVALID_CASE_TEMPLATE',
      `Template reference ${id} could not be resolved while composing ${context}.`,
    );
  }
  return mapped;
}

export interface ComposeCaseOptions {
  seed: string;
}

export interface ComposedCase {
  templateId: string;
  dnaId: string;
  seedToken: string;
  blueprint: CaseBlueprint;
  validationIssues: readonly ValidationIssue[];
}

export function composeCaseTemplate(
  dna: CaseDNA,
  template: CaseTemplate,
  options: ComposeCaseOptions,
): ComposedCase {
  const normalizedSeed = options.seed.trim();
  if (!normalizedSeed) {
    throw new CaseCompositionError('EMPTY_COMPOSITION_SEED', 'Case composition requires a non-empty seed.');
  }

  const templateIssues = validateCaseTemplate(template, dna);
  if (templateIssues.length > 0) {
    throw new CaseCompositionError(
      'INVALID_CASE_TEMPLATE',
      `Template ${template.id} failed pre-composition validation.`,
      templateIssues,
    );
  }

  if (!template.supportedDefendantCounts.includes(template.defendantCharacterSlotIds.length)) {
    throw new CaseCompositionError(
      'INVALID_CASE_TEMPLATE',
      `Template ${template.id} does not declare support for its own defendant slot count.`,
      [
        {
          code: 'TEMPLATE_DEFENDANT_SLOT_COUNT_UNSUPPORTED',
          message: 'The concrete defendant slot count must be listed in supportedDefendantCounts.',
          entityId: template.id,
        },
      ],
    );
  }

  const token = seedToken(`${template.id}@${template.revision}:${normalizedSeed}`);
  const caseId = `case:${template.id}:${token}`;
  const random = new DeterministicRandom(`${caseId}:${dna.id}`);

  const characterIds = new Map<string, string>();
  const characters: CaseCharacter[] = template.characterSlots.map((slot) => {
    const id = `${caseId}:character:${slot.id}`;
    characterIds.set(slot.id, id);
    return {
      id,
      publicName: random.pick(slot.publicNames),
      age: random.integer(slot.age.min, slot.age.max),
      gender: random.pick(slot.genders),
      occupation: random.pick(slot.occupations),
      memoryProfile: random.pick(slot.memoryProfiles),
    };
  });

  const locationIds = new Map<string, string>();
  const locations: LocationDefinition[] = template.locations.map((location) => {
    const id = `${caseId}:location:${location.id}`;
    locationIds.set(location.id, id);
    return { id, label: location.label };
  });

  const factIds = new Map<string, string>();
  const facts: CaseFact[] = template.facts.map((fact) => {
    const id = `${caseId}:fact:${fact.id}`;
    factIds.set(fact.id, id);
    return {
      id,
      description: fact.description,
      subjectId: fact.subjectCharacterSlotId
        ? mapRequired(characterIds, fact.subjectCharacterSlotId, `fact ${fact.id}`)
        : undefined,
      predicate: fact.predicate,
      objectId: mapRef(fact.objectRefId, characterIds, locationIds),
      tags: fact.tags ? [...fact.tags] : undefined,
    };
  });

  const timelineIds = new Map<string, string>();
  const timeline = template.timeline.map((event) => {
    const id = `${caseId}:event:${event.id}`;
    timelineIds.set(event.id, id);
    return {
      id,
      startMinute: event.startMinute,
      endMinute: event.endMinute,
      locationId: mapRequired(locationIds, event.locationId, `timeline event ${event.id}`),
      actorIds: event.actorCharacterSlotIds.map((actorId) =>
        mapRequired(characterIds, actorId, `timeline event ${event.id}`),
      ),
      factIds: event.factIds.map((factId) =>
        mapRequired(factIds, factId, `timeline event ${event.id}`),
      ),
    };
  });

  const blueprint: CaseBlueprint = {
    id: caseId,
    mode: dna.mode,
    complexity: dna.complexity,
    characters,
    defendantIds: template.defendantCharacterSlotIds.map((slotId) =>
      mapRequired(characterIds, slotId, 'defendant ids'),
    ),
    facts,
    locations,
    travelLinks: template.travelLinks.map((link) => ({
      id: `${caseId}:travel:${link.id}`,
      fromLocationId: mapRequired(locationIds, link.fromLocationId, `travel link ${link.id}`),
      toLocationId: mapRequired(locationIds, link.toLocationId, `travel link ${link.id}`),
      minTravelMinutes: link.minTravelMinutes,
      bidirectional: link.bidirectional,
    })),
    timeline,
    knowledge: template.knowledge.map((item) => ({
      id: `${caseId}:knowledge:${item.id}`,
      holderCharacterId: mapRequired(characterIds, item.holderCharacterSlotId, `knowledge ${item.id}`),
      factId: mapRequired(factIds, item.factId, `knowledge ${item.id}`),
      perceivedDescription: item.perceivedDescription,
      source: {
        kind: item.source.kind,
        sourceEntityId: item.source.sourceCharacterSlotId
          ? mapRequired(characterIds, item.source.sourceCharacterSlotId, `knowledge ${item.id}`)
          : undefined,
        sourceTimelineEventId: item.source.sourceTimelineEventId
          ? mapRequired(timelineIds, item.source.sourceTimelineEventId, `knowledge ${item.id}`)
          : undefined,
        note: item.source.note,
        precisionLimit: item.source.precisionLimit,
      },
      accuracy: item.accuracy,
      confidence: item.confidence,
      precision: item.precision,
      belief: item.belief,
    })),
    evidence: template.evidence.map((evidence) => ({
      id: `${caseId}:evidence:${evidence.id}`,
      title: evidence.title,
      factIds: evidence.factIds.map((factId) =>
        mapRequired(factIds, factId, `evidence ${evidence.id}`),
      ),
      provenance: {
        kind: evidence.provenance.kind,
        sourceEntityId: evidence.provenance.sourceCharacterSlotId
          ? mapRequired(characterIds, evidence.provenance.sourceCharacterSlotId, `evidence ${evidence.id}`)
          : undefined,
        sourceTimelineEventId: evidence.provenance.sourceTimelineEventId
          ? mapRequired(timelineIds, evidence.provenance.sourceTimelineEventId, `evidence ${evidence.id}`)
          : undefined,
        description: evidence.provenance.description,
      },
      reliability: evidence.reliability,
      ambiguity: evidence.ambiguity,
      discoverableByRoleIds: [...evidence.discoverableByRoleIds],
    })),
    roles: template.roles.map((role) => ({
      id: `${caseId}:role:${role.id}`,
      roleKind: role.roleKind,
      characterId: mapRequired(characterIds, role.characterSlotId, `role ${role.id}`),
      required: role.required,
      replaceable: role.replaceable,
      canBecomeSystemCharacter: role.canBecomeSystemCharacter,
      canBecomeDocument: role.canBecomeDocument,
      critical: role.critical,
      engagement: { ...role.engagement },
    })),
    charges: template.charges.map((charge) => ({
      id: `${caseId}:charge:${charge.id}`,
      title: charge.title,
      defendantIds: charge.defendantCharacterSlotIds.map((slotId) =>
        mapRequired(characterIds, slotId, `charge ${charge.id}`),
      ),
      burden: charge.burden,
      elements: charge.elements.map((element) => ({
        id: `${caseId}:charge-element:${element.id}`,
        title: element.title,
        truth: element.truth,
        basisFactIds: element.basisFactIds.map((factId) =>
          mapRequired(factIds, factId, `charge element ${element.id}`),
        ),
      })),
    })),
  };

  const validationIssues = validateCaseBlueprint(blueprint);
  if (hasValidationErrors(validationIssues)) {
    throw new CaseCompositionError(
      'COMPOSED_BLUEPRINT_INVALID',
      `Composed blueprint ${blueprint.id} failed structural validation.`,
      validationIssues,
    );
  }

  return {
    templateId: template.id,
    dnaId: dna.id,
    seedToken: token,
    blueprint,
    validationIssues,
  };
}
