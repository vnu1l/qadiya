import type { RoleDefinition, RoleEngagement } from './model.js';

export interface RoleAdaptationOptions {
  humanSlots: number;
  allowSystemCharacters: boolean;
  allowDocuments: boolean;
}

export interface ScoredRole {
  roleId: string;
  score: number;
}

export interface RoleAdaptationResult {
  humanRoleIds: string[];
  systemCharacterRoleIds: string[];
  documentRoleIds: string[];
  omittedOptionalRoleIds: string[];
  unfulfilledRequiredRoleIds: string[];
  scores: ScoredRole[];
}

function weightedEngagement(engagement: RoleEngagement): number {
  return (
    engagement.exclusiveInformation * 0.22 +
    engagement.meaningfulDecisions * 0.28 +
    engagement.concealmentPressure * 0.15 +
    engagement.influencePotential * 0.22 +
    engagement.personalRisk * 0.13
  );
}

/**
 * Higher means the role deserves a human seat more strongly. This is not a
 * player reward score; it only helps the Case Engine decide how to spend a
 * limited number of human role slots.
 */
export function humanRoleValue(role: RoleDefinition): number {
  let score = weightedEngagement(role.engagement);
  if (role.required) score += 0.8;
  if (role.critical) score += 0.7;
  if (!role.canBecomeSystemCharacter && !role.canBecomeDocument) score += 0.45;
  return score;
}

function canSystemAdapt(role: RoleDefinition, options: RoleAdaptationOptions): boolean {
  return options.allowSystemCharacters && role.canBecomeSystemCharacter;
}

function canDocumentAdapt(role: RoleDefinition, options: RoleAdaptationOptions): boolean {
  // Critical cross-examinable roles must never silently collapse into a document.
  return options.allowDocuments && !role.critical && role.canBecomeDocument;
}

export function adaptVariableRoles(
  roles: readonly RoleDefinition[],
  options: RoleAdaptationOptions,
): RoleAdaptationResult {
  if (!Number.isInteger(options.humanSlots) || options.humanSlots < 0) {
    throw new Error('humanSlots must be a non-negative integer.');
  }

  const scores = roles
    .map((role) => ({ roleId: role.id, score: humanRoleValue(role) }))
    .sort((a, b) => b.score - a.score || a.roleId.localeCompare(b.roleId));

  const roleById = new Map(roles.map((role) => [role.id, role]));
  const humanRoleIds = scores.slice(0, options.humanSlots).map((entry) => entry.roleId);
  const humanSet = new Set(humanRoleIds);
  const systemCharacterRoleIds: string[] = [];
  const documentRoleIds: string[] = [];
  const omittedOptionalRoleIds: string[] = [];
  const unfulfilledRequiredRoleIds: string[] = [];

  for (const entry of scores) {
    if (humanSet.has(entry.roleId)) continue;
    const role = roleById.get(entry.roleId)!;

    if (canSystemAdapt(role, options)) {
      systemCharacterRoleIds.push(role.id);
      continue;
    }

    if (canDocumentAdapt(role, options)) {
      documentRoleIds.push(role.id);
      continue;
    }

    if (role.required || role.critical) {
      unfulfilledRequiredRoleIds.push(role.id);
      continue;
    }

    omittedOptionalRoleIds.push(role.id);
  }

  return {
    humanRoleIds,
    systemCharacterRoleIds,
    documentRoleIds,
    omittedOptionalRoleIds,
    unfulfilledRequiredRoleIds,
    scores,
  };
}

export function roleAdaptationIsPlayable(result: RoleAdaptationResult): boolean {
  return result.unfulfilledRequiredRoleIds.length === 0;
}
