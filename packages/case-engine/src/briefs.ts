import type {
  BeliefState,
  BurdenStandard,
  CaseBlueprint,
  CaseCharacter,
  CaseRoleKind,
  EvidenceKind,
  KnowledgePrecision,
  KnowledgeSourceKind,
} from './model.js';

export type CoreBriefRole = 'judge' | 'prosecution' | 'defense' | 'defendant';
export type CaseBriefRole = CoreBriefRole | CaseRoleKind;
export type ConfidenceBand = 'low' | 'medium' | 'high';

export type RoleBriefRequest =
  | { role: 'judge' }
  | { role: 'prosecution' }
  | { role: 'defense'; representedDefendantIds: readonly string[] }
  | { role: 'defendant'; characterId: string }
  | { role: CaseRoleKind; characterId: string };

export interface BriefCharacterIdentity {
  id: string;
  publicName: string;
  age: number;
  gender: CaseCharacter['gender'];
  occupation: string;
  memoryProfile: CaseCharacter['memoryProfile'];
}

export interface BriefChargeElement {
  id: string;
  title: string;
}

export interface BriefCharge {
  id: string;
  title: string;
  defendantIds: string[];
  burden: BurdenStandard;
  elements: BriefChargeElement[];
}

export interface BriefEvidence {
  id: string;
  title: string;
  kind: EvidenceKind;
  description: string;
}

export interface BriefMemoryItem {
  knowledgeId: string;
  perceivedDescription: string;
  sourceKind: KnowledgeSourceKind;
  precision: KnowledgePrecision;
  confidence: ConfidenceBand;
  belief: BeliefState;
}

export interface PrivateRoleBrief {
  caseId: string;
  role: CaseBriefRole;
  character?: BriefCharacterIdentity;
  representedDefendantIds: string[];
  charges: BriefCharge[];
  evidence: BriefEvidence[];
  memory: BriefMemoryItem[];
}

export type CaseBriefErrorCode =
  | 'BRIEF_UNKNOWN_CHARACTER'
  | 'BRIEF_CHARACTER_NOT_DEFENDANT'
  | 'BRIEF_ROLE_CHARACTER_MISMATCH'
  | 'BRIEF_DEFENSE_HAS_NO_CLIENT'
  | 'BRIEF_UNKNOWN_REPRESENTED_DEFENDANT';

export class CaseBriefError extends Error {
  constructor(
    public readonly code: CaseBriefErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CaseBriefError';
  }
}

function confidenceBand(value: number): ConfidenceBand {
  if (value < 0.4) return 'low';
  if (value < 0.75) return 'medium';
  return 'high';
}

function sanitizeCharacter(character: CaseCharacter): BriefCharacterIdentity {
  return {
    id: character.id,
    publicName: character.publicName,
    age: character.age,
    gender: character.gender,
    occupation: character.occupation,
    memoryProfile: character.memoryProfile,
  };
}

function sanitizeCharge(charge: CaseBlueprint['charges'][number]): BriefCharge {
  return {
    id: charge.id,
    title: charge.title,
    defendantIds: [...charge.defendantIds],
    burden: charge.burden,
    elements: charge.elements.map((element) => ({
      id: element.id,
      title: element.title,
    })),
  };
}

function evidenceForRole(blueprint: CaseBlueprint, role: 'prosecution' | 'defense'): BriefEvidence[] {
  return blueprint.evidence
    .filter((evidence) => evidence.discoverableByRoleIds.includes(role))
    .map((evidence) => ({
      id: evidence.id,
      title: evidence.title,
      kind: evidence.provenance.kind,
      description: evidence.provenance.description,
    }));
}

function memoryForCharacter(blueprint: CaseBlueprint, characterId: string): BriefMemoryItem[] {
  return blueprint.knowledge
    .filter((item) => item.holderCharacterId === characterId)
    .map((item) => ({
      knowledgeId: item.id,
      perceivedDescription: item.perceivedDescription,
      sourceKind: item.source.kind,
      precision: item.precision,
      confidence: confidenceBand(item.confidence),
      belief: item.belief,
    }));
}

