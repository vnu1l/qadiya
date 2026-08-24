export type CaseMode =
  | 'standard'
  | 'joint-case'
  | 'conflicting-narratives'
  | 'evidence-focus'
  | 'secrets-focus'
  | 'conspiracy';

export type CaseComplexity = 1 | 2 | 3 | 4 | 5;
export type KnowledgePrecision = 'exact' | 'narrow-range' | 'approximate' | 'vague';
export type BeliefState = 'believes-true' | 'believes-false' | 'uncertain';

export type CaseRoleKind =
  | 'witness'
  | 'investigator'
  | 'expert'
  | 'complainant'
  | 'victim'
  | 'secondary-suspect'
  | 'case-related-person';

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

export interface LocationDefinition {
  id: string;
  label: string;
}

export interface TravelLink {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  minTravelMinutes: number;
  bidirectional: boolean;
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
  precisionLimit: KnowledgePrecision;
}

export interface KnowledgeItem {
  id: string;
  holderCharacterId: string;
  factId: string;
  source: KnowledgeSource;
  accuracy: number;
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
  reliability: number;
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
  roleKind: CaseRoleKind;
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
  locations: LocationDefinition[];
  travelLinks: TravelLink[];
  timeline: TimelineEvent[];
  knowledge: KnowledgeItem[];
  evidence: EvidenceDefinition[];
  roles: RoleDefinition[];
  charges: ChargeDefinition[];
}
