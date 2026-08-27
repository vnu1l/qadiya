import type { CaseDNA } from './dna.js';
import type {
  BeliefState,
  BurdenStandard,
  CaseRoleKind,
  ChargeElementTruth,
  EvidenceKind,
  KnowledgePrecision,
  KnowledgeSourceKind,
} from './model.js';

export type TemplateMemoryProfile = 'strong' | 'normal' | 'uncertain';

export interface TemplateChoicePool<T> {
  values: readonly T[];
}

export interface TemplateAgeRange {
  min: number;
  max: number;
}

export interface TemplateCharacterSlot {
  id: string;
  publicNames: TemplateChoicePool<string>;
  genders: TemplateChoicePool<'male' | 'female'>;
  age: TemplateAgeRange;
  occupations: TemplateChoicePool<string>;
  memoryProfiles: TemplateChoicePool<TemplateMemoryProfile>;
}

export interface TemplateLocation {
  id: string;
  label: string;
}

export interface TemplateTravelLink {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  minTravelMinutes: number;
  bidirectional: boolean;
}

export interface TemplateFact {
  id: string;
  description: string;
  subjectCharacterSlotId?: string;
  predicate: string;
  objectRefId?: string;
  tags?: readonly string[];
}

export interface TemplateTimelineEvent {
  id: string;
  startMinute: number;
  endMinute?: number;
  locationId: string;
  actorCharacterSlotIds: readonly string[];
  factIds: readonly string[];
}

export interface TemplateKnowledgeSource {
  kind: KnowledgeSourceKind;
  sourceCharacterSlotId?: string;
  sourceTimelineEventId?: string;
  note?: string;
  precisionLimit: KnowledgePrecision;
}

export interface TemplateKnowledgeItem {
  id: string;
  holderCharacterSlotId: string;
  factId: string;
  perceivedDescription: string;
  source: TemplateKnowledgeSource;
  accuracy: number;
  confidence: number;
  precision: KnowledgePrecision;
  belief: BeliefState;
}

export interface TemplateEvidence {
  id: string;
  title: string;
  factIds: readonly string[];
  provenance: {
    kind: EvidenceKind;
    sourceCharacterSlotId?: string;
    sourceTimelineEventId?: string;
    description: string;
  };
  reliability: number;
  ambiguity: number;
  discoverableByRoleIds: readonly string[];
}

export interface TemplateRole {
  id: string;
  roleKind: CaseRoleKind;
  characterSlotId: string;
  required: boolean;
  replaceable: boolean;
  canBecomeSystemCharacter: boolean;
  canBecomeDocument: boolean;
  critical: boolean;
  engagement: {
    exclusiveInformation: number;
    meaningfulDecisions: number;
    concealmentPressure: number;
    influencePotential: number;
    personalRisk: number;
  };
}

export interface TemplateChargeElement {
  id: string;
  title: string;
  truth: ChargeElementTruth;
  basisFactIds: readonly string[];
}

export interface TemplateCharge {
  id: string;
  title: string;
  defendantCharacterSlotIds: readonly string[];
  burden: BurdenStandard;
  elements: readonly TemplateChargeElement[];
}

export interface CaseTemplate {
  id: string;
  revision: number;
  dnaId: string;
  supportedDefendantCounts: readonly number[];
  characterSlots: readonly TemplateCharacterSlot[];
  defendantCharacterSlotIds: readonly string[];
  locations: readonly TemplateLocation[];
  travelLinks: readonly TemplateTravelLink[];
  facts: readonly TemplateFact[];
  timeline: readonly TemplateTimelineEvent[];
  knowledge: readonly TemplateKnowledgeItem[];
  evidence: readonly TemplateEvidence[];
  roles: readonly TemplateRole[];
  charges: readonly TemplateCharge[];
}

export interface CaseTemplateIssue {
  code: string;
  message: string;
  entityId?: string;
}

function duplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function inUnitInterval(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function validateChoicePool<T>(
  pool: TemplateChoicePool<T>,
  label: string,
  entityId: string,
  issues: CaseTemplateIssue[],
): void {
  if (pool.values.length === 0) {
    issues.push({
      code: 'TEMPLATE_EMPTY_CHOICE_POOL',
      message: `${label} choice pool on ${entityId} cannot be empty.`,
      entityId,
    });
  }
}

function validateUniqueIds(
  kind: string,
  ids: readonly string[],
  code: string,
  issues: CaseTemplateIssue[],
): void {
  for (const duplicate of duplicateValues(ids)) {
    issues.push({
      code,
      message: `${kind} id ${duplicate} is duplicated in the template.`,
      entityId: duplicate,
    });
  }
}

export function validateCaseTemplate(template: CaseTemplate, dna: CaseDNA): CaseTemplateIssue[] {
  const issues: CaseTemplateIssue[] = [];

  if (template.dnaId !== dna.id) {
    issues.push({
      code: 'TEMPLATE_DNA_MISMATCH',
      message: `Template ${template.id} references DNA ${template.dnaId}, expected ${dna.id}.`,
      entityId: template.id,
    });
  }

  if (!Number.isInteger(template.revision) || template.revision < 1) {
    issues.push({
      code: 'TEMPLATE_INVALID_REVISION',
      message: `Template ${template.id} revision must be a positive integer.`,
      entityId: template.id,
    });
  }

  if (template.supportedDefendantCounts.length === 0) {
    issues.push({
      code: 'TEMPLATE_NO_DEFENDANT_COUNTS',
      message: `Template ${template.id} must support at least one defendant count.`,
      entityId: template.id,
    });
  }

  for (const count of template.supportedDefendantCounts) {
    if (!Number.isInteger(count) || count < dna.minDefendants || count > dna.maxDefendants) {
      issues.push({
        code: 'TEMPLATE_DEFENDANT_COUNT_OUTSIDE_DNA',
        message: `Template ${template.id} supports defendant count ${count} outside DNA bounds.`,
        entityId: template.id,
      });
    }
  }

  validateUniqueIds(
    'character slot',
    template.characterSlots.map((slot) => slot.id),
    'TEMPLATE_DUPLICATE_CHARACTER_SLOT',
    issues,
  );
  validateUniqueIds('location', template.locations.map((item) => item.id), 'TEMPLATE_DUPLICATE_LOCATION', issues);
  validateUniqueIds('travel link', template.travelLinks.map((item) => item.id), 'TEMPLATE_DUPLICATE_TRAVEL_LINK', issues);
  validateUniqueIds('fact', template.facts.map((item) => item.id), 'TEMPLATE_DUPLICATE_FACT', issues);
  validateUniqueIds('timeline event', template.timeline.map((item) => item.id), 'TEMPLATE_DUPLICATE_TIMELINE_EVENT', issues);
  validateUniqueIds('knowledge', template.knowledge.map((item) => item.id), 'TEMPLATE_DUPLICATE_KNOWLEDGE', issues);
  validateUniqueIds('evidence', template.evidence.map((item) => item.id), 'TEMPLATE_DUPLICATE_EVIDENCE', issues);
  validateUniqueIds('role', template.roles.map((item) => item.id), 'TEMPLATE_DUPLICATE_ROLE', issues);
  validateUniqueIds('charge', template.charges.map((item) => item.id), 'TEMPLATE_DUPLICATE_CHARGE', issues);
  validateUniqueIds(
    'charge element',
    template.charges.flatMap((charge) => charge.elements.map((element) => element.id)),
    'TEMPLATE_DUPLICATE_CHARGE_ELEMENT',
    issues,
  );

  const slotSet = new Set(template.characterSlots.map((slot) => slot.id));
  for (const slot of template.characterSlots) {
    validateChoicePool(slot.publicNames, 'publicNames', slot.id, issues);
    validateChoicePool(slot.genders, 'genders', slot.id, issues);
    validateChoicePool(slot.occupations, 'occupations', slot.id, issues);
    validateChoicePool(slot.memoryProfiles, 'memoryProfiles', slot.id, issues);

    if (!Number.isInteger(slot.age.min) || !Number.isInteger(slot.age.max) || slot.age.min < 18 || slot.age.max < slot.age.min) {
      issues.push({
        code: 'TEMPLATE_INVALID_AGE_RANGE',
        message: `Character slot ${slot.id} has an invalid adult age range.`,
        entityId: slot.id,
      });
    }
  }

  if (template.defendantCharacterSlotIds.length === 0) {
    issues.push({
      code: 'TEMPLATE_NO_DEFENDANT_SLOTS',
      message: `Template ${template.id} must identify at least one defendant slot.`,
      entityId: template.id,
    });
  }

  if (new Set(template.defendantCharacterSlotIds).size !== template.defendantCharacterSlotIds.length) {
    issues.push({
      code: 'TEMPLATE_DUPLICATE_DEFENDANT_SLOT',
      message: `Template ${template.id} repeats a defendant slot.`,
      entityId: template.id,
    });
  }

  for (const slotId of template.defendantCharacterSlotIds) {
    if (!slotSet.has(slotId)) {
      issues.push({
        code: 'TEMPLATE_UNKNOWN_DEFENDANT_SLOT',
        message: `Template ${template.id} references unknown defendant slot ${slotId}.`,
        entityId: slotId,
      });
    }
  }

  if (!template.supportedDefendantCounts.includes(template.defendantCharacterSlotIds.length)) {
    issues.push({
      code: 'TEMPLATE_DEFENDANT_SLOT_COUNT_UNSUPPORTED',
      message: `Template ${template.id} does not support its concrete defendant slot count.`,
      entityId: template.id,
    });
  }

  const locationIds = new Set(template.locations.map((location) => location.id));
  const factIds = new Set(template.facts.map((fact) => fact.id));
  const timelineIds = new Set(template.timeline.map((event) => event.id));

  for (const link of template.travelLinks) {
    if (!locationIds.has(link.fromLocationId) || !locationIds.has(link.toLocationId)) {
      issues.push({
        code: 'TEMPLATE_TRAVEL_UNKNOWN_LOCATION',
        message: `Travel link ${link.id} references an unknown location.`,
        entityId: link.id,
      });
    }
    if (!Number.isFinite(link.minTravelMinutes) || link.minTravelMinutes < 0) {
      issues.push({
        code: 'TEMPLATE_INVALID_TRAVEL_TIME',
        message: `Travel link ${link.id} must have a non-negative finite travel time.`,
        entityId: link.id,
      });
    }
  }

  for (const fact of template.facts) {
    if (fact.subjectCharacterSlotId && !slotSet.has(fact.subjectCharacterSlotId)) {
      issues.push({
        code: 'TEMPLATE_FACT_UNKNOWN_SUBJECT',
        message: `Fact ${fact.id} references unknown character slot ${fact.subjectCharacterSlotId}.`,
        entityId: fact.id,
      });
    }
  }

  for (const event of template.timeline) {
    if (!Number.isFinite(event.startMinute) || (event.endMinute !== undefined && (!Number.isFinite(event.endMinute) || event.endMinute < event.startMinute))) {
      issues.push({
        code: 'TEMPLATE_INVALID_TIME_RANGE',
        message: `Timeline event ${event.id} has an invalid time range.`,
        entityId: event.id,
      });
    }
    if (!locationIds.has(event.locationId)) {
      issues.push({
        code: 'TEMPLATE_TIMELINE_UNKNOWN_LOCATION',
        message: `Timeline event ${event.id} references unknown location ${event.locationId}.`,
        entityId: event.id,
      });
    }
    for (const actorId of event.actorCharacterSlotIds) {
      if (!slotSet.has(actorId)) {
        issues.push({
          code: 'TEMPLATE_TIMELINE_UNKNOWN_ACTOR',
          message: `Timeline event ${event.id} references unknown actor slot ${actorId}.`,
          entityId: event.id,
        });
      }
    }
    for (const factId of event.factIds) {
      if (!factIds.has(factId)) {
        issues.push({
          code: 'TEMPLATE_TIMELINE_UNKNOWN_FACT',
          message: `Timeline event ${event.id} references unknown fact ${factId}.`,
          entityId: event.id,
        });
      }
    }
  }

  for (const item of template.knowledge) {
    if (!slotSet.has(item.holderCharacterSlotId)) {
      issues.push({
        code: 'TEMPLATE_KNOWLEDGE_UNKNOWN_HOLDER',
        message: `Knowledge ${item.id} references unknown holder slot ${item.holderCharacterSlotId}.`,
        entityId: item.id,
      });
    }
    if (!factIds.has(item.factId)) {
      issues.push({
        code: 'TEMPLATE_KNOWLEDGE_UNKNOWN_FACT',
        message: `Knowledge ${item.id} references unknown fact ${item.factId}.`,
        entityId: item.id,
      });
    }
    if (!item.perceivedDescription.trim()) {
      issues.push({
        code: 'TEMPLATE_KNOWLEDGE_MISSING_PERCEPTION',
        message: `Knowledge ${item.id} must define the holder-facing perceived description.`,
        entityId: item.id,
      });
    }
    if (!inUnitInterval(item.accuracy) || !inUnitInterval(item.confidence)) {
      issues.push({
        code: 'TEMPLATE_INVALID_KNOWLEDGE_SCORE',
        message: `Knowledge ${item.id} accuracy/confidence must be between 0 and 1.`,
        entityId: item.id,
      });
    }
    if (item.source.sourceCharacterSlotId && !slotSet.has(item.source.sourceCharacterSlotId)) {
      issues.push({
        code: 'TEMPLATE_KNOWLEDGE_UNKNOWN_SOURCE_CHARACTER',
        message: `Knowledge ${item.id} references unknown source character slot.`,
        entityId: item.id,
      });
    }
    if (item.source.sourceTimelineEventId && !timelineIds.has(item.source.sourceTimelineEventId)) {
      issues.push({
        code: 'TEMPLATE_KNOWLEDGE_UNKNOWN_SOURCE_EVENT',
        message: `Knowledge ${item.id} references unknown source event.`,
        entityId: item.id,
      });
    }
  }

  for (const evidence of template.evidence) {
    if (!inUnitInterval(evidence.reliability) || !inUnitInterval(evidence.ambiguity)) {
      issues.push({
        code: 'TEMPLATE_INVALID_EVIDENCE_SCORE',
        message: `Evidence ${evidence.id} reliability/ambiguity must be between 0 and 1.`,
        entityId: evidence.id,
      });
    }
    for (const factId of evidence.factIds) {
      if (!factIds.has(factId)) {
        issues.push({
          code: 'TEMPLATE_EVIDENCE_UNKNOWN_FACT',
          message: `Evidence ${evidence.id} references unknown fact ${factId}.`,
          entityId: evidence.id,
        });
      }
    }
    if (evidence.provenance.sourceCharacterSlotId && !slotSet.has(evidence.provenance.sourceCharacterSlotId)) {
      issues.push({
        code: 'TEMPLATE_EVIDENCE_UNKNOWN_SOURCE_CHARACTER',
        message: `Evidence ${evidence.id} references unknown source character slot.`,
        entityId: evidence.id,
      });
    }
    if (evidence.provenance.sourceTimelineEventId && !timelineIds.has(evidence.provenance.sourceTimelineEventId)) {
      issues.push({
        code: 'TEMPLATE_EVIDENCE_UNKNOWN_SOURCE_EVENT',
        message: `Evidence ${evidence.id} references unknown source event.`,
        entityId: evidence.id,
      });
    }
  }

  for (const role of template.roles) {
    if (!slotSet.has(role.characterSlotId)) {
      issues.push({
        code: 'TEMPLATE_ROLE_UNKNOWN_CHARACTER',
        message: `Role ${role.id} references unknown character slot ${role.characterSlotId}.`,
        entityId: role.id,
      });
    }
  }

  for (const charge of template.charges) {
    if (charge.defendantCharacterSlotIds.length === 0) {
      issues.push({
        code: 'TEMPLATE_CHARGE_HAS_NO_DEFENDANT',
        message: `Charge ${charge.id} must reference at least one defendant slot.`,
        entityId: charge.id,
      });
    }

    for (const defendantSlotId of charge.defendantCharacterSlotIds) {
      if (!template.defendantCharacterSlotIds.includes(defendantSlotId)) {
        issues.push({
          code: 'TEMPLATE_CHARGE_UNKNOWN_DEFENDANT',
          message: `Charge ${charge.id} references non-defendant slot ${defendantSlotId}.`,
          entityId: charge.id,
        });
      }
    }

    if (charge.elements.length === 0) {
      issues.push({
        code: 'TEMPLATE_CHARGE_HAS_NO_ELEMENTS',
        message: `Charge ${charge.id} must define at least one legal element.`,
        entityId: charge.id,
      });
    }

    for (const element of charge.elements) {
      if (element.basisFactIds.length === 0) {
        issues.push({
          code: 'TEMPLATE_CHARGE_ELEMENT_NO_BASIS',
          message: `Charge element ${element.id} has no truth basis.`,
          entityId: element.id,
        });
      }
      for (const factId of element.basisFactIds) {
        if (!factIds.has(factId)) {
          issues.push({
            code: 'TEMPLATE_CHARGE_ELEMENT_UNKNOWN_FACT',
            message: `Charge element ${element.id} references unknown fact ${factId}.`,
            entityId: element.id,
          });
        }
      }
    }
  }

  return issues;
}

export function validateCaseTemplateCatalog(
  dnas: readonly CaseDNA[],
  templates: readonly CaseTemplate[],
): CaseTemplateIssue[] {
  const issues: CaseTemplateIssue[] = [];
  const dnaById = new Map(dnas.map((dna) => [dna.id, dna]));

  for (const duplicate of duplicateValues(dnas.map((dna) => dna.id))) {
    issues.push({
      code: 'CATALOG_DUPLICATE_DNA_ID',
      message: `DNA id ${duplicate} is duplicated.`,
      entityId: duplicate,
    });
  }

  for (const duplicate of duplicateValues(templates.map((template) => template.id))) {
    issues.push({
      code: 'CATALOG_DUPLICATE_TEMPLATE_ID',
      message: `Template id ${duplicate} is duplicated.`,
      entityId: duplicate,
    });
  }

  for (const template of templates) {
    const dna = dnaById.get(template.dnaId);
    if (!dna) {
      issues.push({
        code: 'CATALOG_TEMPLATE_UNKNOWN_DNA',
        message: `Template ${template.id} references unknown DNA ${template.dnaId}.`,
        entityId: template.id,
      });
      continue;
    }
    issues.push(...validateCaseTemplate(template, dna));
  }

  return issues;
}
