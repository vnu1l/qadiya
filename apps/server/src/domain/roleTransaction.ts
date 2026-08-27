import type { AssignableRole, CoreRoleAllocationPlan, LobbyRules } from '@qadiya/shared';
import { applyDefenseRepresentationState, type CourtState, type PlayerState } from '../state/CourtState.js';

export interface RoleTransactionIssue {
  code: string;
  message: string;
  playerId?: string;
}

function acceptsRole(player: PlayerState | undefined, role: AssignableRole): boolean {
  return player?.rolePreferences.get(role)?.accepted === true;
}

function validateConnectedRolePlayer(
  state: CourtState,
  playerId: string,
  role: AssignableRole,
  issues: RoleTransactionIssue[],
): PlayerState | undefined {
  const player = state.players.get(playerId);
  if (!player?.connected) {
    issues.push({ code: 'ROLE_PLAYER_UNAVAILABLE', message: `${playerId} is not connected.`, playerId });
    return player;
  }

  if (!acceptsRole(player, role)) {
    issues.push({ code: 'ROLE_NOT_ACCEPTED', message: `${playerId} did not accept role ${role}.`, playerId });
  }

  return player;
}

export function validateCoreRolePlan(
  state: CourtState,
  plan: CoreRoleAllocationPlan,
  rules: LobbyRules,
): RoleTransactionIssue[] {
  const issues: RoleTransactionIssue[] = [];
  const defendantSet = new Set(plan.defendantPlayerIds);

  if (defendantSet.size !== plan.defendantPlayerIds.length || defendantSet.size === 0) {
    issues.push({ code: 'INVALID_DEFENDANT_SET', message: 'Defendants must be a non-empty unique set.' });
  }

  if (plan.defendantPlayerIds.length > rules.maxDefendants) {
    issues.push({ code: 'TOO_MANY_DEFENDANTS', message: 'Plan exceeds the room maximum defendant count.' });
  }

  if (!rules.allowMultipleDefendants && plan.defendantPlayerIds.length > 1) {
    issues.push({ code: 'MULTIPLE_DEFENDANTS_DISABLED', message: 'This room does not allow multiple defendants.' });
  }

  validateConnectedRolePlayer(state, plan.judgePlayerId, 'judge', issues);
  validateConnectedRolePlayer(state, plan.prosecutionPlayerId, 'prosecution', issues);
  for (const defendantId of plan.defendantPlayerIds) {
    validateConnectedRolePlayer(state, defendantId, 'defendant', issues);
  }

  const incompatibleCoreIds = [plan.judgePlayerId, plan.prosecutionPlayerId, ...plan.defendantPlayerIds];
  if (new Set(incompatibleCoreIds).size !== incompatibleCoreIds.length) {
    issues.push({ code: 'CORE_ROLE_COLLISION', message: 'Judge, prosecution and defendants must be different players.' });
  }

  const representedCounts = new Map<string, number>();
  const lawyerIds = new Set<string>();

  for (const representation of plan.defenseRepresentations) {
    if (representation.defendantPlayerIds.length === 0) {
      issues.push({ code: 'EMPTY_REPRESENTATION', message: `Representation ${representation.id} has no defendants.` });
      continue;
    }

    for (const defendantId of representation.defendantPlayerIds) {
      if (!defendantSet.has(defendantId)) {
        issues.push({
          code: 'REPRESENTATION_UNKNOWN_DEFENDANT',
          message: `Representation ${representation.id} references non-defendant ${defendantId}.`,
          playerId: defendantId,
        });
      }
      representedCounts.set(defendantId, (representedCounts.get(defendantId) ?? 0) + 1);
    }

    if (representation.selfRepresented) {
      if (!rules.allowSelfRepresentation) {
        issues.push({ code: 'SELF_REPRESENTATION_DISABLED', message: 'This room does not allow self representation.' });
      }
      if (representation.lawyerPlayerId) {
        issues.push({ code: 'SELF_REPRESENTATION_WITH_LAWYER', message: 'Self-representation cannot also specify a lawyer.' });
      }
      if (representation.defendantPlayerIds.length !== 1) {
        issues.push({
          code: 'GROUP_SELF_REPRESENTATION_INVALID',
          message: 'Each self-represented defendant must have their own representation record.',
        });
      }
      continue;
    }

    if (!representation.lawyerPlayerId) {
      issues.push({ code: 'REPRESENTATION_MISSING_LAWYER', message: `Representation ${representation.id} needs a lawyer.` });
      continue;
    }

    const lawyerId = representation.lawyerPlayerId;
    validateConnectedRolePlayer(state, lawyerId, 'defense', issues);

    if (lawyerIds.has(lawyerId)) {
      issues.push({ code: 'LAWYER_DUPLICATE_REPRESENTATION', message: `${lawyerId} appears in multiple defense records.`, playerId: lawyerId });
    }
    lawyerIds.add(lawyerId);

    if (incompatibleCoreIds.includes(lawyerId)) {
      issues.push({ code: 'LAWYER_CORE_ROLE_COLLISION', message: `${lawyerId} cannot also be judge, prosecution or defendant.`, playerId: lawyerId });
    }
  }

  for (const defendantId of defendantSet) {
    if (representedCounts.get(defendantId) !== 1) {
      issues.push({
        code: 'DEFENDANT_REPRESENTATION_COVERAGE',
        message: `${defendantId} must be represented exactly once.`,
        playerId: defendantId,
      });
    }
  }

  return issues;
}

/**
 * Server-only atomic application. Never expose this plan as a client-trusted
 * message: selection/voting systems produce it, this function validates it,
 * then state changes happen only if the entire plan is valid.
 */
export function applyCoreRolePlan(
  state: CourtState,
  plan: CoreRoleAllocationPlan,
  rules: LobbyRules,
): RoleTransactionIssue[] {
  const issues = validateCoreRolePlan(state, plan, rules);
  if (issues.length > 0) return issues;

  for (const player of state.players.values()) player.role = 'unassigned';

  state.players.get(plan.judgePlayerId)!.role = 'judge';
  state.players.get(plan.prosecutionPlayerId)!.role = 'prosecution';
  for (const defendantId of plan.defendantPlayerIds) state.players.get(defendantId)!.role = 'defendant';

  for (const representation of plan.defenseRepresentations) {
    if (!representation.selfRepresented && representation.lawyerPlayerId) {
      state.players.get(representation.lawyerPlayerId)!.role = 'defense';
    }
  }

  applyDefenseRepresentationState(state.defenseRepresentations, plan.defenseRepresentations);
  state.phase = 'preparation';
  return [];
}
