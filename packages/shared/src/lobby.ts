import type { RolePreference, RoleHistorySummary } from './roles';

export type SessionKind = 'casual' | 'ranked' | 'private';
export type CaseCommitment = 'small' | 'standard' | 'large' | 'long' | 'any';
export type DefendantSelectionMethod = 'weighted-system' | 'random' | 'private-host';
export type JudgeSelectionMethod = 'candidate-vote' | 'weighted-system' | 'private-host';
export type DefenseSelectionMethod = 'defendant-choice' | 'court-appointed' | 'private-host';

export interface LobbyPlayerProfile {
  playerId: string;
  displayName: string;
  connected: boolean;
  ready: boolean;
  rolePreferences: RolePreference[];
  roleHistory: RoleHistorySummary[];
  reputationBand?: 'new' | 'trusted' | 'experienced' | 'veteran';
}

export interface LobbyRules {
  sessionKind: SessionKind;
  minPlayers: number;
  maxPlayers: number;
  commitment: CaseCommitment;
  defendantSelection: DefendantSelectionMethod;
  judgeSelection: JudgeSelectionMethod;
  defenseSelection: DefenseSelectionMethod;
  allowMultipleDefendants: boolean;
  maxDefendants: number;
  allowCrossDefendantContradictions: boolean;
  allowSystemCharacters: boolean;
}

export const DEFAULT_PRIVATE_RULES: Readonly<LobbyRules> = {
  sessionKind: 'private',
  minPlayers: 3,
  maxPlayers: 12,
  commitment: 'any',
  defendantSelection: 'weighted-system',
  judgeSelection: 'candidate-vote',
  defenseSelection: 'defendant-choice',
  allowMultipleDefendants: true,
  maxDefendants: 3,
  allowCrossDefendantContradictions: true,
  allowSystemCharacters: true,
};

export const DEFAULT_CASUAL_RULES: Readonly<LobbyRules> = {
  sessionKind: 'casual',
  minPlayers: 6,
  maxPlayers: 10,
  commitment: 'standard',
  defendantSelection: 'weighted-system',
  judgeSelection: 'candidate-vote',
  defenseSelection: 'defendant-choice',
  allowMultipleDefendants: true,
  maxDefendants: 3,
  allowCrossDefendantContradictions: true,
  allowSystemCharacters: false,
};

export const DEFAULT_RANKED_RULES: Readonly<LobbyRules> = {
  ...DEFAULT_CASUAL_RULES,
  sessionKind: 'ranked',
  judgeSelection: 'weighted-system',
};

export function rulesForSession(kind: SessionKind): Readonly<LobbyRules> {
  if (kind === 'private') return DEFAULT_PRIVATE_RULES;
  if (kind === 'ranked') return DEFAULT_RANKED_RULES;
  return DEFAULT_CASUAL_RULES;
}
