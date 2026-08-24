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
