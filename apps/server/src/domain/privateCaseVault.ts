import type { PrivatePlayerBrief, PrivilegedConsultation, PrivilegedConsultationNote } from '@qadiya/shared';

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class PrivateCaseVault {
  private readonly briefs = new Map<string, PrivatePlayerBrief>();
  private readonly consultations = new Map<string, PrivilegedConsultation>();

  setPlayerBrief(playerId: string, brief: PrivatePlayerBrief): void {
    if (brief.playerId !== playerId) throw new Error('Private brief playerId must match the vault key.');
    this.briefs.set(playerId, clone(brief));
  }

  getOwnBrief(requesterPlayerId: string): PrivatePlayerBrief | null {
    const brief = this.briefs.get(requesterPlayerId);
    return brief ? clone(brief) : null;
  }

  createConsultation(id: string, participantPlayerIds: readonly string[]): PrivilegedConsultation {
    const participants = [...new Set(participantPlayerIds)];
    if (participants.length < 2) throw new Error('A privileged consultation requires at least two participants.');
    if (this.consultations.has(id)) throw new Error(`Consultation ${id} already exists.`);

    const consultation: PrivilegedConsultation = { id, participantPlayerIds: participants, notes: [] };
    this.consultations.set(id, consultation);
    return clone(consultation);
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

  clear(): void {
    this.briefs.clear();
    this.consultations.clear();
  }
}
