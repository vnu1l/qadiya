import type { CharacterBrief } from './characters';
import type { PlayerRole } from './roles';

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