function requireCharacter(blueprint: CaseBlueprint, characterId: string): CaseCharacter {
  const character = blueprint.characters.find((candidate) => candidate.id === characterId);
  if (!character) {
    throw new CaseBriefError(
      'BRIEF_UNKNOWN_CHARACTER',
      `Character ${characterId} does not exist in case ${blueprint.id}.`,
    );
  }
  return character;
}

function publicChargesForRequest(
  blueprint: CaseBlueprint,
  request: RoleBriefRequest,
): BriefCharge[] {
  if (request.role === 'defendant') {
    return blueprint.charges
      .filter((charge) => charge.defendantIds.includes(request.characterId))
      .map(sanitizeCharge);
  }

  if (request.role === 'defense') {
    return blueprint.charges
      .filter((charge) =>
        charge.defendantIds.some((defendantId) => request.representedDefendantIds.includes(defendantId)),
      )
      .map(sanitizeCharge);
  }

  return blueprint.charges.map(sanitizeCharge);
}

export function derivePrivateRoleBrief(
  blueprint: CaseBlueprint,
  request: RoleBriefRequest,
): PrivateRoleBrief {
  if (request.role === 'judge') {
    return {
      caseId: blueprint.id,
      role: 'judge',
      representedDefendantIds: [],
      charges: publicChargesForRequest(blueprint, request),
      evidence: [],
      memory: [],
    };
  }

  if (request.role === 'prosecution') {
    return {
      caseId: blueprint.id,
      role: 'prosecution',
      representedDefendantIds: [],
      charges: publicChargesForRequest(blueprint, request),
      evidence: evidenceForRole(blueprint, 'prosecution'),
      memory: [],
    };
  }

  if (request.role === 'defense') {
    const representedIds = [...new Set(request.representedDefendantIds)];
    if (representedIds.length === 0) {
      throw new CaseBriefError(
        'BRIEF_DEFENSE_HAS_NO_CLIENT',
        'Defense brief requires at least one represented defendant.',
      );
    }

    for (const defendantId of representedIds) {
      if (!blueprint.defendantIds.includes(defendantId)) {
        throw new CaseBriefError(
          'BRIEF_UNKNOWN_REPRESENTED_DEFENDANT',
          `Defense brief references non-defendant ${defendantId}.`,
        );
      }
    }

    return {
      caseId: blueprint.id,
      role: 'defense',
      representedDefendantIds: representedIds,
      charges: publicChargesForRequest(blueprint, {
        ...request,
        representedDefendantIds: representedIds,
      }),
      evidence: evidenceForRole(blueprint, 'defense'),
      memory: [],
    };
  }

  const character = requireCharacter(blueprint, request.characterId);

  if (request.role === 'defendant') {
    if (!blueprint.defendantIds.includes(request.characterId)) {
      throw new CaseBriefError(
        'BRIEF_CHARACTER_NOT_DEFENDANT',
        `Character ${request.characterId} is not a defendant in this case.`,
      );
    }

    return {
      caseId: blueprint.id,
      role: 'defendant',
      character: sanitizeCharacter(character),
      representedDefendantIds: [character.id],
      charges: publicChargesForRequest(blueprint, request),
      evidence: [],
      memory: memoryForCharacter(blueprint, character.id),
    };
  }

  const variableRole = blueprint.roles.find(
    (role) => role.characterId === character.id && role.roleKind === request.role,
  );
  if (!variableRole) {
    throw new CaseBriefError(
      'BRIEF_ROLE_CHARACTER_MISMATCH',
      `Character ${character.id} is not assigned variable role ${request.role}.`,
    );
  }

  return {
    caseId: blueprint.id,
    role: request.role,
    character: sanitizeCharacter(character),
    representedDefendantIds: [],
    charges: publicChargesForRequest(blueprint, request),
    evidence: [],
    memory: memoryForCharacter(blueprint, character.id),
  };
}
