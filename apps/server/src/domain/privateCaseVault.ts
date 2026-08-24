import {
  RETAINED_NOTE_ABSOLUTE_MAX,
  RETAINED_NOTE_MAX_LENGTH,
  RETAINED_NOTE_TOTAL_MAX_LENGTH,
  type PrivatePlayerBrief,
  type PrivilegedConsultation,
  type PrivilegedConsultationNote,
} from '@qadiya/shared';

function clone<T>(value: T): T {
  return structuredClone(value);
}

export type RetainedNotesUpdateResult =
  | { ok: true; notes: string[] }
  | { ok: false; code: string; message: string };

export class PrivateCaseVault {
  private readonly briefs = new Map<string, PrivatePlayerBrief>();
  private readonly consultations = new Map<string, PrivilegedConsultation>();
  private readonly retainedNotes = new Map<string, string[]>();
  private readonly retainedNotesLocked = new Set<string>();

  setPlayerBrief(playerId: string, brief: PrivatePlayerBrief): void {
    if (brief.playerId !== playerId) throw new Error('Private brief playerId must match the vault key.');
    this.briefs.set(playerId, clone(brief));
    if (!this.retainedNotes.has(playerId)) this.retainedNotes.set(playerId, []);
  }

  hasBrief(playerId: string): boolean {
    return this.briefs.has(playerId);
  }

  getOwnBrief(requesterPlayerId: string): PrivatePlayerBrief | null {
    const brief = this.briefs.get(requesterPlayerId);
    return brief ? clone(brief) : null;
  }

  setRetainedNotes(playerId: string, rawNotes: readonly string[]): RetainedNotesUpdateResult {
    const brief = this.briefs.get(playerId);
    if (!brief) {
      return { ok: false, code: 'PREPARATION_BRIEF_MISSING', message: 'A private brief is required before retained notes can be saved.' };
    }
    if (this.retainedNotesLocked.has(playerId)) {
      return { ok: false, code: 'RETAINED_NOTES_LOCKED', message: 'Retained notes are locked after the court opens.' };
    }

    const allowedCount = Math.max(
      0,
      Math.min(RETAINED_NOTE_ABSOLUTE_MAX, Math.trunc(Number.isFinite(brief.retainedNoteLimit) ? brief.retainedNoteLimit : 0)),
    );
    const notes = rawNotes.map((note) => note.trim()).filter(Boolean);

    if (notes.length > allowedCount) {
      return {
        ok: false,
        code: 'RETAINED_NOTE_COUNT_EXCEEDED',
        message: `This character may retain at most ${allowedCount} note(s).`,
      };
    }

    if (notes.some((note) => note.length > RETAINED_NOTE_MAX_LENGTH)) {
      return {
        ok: false,
        code: 'RETAINED_NOTE_TOO_LONG',
        message: `Each retained note must be ${RETAINED_NOTE_MAX_LENGTH} characters or fewer.`,
      };
    }

    const totalLength = notes.reduce((sum, note) => sum + note.length, 0);
    if (totalLength > RETAINED_NOTE_TOTAL_MAX_LENGTH) {
      return {
        ok: false,
        code: 'RETAINED_NOTES_TOTAL_TOO_LONG',
        message: `Retained notes may contain at most ${RETAINED_NOTE_TOTAL_MAX_LENGTH} characters in total.`,
      };
    }

    this.retainedNotes.set(playerId, [...notes]);
    return { ok: true, notes: [...notes] };
  }

  getRetainedNotes(playerId: string): string[] {
    return [...(this.retainedNotes.get(playerId) ?? [])];
  }

  lockRetainedNotes(playerIds: readonly string[]): void {
    for (const playerId of playerIds) {
      if (this.briefs.has(playerId)) this.retainedNotesLocked.add(playerId);
    }
  }

  isRetainedNotesLocked(playerId: string): boolean {
    return this.retainedNotesLocked.has(playerId);
  }

  createConsultation(id: string, participantPlayerIds: readonly string[]): PrivilegedConsultation {
    const participants = [...new Set(participantPlayerIds)];
    if (participants.length < 2) throw new Error('A privileged consultation requires at least two participants.');
    if (this.consultations.has(id)) throw new Error(`Consultation ${id} already exists.`);

    const consultation: PrivilegedConsultation = { id, participantPlayerIds: participants, notes: [] };
    this.consultations.set(id, consultation);
    return clone(consultation);
  }

  ensureConsultation(id: string, participantPlayerIds: readonly string[]): PrivilegedConsultation {
    const participants = [...new Set(participantPlayerIds)];
    if (participants.length < 2) throw new Error('A privileged consultation requires at least two participants.');

    const existing = this.consultations.get(id);
    if (existing) {
      const existingSet = new Set(existing.participantPlayerIds);
      const sameParticipants = existingSet.size === participants.length && participants.every((participant) => existingSet.has(participant));
      if (!sameParticipants) throw new Error(`Consultation ${id} exists with different participants.`);
      return clone(existing);
    }

    return this.createConsultation(id, participants);
  }

  appendConsultationNote(
    requesterPlayerId: string,
    consultationId: string,
    text: string,
    now = new Date(),
  ): PrivilegedConsultationNote | null {
    const consultation = this.consultations.get(consultationId);
    if (!consultation?.participantPlayerIds.includes(requesterPlayerId)) return null;

    const normalized = text.trim().slice(0, 500);
    if (!normalized) return null;

    const note: PrivilegedConsultationNote = {
      id: `${consultationId}:note:${consultation.notes.length + 1}`,
      authorPlayerId: requesterPlayerId,
      text: normalized,
      createdAt: now.toISOString(),
    };
    consultation.notes.push(note);
    return clone(note);
  }

  getConsultation(requesterPlayerId: string, consultationId: string): PrivilegedConsultation | null {
    const consultation = this.consultations.get(consultationId);
    if (!consultation?.participantPlayerIds.includes(requesterPlayerId)) return null;
    return clone(consultation);
  }

  consultationIdsForPlayer(playerId: string): string[] {
    return [...this.consultations.values()]
      .filter((consultation) => consultation.participantPlayerIds.includes(playerId))
      .map((consultation) => consultation.id);
  }

  clear(): void {
    this.briefs.clear();
    this.consultations.clear();
    this.retainedNotes.clear();
    this.retainedNotesLocked.clear();
  }
}
