import type {
  DefenseRepresentationPlan,
  PreparationOpenResult,
  PreparationParticipant,
  PreparationPublicSnapshot,
  PreparationReadiness,
  PrivilegedConsultation,
} from '@qadiya/shared';
import { PrivateCaseVault, type RetainedNotesUpdateResult } from './privateCaseVault.js';

export class PreparationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'PreparationError';
  }
}

export interface PreparationCoordinatorOptions {
  participants: readonly PreparationParticipant[];
  defenseRepresentations: readonly DefenseRepresentationPlan[];
  vault: PrivateCaseVault;
  isConnected: (playerId: string) => boolean;
}

/**
 * Coordinates pre-trial readiness without turning preparation into a rigid
 * wizard. Missing required people/briefs are hard blockers; readiness itself
 * is deliberately a soft warning so a forgotten button cannot deadlock a case.
 */
export class PreparationCoordinator {
  private stage: 'inactive' | 'active' | 'ready-to-open' | 'complete' = 'inactive';
  private readonly participants = new Map<string, PreparationParticipant>();
  private readonly readyPlayerIds = new Set<string>();
  private readonly defenseRepresentations: DefenseRepresentationPlan[];
  private readonly vault: PrivateCaseVault;
  private readonly isConnected: (playerId: string) => boolean;

  constructor(options: PreparationCoordinatorOptions) {
    if (options.participants.length === 0) {
      throw new PreparationError('PREPARATION_HAS_NO_PARTICIPANTS', 'Preparation requires at least one participant.');
    }

    for (const participant of options.participants) {
      if (this.participants.has(participant.playerId)) {
        throw new PreparationError('PREPARATION_DUPLICATE_PARTICIPANT', `Participant ${participant.playerId} appears more than once.`);
      }
      this.participants.set(participant.playerId, { ...participant });
    }

    this.defenseRepresentations = options.defenseRepresentations.map((representation) => ({
      ...representation,
      defendantPlayerIds: [...representation.defendantPlayerIds],
    }));
    this.vault = options.vault;
    this.isConnected = options.isConnected;
    this.validateDefenseParticipants();
  }

  start(): PreparationPublicSnapshot {
    if (this.stage !== 'inactive') {
      throw new PreparationError('PREPARATION_ALREADY_STARTED', 'Preparation has already started.');
    }

    for (const representation of this.defenseRepresentations) {
      if (representation.selfRepresented || !representation.lawyerPlayerId) continue;
      this.vault.ensureConsultation(
        `defense:${representation.id}`,
        [representation.lawyerPlayerId, ...representation.defendantPlayerIds],
      );
    }

    this.stage = 'active';
    this.refreshStage();
    return this.getSnapshot();
  }

  getSnapshot(): PreparationPublicSnapshot {
    const readiness = this.getReadiness();
    return {
      stage: this.stage,
      participantPlayerIds: [...this.participants.keys()],
      readyPlayerIds: [...this.readyPlayerIds],
      hardBlockerCount: readiness.hardBlockers.length,
      warningCount: readiness.warnings.length,
    };
  }

  getReadiness(): PreparationReadiness {
    const hardBlockers: PreparationReadiness['hardBlockers'] = [];
    const warnings: PreparationReadiness['warnings'] = [];

    for (const participant of this.participants.values()) {
      const connected = this.isConnected(participant.playerId);
      const hasBrief = this.vault.hasBrief(participant.playerId);

      if (!connected) {
        const issue = {
          code: participant.requiredForOpening ? 'REQUIRED_PARTICIPANT_DISCONNECTED' : 'OPTIONAL_PARTICIPANT_DISCONNECTED',
          message: `${participant.playerId} is disconnected during preparation.`,
          playerId: participant.playerId,
        };
        (participant.requiredForOpening ? hardBlockers : warnings).push(issue);
      }

      if (!hasBrief) {
        const issue = {
          code: participant.requiredForOpening ? 'REQUIRED_PRIVATE_BRIEF_MISSING' : 'OPTIONAL_PRIVATE_BRIEF_MISSING',
          message: `${participant.playerId} does not have a private role brief yet.`,
          playerId: participant.playerId,
        };
        (participant.requiredForOpening ? hardBlockers : warnings).push(issue);
      }

      if (connected && hasBrief && !this.readyPlayerIds.has(participant.playerId)) {
        warnings.push({
          code: 'PARTICIPANT_NOT_READY',
          message: `${participant.playerId} has not marked preparation ready.`,
          playerId: participant.playerId,
        });
      }
    }

    return { hardBlockers, warnings };
  }

