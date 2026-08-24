export type CoreRole = 'judge' | 'defendant' | 'defense' | 'prosecution';

export type VariableRole =
  | 'witness'
  | 'investigator'
  | 'expert'
  | 'complainant'
  | 'victim'
  | 'secondary-suspect'
  | 'case-related-person'
  | 'other';

export type PlayerRole = CoreRole | VariableRole | 'unassigned' | 'spectator' | 'standby';
export type AssignableRole = Exclude<PlayerRole, 'unassigned' | 'spectator' | 'standby'>;

export const ASSIGNABLE_ROLES = [
  'judge',
  'defendant',
  'defense',
  'prosecution',
  'witness',
  'investigator',
  'expert',
  'complainant',
  'victim',
  'secondary-suspect',
  'case-related-person',
  'other',
] as const satisfies readonly AssignableRole[];

const ASSIGNABLE_ROLE_SET = new Set<string>(ASSIGNABLE_ROLES);

export function isAssignableRole(value: unknown): value is AssignableRole {
  return typeof value === 'string' && ASSIGNABLE_ROLE_SET.has(value);
}

export interface RolePreference {
  role: AssignableRole;
  accepted: boolean;
  /** 0 = no preference, 100 = highest preference. This never overrides fairness rules. */
  priority: number;
  allowAutomaticAssignment: boolean;
}

export interface RoleHistorySummary {
  role: AssignableRole;
  completedCases: number;
  recentAssignments: number;
  lastAssignedAt?: string;
}

export type RoleAssignmentSource =
  | 'weighted-system'
  | 'player-choice'
  | 'judge-vote'
  | 'court-appointed'
  | 'private-host'
  | 'substitution';

export interface RoleAssignment {
  playerId: string;
  role: AssignableRole;
  source: RoleAssignmentSource;
  defendantGroupId?: string;
  replacedPlayerId?: string;
}

export interface DefenseRepresentationPlan {
  id: string;
  defendantPlayerIds: string[];
  lawyerPlayerId?: string;
  selfRepresented: boolean;
}

export interface CoreRoleAllocationPlan {
  judgePlayerId: string;
  prosecutionPlayerId: string;
  defendantPlayerIds: string[];
  defenseRepresentations: DefenseRepresentationPlan[];
}
