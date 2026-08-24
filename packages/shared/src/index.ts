export const QADIYA_VERSION = '0.1.0';

export type CoreRole = 'judge' | 'defendant' | 'defense' | 'prosecution';
export type VariableRole = 'witness' | 'investigator' | 'expert' | 'complainant' | 'victim' | 'other';
export type PlayerRole = CoreRole | VariableRole | 'unassigned' | 'spectator';

export type CourtPhase =
  | 'lobby'
  | 'role-allocation'
  | 'preparation'
  | 'opening'
  | 'case-presentation'
  | 'closing'
  | 'deliberation'
  | 'verdict'
  | 'suspended'
  | 'complete';

export interface CharacterBrief {
  id: string;
  displayName: string;
  gender: 'male' | 'female';
  age: number;
  occupation: string;
  publicBackground: string[];
  privateKnowledge: string[];
  memoryNotes: string[];
}

export interface CourtEvent {
  id: string;
  at: string;
  type: string;
  actorId?: string;
  payload?: Record<string, unknown>;
}
