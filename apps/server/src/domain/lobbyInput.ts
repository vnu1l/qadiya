import {
  CASE_COMMITMENTS,
  isAssignableRole,
  type LobbyRules,
  type PrivateRulesPatch,
  type RolePreference,
} from '@qadiya/shared';

const DEFENDANT_SELECTION = new Set(['weighted-system', 'random', 'private-host']);
const JUDGE_SELECTION = new Set(['candidate-vote', 'weighted-system', 'private-host']);
const DEFENSE_SELECTION = new Set(['defendant-choice', 'court-appointed', 'private-host']);
const COMMITMENTS = new Set<string>(CASE_COMMITMENTS);

function clampPriority(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.round(Math.max(0, Math.min(100, value)));
}

export function sanitizeRolePreferences(input: unknown): RolePreference[] {
  if (!Array.isArray(input)) return [];

  const byRole = new Map<RolePreference['role'], RolePreference>();

  for (const raw of input.slice(0, 32)) {
    if (!raw || typeof raw !== 'object') continue;
    const candidate = raw as Record<string, unknown>;
    if (!isAssignableRole(candidate.role) || typeof candidate.accepted !== 'boolean') continue;

    byRole.set(candidate.role, {
      role: candidate.role,
      accepted: candidate.accepted,
      priority: clampPriority(candidate.priority),
      allowAutomaticAssignment: candidate.allowAutomaticAssignment === true,
    });
  }

  return [...byRole.values()];
}

export function sanitizePrivateRulesPatch(current: LobbyRules, input: unknown): LobbyRules {
  if (current.sessionKind !== 'private' || !input || typeof input !== 'object') return current;

  const raw = input as Record<string, unknown>;
  const patch: PrivateRulesPatch = {};

  if (typeof raw.commitment === 'string' && COMMITMENTS.has(raw.commitment)) {
    patch.commitment = raw.commitment as PrivateRulesPatch['commitment'];
  }
  if (typeof raw.defendantSelection === 'string' && DEFENDANT_SELECTION.has(raw.defendantSelection)) {
    patch.defendantSelection = raw.defendantSelection as PrivateRulesPatch['defendantSelection'];
  }
  if (typeof raw.judgeSelection === 'string' && JUDGE_SELECTION.has(raw.judgeSelection)) {
    patch.judgeSelection = raw.judgeSelection as PrivateRulesPatch['judgeSelection'];
  }
  if (typeof raw.defenseSelection === 'string' && DEFENSE_SELECTION.has(raw.defenseSelection)) {
    patch.defenseSelection = raw.defenseSelection as PrivateRulesPatch['defenseSelection'];
  }

  for (const key of ['allowMultipleDefendants', 'allowCrossDefendantContradictions', 'allowSystemCharacters'] as const) {
    if (typeof raw[key] === 'boolean') patch[key] = raw[key];
  }

  if (typeof raw.maxDefendants === 'number' && Number.isFinite(raw.maxDefendants)) {
    patch.maxDefendants = Math.max(1, Math.min(3, Math.round(raw.maxDefendants)));
  }

  const next: LobbyRules = { ...current, ...patch, sessionKind: 'private', minPlayers: 3, maxPlayers: 12 };

  if (!next.allowMultipleDefendants) {
    next.maxDefendants = 1;
    next.allowCrossDefendantContradictions = false;
  } else {
    next.maxDefendants = Math.max(2, next.maxDefendants);
  }

  return next;
}
