export type CaseMode =
  | 'single-defendant'
  | 'joint-defendants'
  | 'wrongly-accused'
  | 'conflicting-narratives'
  | 'evidence-heavy'
  | 'secrets-heavy'
  | 'conspiracy';

export type CaseComplexity = 1 | 2 | 3 | 4 | 5;
export type KnowledgePrecision = 'exact' | 'narrow-range' | 'approximate' | 'vague';
export type BeliefState = 'believes-true' | 'believes-false' | 'uncertain';

export type KnowledgeSourceKind =
  | 'direct-observation'
  | 'self-memory'
  | 'digital-record'
  | 'physical-record'
  | 'document'
  | 'heard-from-person'
  | 'expert-analysis'
  | 'inference';

export interface CaseFact {
  id: string;
  description: string;
  subjectId?: string;
  predicate: string;
  objectId?: string;
  tags?: string[];
}

export interface TimelineEvent {
  id: string;
  startMinute: number;
  endMinute?: number;
  locationId: string;
  actorIds: string[];
  factIds: string[];
}

export interface CaseCharacter {
  id: string;
  publicName: string;
  age: number;
  gender: 'male' | 'female';
  occupation: string;
  memoryProfile: 'strong' | 'normal' | 'uncertain';
}

export interface KnowledgeSource {
  kind: KnowledgeSourceKind;
  sourceEntityId?: string;
  sourceTimelineEventId?: string;
  note?: string;
}

export interface KnowledgeItem {
  id: string;
  holderCharacterId: string;
  factId: string;
  source: KnowledgeSource;
  /** Objective correspondence to the ground truth, from 0 to 1. */
  accuracy: number;
  /** How sure the character feels, from 0 to 1. This is deliberately distinct from accuracy. */
  confidence: number;
  precision: KnowledgePrecision;
  belief: BeliefState;
}

export type EvidenceKind = 'physical' | 'digital' | 'document' | 'testimony' | 'expert-report';

export interface EvidenceProvenance {
  kind: EvidenceKind;
  sourceEntityId?: string;
  sourceTimelineEventId?: string;
  description: string;
}

export interface EvidenceDefinition {
  id: string;
  title: string;
  factIds: string[];
  provenance: EvidenceProvenance;
  /** Technical trustworthiness of the item itself, not the legal conclusion. */
  reliability: number;
  /** How open the evidence is to competing interpretations, from 0 to 1. */
  ambiguity: number;
  discoverableByRoleIds: string[];
}

export interface RoleEngagement {
  exclusiveInformation: number;
  meaningfulDecisions: number;
  concealmentPressure: number;
  influencePotential: number;
  personalRisk: number;
}

export interface RoleDefinition {
  id: string;
  characterId: string;
  required: boolean;
  replaceable: boolean;
  canBecomeSystemCharacter: boolean;
  canBecomeDocument: boolean;
  critical: boolean;
  engagement: RoleEngagement;
}

export interface ChargeDefinition {
  id: string;
  title: string;
  defendantIds: string[];
  elementFactIds: string[];
}

export interface CaseBlueprint {
  id: string;
  mode: CaseMode;
  complexity: CaseComplexity;
  characters: CaseCharacter[];
  defendantIds: string[];
  facts: CaseFact[];
  timeline: TimelineEvent[];
  knowledge: KnowledgeItem[];
  evidence: EvidenceDefinition[];
  roles: RoleDefinition[];
  charges: ChargeDefinition[];
}
