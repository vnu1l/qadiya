import type { CharacterBrief } from './characters';
import type { PlayerRole } from './roles';

export const RETAINED_NOTE_ABSOLUTE_MAX = 5;
export const RETAINED_NOTE_MAX_LENGTH = 96;
export const RETAINED_NOTE_TOTAL_MAX_LENGTH = 280;

export interface MemoryBriefItem {
  id: string;
  text: string;
  retainableAsNote: boolean;
}

export interface PrivatePlayerBrief {
  playerId: string;
  role: PlayerRole;
  character: CharacterBrief;
  memory: MemoryBriefItem[];
  privateKnowledgeIds: string[];
  secretIds: string[];
  retainedNoteLimit: number;
}

export interface PrivilegedConsultationNote {
  id: string;
  authorPlayerId: string;
  text: string;
  createdAt: string;
}

export interface PrivilegedConsultation {
  id: string;
  participantPlayerIds: string[];
  notes: PrivilegedConsultationNote[];
}

export type PreparationStage = 'inactive' | 'active' | 'ready-to-open' | 'complete';

export interface PreparationParticipant {
  playerId: string;
  role: PlayerRole;
  /** Core roles are true. Non-critical witnesses can be false later. */
  requiredForOpening: boolean;
}

export interface PreparationIssue {
  code: string;
  message: string;
  playerId?: string;
}

export interface PreparationPublicSnapshot {
  stage: PreparationStage;
  participantPlayerIds: string[];
  readyPlayerIds: string[];
  hardBlockerCount: number;
  warningCount: number;
}

export interface PreparationReadiness {
  hardBlockers: PreparationIssue[];
  warnings: PreparationIssue[];
}

export interface PreparationOpenResult {
  opened: boolean;
  readiness: PreparationReadiness;
  requiresSoftOverride: boolean;
}