  markReady(playerId: string, ready: boolean): PreparationPublicSnapshot {
    this.requireMutable();
    this.requireParticipant(playerId);

    if (ready) this.readyPlayerIds.add(playerId);
    else this.readyPlayerIds.delete(playerId);
    this.refreshStage();
    return this.getSnapshot();
  }

  setRetainedNotes(playerId: string, notes: readonly string[]): RetainedNotesUpdateResult {
    this.requireMutable();
    this.requireParticipant(playerId);
    const result = this.vault.setRetainedNotes(playerId, notes);
    this.refreshStage();
    return result;
  }

  getOwnRetainedNotes(playerId: string): string[] {
    this.requireParticipant(playerId);
    return this.vault.getRetainedNotes(playerId);
  }

  getOwnConsultations(playerId: string): PrivilegedConsultation[] {
    this.requireParticipant(playerId);
    return this.vault
      .consultationIdsForPlayer(playerId)
      .map((id) => this.vault.getConsultation(playerId, id))
      .filter((consultation): consultation is PrivilegedConsultation => consultation !== null);
  }

  appendConsultationNote(playerId: string, consultationId: string, text: string): PrivilegedConsultation | null {
    this.requireMutable();
    this.requireParticipant(playerId);
    const note = this.vault.appendConsultationNote(playerId, consultationId, text);
    if (!note) return null;
    return this.vault.getConsultation(playerId, consultationId);
  }

  attemptOpenCourt(overrideSoftWarnings = false): PreparationOpenResult {
    this.requireMutable();
    const readiness = this.getReadiness();

    if (readiness.hardBlockers.length > 0) {
      this.refreshStage();
      return { opened: false, readiness, requiresSoftOverride: false };
    }

    if (readiness.warnings.length > 0 && !overrideSoftWarnings) {
      this.refreshStage();
      return { opened: false, readiness, requiresSoftOverride: true };
    }

    this.vault.lockRetainedNotes([...this.participants.keys()]);
    this.stage = 'complete';
    return { opened: true, readiness, requiresSoftOverride: false };
  }

  refresh(): PreparationPublicSnapshot {
    if (this.stage !== 'complete') this.refreshStage();
    return this.getSnapshot();
  }

  private refreshStage(): void {
    if (this.stage === 'inactive' || this.stage === 'complete') return;
    this.stage = this.getReadiness().hardBlockers.length === 0 ? 'ready-to-open' : 'active';
  }

  private validateDefenseParticipants(): void {
    for (const representation of this.defenseRepresentations) {
      for (const defendantId of representation.defendantPlayerIds) this.requireParticipant(defendantId);
      if (representation.lawyerPlayerId) this.requireParticipant(representation.lawyerPlayerId);
    }
  }

  private requireParticipant(playerId: string): PreparationParticipant {
    const participant = this.participants.get(playerId);
    if (!participant) {
      throw new PreparationError('NOT_PREPARATION_PARTICIPANT', `${playerId} is not a preparation participant.`);
    }
    return participant;
  }

  private requireMutable(): void {
    if (this.stage === 'inactive') {
      throw new PreparationError('PREPARATION_NOT_STARTED', 'Preparation has not started yet.');
    }
    if (this.stage === 'complete') {
      throw new PreparationError('PREPARATION_ALREADY_COMPLETE', 'Preparation is already complete.');
    }
  }
}
