import { Client, Room } from '@colyseus/core';
import {
  isSessionKind,
  rulesForSession,
  type CoreRoleAllocationPlan,
  type DefenseRepresentationPlan,
  type LobbyPlayerProfile,
  type PreparationParticipant,
  type PreparationPublicSnapshot,
  type PrivatePlayerBrief,
  type RoleAllocationPublicSnapshot,
  type SessionKind,
} from '@qadiya/shared';
import { sanitizePrivateRulesPatch, sanitizeRolePreferences } from '../domain/lobbyInput';
import { PreparationCoordinator, PreparationError } from '../domain/preparationCoordinator';
import { PrivateCaseVault } from '../domain/privateCaseVault';
import { RoleAllocationCoordinator, RoleAllocationError } from '../domain/roleAllocationCoordinator';
import { applyCoreRolePlan } from '../domain/roleTransaction';
import {
  applyLobbyRulesState,
  applyPreparationSnapshot,
  applyRoleAllocationSnapshot,
  applyRolePreferencesState,
  CourtState,
  lobbyRulesFromState,
  PlayerState,
  resetPreparationState,
  resetRoleAllocationState,
} from '../state/CourtState';

function isJudge(player: PlayerState | undefined): boolean {
  return player?.role === 'judge';
}

function normalizedSessionKind(value: unknown): SessionKind {
  return isSessionKind(value) ? value : 'casual';
}

function sanitizePrivateDefensePlan(payload: unknown): DefenseRepresentationPlan[] | null {
  if (!Array.isArray(payload) || payload.length === 0 || payload.length > 12) return null;

  const result: DefenseRepresentationPlan[] = [];
  for (let index = 0; index < payload.length; index += 1) {
    const raw = payload[index];
    if (!raw || typeof raw !== 'object') return null;
    const item = raw as Record<string, unknown>;
    if (!Array.isArray(item.defendantPlayerIds) || item.defendantPlayerIds.length === 0 || item.defendantPlayerIds.length > 3) {
      return null;
    }

    const defendantPlayerIds = item.defendantPlayerIds.filter(
      (value): value is string => typeof value === 'string' && value.length > 0 && value.length <= 128,
    );
    if (defendantPlayerIds.length !== item.defendantPlayerIds.length) return null;

    const selfRepresented = item.selfRepresented === true;
    const lawyerPlayerId = typeof item.lawyerPlayerId === 'string' && item.lawyerPlayerId.length <= 128
      ? item.lawyerPlayerId
      : undefined;

    result.push({
      id: `private-defense:${index}`,
      defendantPlayerIds,
      lawyerPlayerId,
      selfRepresented,
    });
  }

  return result;
}

function sanitizeRetainedNotes(payload: unknown): string[] | null {
  if (!Array.isArray(payload) || payload.length > 10) return null;
  if (!payload.every((item) => typeof item === 'string')) return null;
  return payload as string[];
}

export class CourtRoom extends Room<CourtState> {
  maxClients = 12;
  private readonly privateCaseVault = new PrivateCaseVault();
  private roleAllocation?: RoleAllocationCoordinator;
  private preparation?: PreparationCoordinator;

  onCreate(options: { sessionKind?: unknown } = {}) {
    const rules = rulesForSession(normalizedSessionKind(options.sessionKind));
    const state = new CourtState();
    applyLobbyRulesState(state.rules, rules);
    this.maxClients = rules.maxPlayers;
    this.setState(state);

    this.onMessage('player:ready', (client, value: unknown) => {
      if (this.state.phase !== 'lobby') return;
      const player = this.state.players.get(client.sessionId);
      if (!player || typeof value !== 'boolean') return;
      player.ready = value;
    });

    // Preferences are frozen once allocation starts. Changing them mid-allocation
    // would invalidate the server-owned candidate snapshot and create race exploits.
    this.onMessage('roles:preferences', (client, payload: unknown) => {
      if (this.state.phase !== 'lobby') return;
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      applyRolePreferencesState(player, sanitizeRolePreferences(payload));
    });

    this.onMessage('private:rules', (client, payload: unknown) => {
      if (this.state.phase !== 'lobby' || this.state.rules.sessionKind !== 'private') return;
      if (this.state.hostSessionId !== client.sessionId) return;

      const current = lobbyRulesFromState(this.state.rules);
      const next = sanitizePrivateRulesPatch(current, payload);
      applyLobbyRulesState(this.state.rules, next);
    });

    // The client can only request its own private brief. The brief never lives
    // in synchronized CourtState, so browser inspection cannot reveal other players' secrets.
    this.onMessage('private:brief:request', (client) => {
      const brief = this.privateCaseVault.getOwnBrief(client.sessionId);
      if (brief) client.send('private:brief', brief);
    });

    this.onMessage('roles:judge-vote', (client, candidateSessionId: unknown) => {
      if (typeof candidateSessionId !== 'string') return;
      this.runAllocationAction(client, (coordinator) => coordinator.castJudgeVote(client.sessionId, candidateSessionId));
    });

    // Manual close is exposed only to a Private host. Casual/Ranked use a server
    // timer/policy; public clients must never decide when an election ends.
    this.onMessage('roles:judge-vote:close', (client) => {
      if (this.state.rules.sessionKind !== 'private' || this.state.hostSessionId !== client.sessionId) return;
      this.runAllocationAction(client, (coordinator) => coordinator.closeJudgeVote());
    });

    this.onMessage('roles:defense:request', (client, lawyerSessionId: unknown) => {
      if (typeof lawyerSessionId !== 'string') return;
      this.runAllocationAction(client, (coordinator) => {
        const snapshot = coordinator.proposeDefenseLawyer(client.sessionId, lawyerSessionId);
        this.clientBySessionId(lawyerSessionId)?.send('roles:defense:request', {
          defendantSessionId: client.sessionId,
        });
        return snapshot;
      });
    });

    this.onMessage('roles:defense:response', (client, payload: unknown) => {
      if (!payload || typeof payload !== 'object') return;
      const body = payload as Record<string, unknown>;
      if (typeof body.defendantSessionId !== 'string' || typeof body.accepted !== 'boolean') return;

      this.runAllocationAction(client, (coordinator) => {
        const snapshot = coordinator.respondDefenseRequest(client.sessionId, body.defendantSessionId as string, body.accepted as boolean);
        if (!body.accepted) {
          this.clientBySessionId(body.defendantSessionId as string)?.send('roles:defense:rejected', {
            lawyerSessionId: client.sessionId,
          });
        }
        return snapshot;
      });

      if (body.accepted) this.tryFinalizeDefenseChoices(client);
    });

    this.onMessage('roles:defense:self', (client) => {
      this.runAllocationAction(client, (coordinator) => coordinator.chooseSelfRepresentation(client.sessionId));
      this.tryFinalizeDefenseChoices(client);
    });

    this.onMessage('roles:defense:fallback', (client) => {
      if (this.state.rules.sessionKind !== 'private' || this.state.hostSessionId !== client.sessionId) return;
      this.runAllocationAction(client, (coordinator) => coordinator.courtAppointUnresolvedDefense());
    });

    this.onMessage('roles:private:defendants', (client, payload: unknown) => {
      if (this.state.rules.sessionKind !== 'private' || this.state.hostSessionId !== client.sessionId) return;
      if (!Array.isArray(payload) || !payload.every((value) => typeof value === 'string')) return;
      this.runAllocationAction(client, (coordinator) => coordinator.setPrivateDefendants(payload));
    });

    this.onMessage('roles:private:judge', (client, playerId: unknown) => {
      if (this.state.rules.sessionKind !== 'private' || this.state.hostSessionId !== client.sessionId) return;
      if (typeof playerId !== 'string') return;
      this.runAllocationAction(client, (coordinator) => coordinator.setPrivateJudge(playerId));
    });

    this.onMessage('roles:private:defense', (client, payload: unknown) => {
      if (this.state.rules.sessionKind !== 'private' || this.state.hostSessionId !== client.sessionId) return;
      const plan = sanitizePrivateDefensePlan(payload);
      if (!plan) {
        client.send('roles:allocation:error', { code: 'INVALID_PRIVATE_DEFENSE_PAYLOAD', message: 'Invalid private defense plan.' });
        return;
      }
      this.runAllocationAction(client, (coordinator) => coordinator.setPrivateDefenseRepresentations(plan));
    });

    this.onMessage('preparation:ready', (client, value: unknown) => {
      if (this.state.phase !== 'preparation' || typeof value !== 'boolean') return;
      this.runPreparationAction(client, (coordinator) => coordinator.markReady(client.sessionId, value));
    });

    this.onMessage('preparation:notes:set', (client, payload: unknown) => {
      if (this.state.phase !== 'preparation' || !this.preparation) return;
      const notes = sanitizeRetainedNotes(payload);
      if (!notes) {
        client.send('preparation:error', { code: 'INVALID_RETAINED_NOTES_PAYLOAD', message: 'Invalid retained notes payload.' });
        return;
      }

      try {
        const result = this.preparation.setRetainedNotes(client.sessionId, notes);
        this.syncPreparation(this.preparation.getSnapshot());
        if (result.ok) client.send('preparation:notes', { notes: result.notes, locked: false });
        else client.send('preparation:error', { code: result.code, message: result.message });
      } catch (error) {
        this.sendPreparationError(client, error);
      }
    });

    this.onMessage('preparation:notes:request', (client) => {
      const brief = this.privateCaseVault.getOwnBrief(client.sessionId);
      if (!brief) return;
      client.send('preparation:notes', {
        notes: this.privateCaseVault.getRetainedNotes(client.sessionId),
        locked: this.privateCaseVault.isRetainedNotesLocked(client.sessionId),
      });
    });

    this.onMessage('preparation:consultations:request', (client) => {
      if (!this.preparation) return;
      try {
        client.send('preparation:consultations', this.preparation.getOwnConsultations(client.sessionId));
      } catch (error) {
        this.sendPreparationError(client, error);
      }
    });

    this.onMessage('preparation:consultation:note', (client, payload: unknown) => {
      if (this.state.phase !== 'preparation' || !this.preparation || !payload || typeof payload !== 'object') return;
      const body = payload as Record<string, unknown>;
      if (typeof body.consultationId !== 'string' || typeof body.text !== 'string') return;

      try {
        const consultation = this.preparation.appendConsultationNote(
          client.sessionId,
          body.consultationId.slice(0, 160),
          body.text.slice(0, 1000),
        );
        if (!consultation) {
          client.send('preparation:error', { code: 'CONSULTATION_ACCESS_DENIED', message: 'Consultation not found or access denied.' });
          return;
        }

        for (const participantId of consultation.participantPlayerIds) {
          this.clientBySessionId(participantId)?.send('preparation:consultation', consultation);
        }
      } catch (error) {
        this.sendPreparationError(client, error);
      }
    });

    this.onMessage('preparation:open', (client, payload: unknown) => {
      if (this.state.phase !== 'preparation' || !this.preparation || !isJudge(this.state.players.get(client.sessionId))) return;
      const overrideSoftWarnings = Boolean(
        payload && typeof payload === 'object' && (payload as Record<string, unknown>).overrideSoftWarnings === true,
      );

      try {
        const result = this.preparation.attemptOpenCourt(overrideSoftWarnings);
        this.syncPreparation(this.preparation.getSnapshot());
        if (!result.opened) {
          client.send('preparation:open:blocked', result);
          return;
        }

        this.state.phase = 'opening';
        this.broadcast('preparation:opened', { byJudgeSessionId: client.sessionId });
      } catch (error) {
        this.sendPreparationError(client, error);
      }
    });

    this.onMessage('speaker:request', (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player?.connected) return;
      player.requestedFloor = true;
    });

    this.onMessage('speaker:grant', (client, targetSessionId: unknown) => {
      if (typeof targetSessionId !== 'string') return;
      const judge = this.state.players.get(client.sessionId);
      const target = this.state.players.get(targetSessionId);
      if (!isJudge(judge) || !target?.connected) return;

      this.state.currentSpeakerId = targetSessionId;
      target.requestedFloor = false;
    });

    this.onMessage('speaker:release', (client) => {
      const actor = this.state.players.get(client.sessionId);
      const actorIsCurrentSpeaker = this.state.currentSpeakerId === client.sessionId;
      if (!isJudge(actor) && !actorIsCurrentSpeaker) return;
      this.state.currentSpeakerId = '';
    });
  }

  /**
   * Server-owned integration point for the future pre-game coordinator.
   * defendantCount and defense-seat count come from validated case selection/composition,
   * never from a client message.
   */
  beginCoreRoleAllocation(defendantCount: number, requiredDefenseLawyerCount: number): RoleAllocationPublicSnapshot {
    if (this.state.phase !== 'lobby') throw new Error(`Cannot start role allocation from phase ${this.state.phase}.`);

    const coordinator = new RoleAllocationCoordinator(
      this.lobbyProfiles(),
      lobbyRulesFromState(this.state.rules),
      defendantCount,
      requiredDefenseLawyerCount,
    );
    this.roleAllocation = coordinator;
    this.state.phase = 'role-allocation';

    const snapshot = coordinator.start();
    this.syncRoleAllocation(snapshot);
    this.commitAllocationIfComplete();
    return snapshot;
  }

  /** Server timer/policy hook; public clients do not call this directly. */
  closeJudgeVote(): void {
    if (!this.roleAllocation) return;
    try {
      const snapshot = this.roleAllocation.closeJudgeVote();
      this.syncRoleAllocation(snapshot);
      this.commitAllocationIfComplete();
    } catch (error) {
      this.broadcastAllocationError(error);
    }
  }

  /** Server timeout/recovery hook when defendant choice stalls or all requested lawyers refuse. */
  courtAppointUnresolvedDefense(): void {
    if (!this.roleAllocation) return;
    try {
      const snapshot = this.roleAllocation.courtAppointUnresolvedDefense();
      this.syncRoleAllocation(snapshot);
      this.commitAllocationIfComplete();
    } catch (error) {
      this.broadcastAllocationError(error);
    }
  }

  /** Server-side integration point for Case Composer/Preparation. */
  setPrivateBriefForSession(sessionId: string, brief: PrivatePlayerBrief): void {
    const player = this.state.players.get(sessionId);
    if (!player) throw new Error(`Unknown room session ${sessionId}.`);
    if (player.role !== 'unassigned' && player.role !== brief.role) {
      throw new Error(`Private brief role ${brief.role} does not match assigned role ${player.role}.`);
    }

    this.privateCaseVault.setPlayerBrief(sessionId, brief);
    if (this.preparation && this.state.phase === 'preparation') {
      this.syncPreparation(this.preparation.refresh());
    }
  }

  onJoin(client: Client, options: { displayName?: unknown }) {
    const player = new PlayerState();
    player.displayName =
      typeof options.displayName === 'string' && options.displayName.trim()
        ? options.displayName.trim().slice(0, 32)
        : 'لاعب';

    this.state.players.set(client.sessionId, player);

    if (this.state.rules.sessionKind === 'private' && !this.state.hostSessionId) {
      this.state.hostSessionId = client.sessionId;
    }
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    player.connected = false;
    player.ready = false;
    player.requestedFloor = false;
    if (this.state.currentSpeakerId === client.sessionId) this.state.currentSpeakerId = '';

    if (this.state.phase === 'role-allocation') {
      this.cancelRoleAllocation('player-disconnected');
    } else if (this.state.phase === 'preparation' && this.preparation) {
      this.syncPreparation(this.preparation.refresh());
    }

    if (this.state.hostSessionId === client.sessionId) {
      const nextHost = [...this.state.players.entries()].find(
        ([sessionId, candidate]) => sessionId !== client.sessionId && candidate.connected,
      );
      this.state.hostSessionId = nextHost?.[0] ?? '';
    }
  }

  onDispose() {
    this.privateCaseVault.clear();
    this.roleAllocation = undefined;
    this.preparation = undefined;
  }

  private lobbyProfiles(): LobbyPlayerProfile[] {
    return [...this.state.players.entries()].map(([sessionId, player]) => ({
      playerId: sessionId,
      displayName: player.displayName,
      connected: player.connected,
      ready: player.ready,
      rolePreferences: [...player.rolePreferences.values()].map((preference) => ({
        role: preference.role,
        accepted: preference.accepted,
        priority: preference.priority,
        allowAutomaticAssignment: preference.allowAutomaticAssignment,
      })),
      // History is deliberately server-owned. Persistence will populate this later;
      // it is never accepted from a room client.
      roleHistory: [],
    }));
  }

  private runAllocationAction(
    client: Client,
    action: (coordinator: RoleAllocationCoordinator) => RoleAllocationPublicSnapshot,
  ): void {
    if (this.state.phase !== 'role-allocation' || !this.roleAllocation) return;
    try {
      const snapshot = action(this.roleAllocation);
      this.syncRoleAllocation(snapshot);
      this.commitAllocationIfComplete();
    } catch (error) {
      this.sendAllocationError(client, error);
    }
  }

  private tryFinalizeDefenseChoices(client: Client): void {
    if (!this.roleAllocation || this.state.roleAllocation.stage !== 'awaiting-defense-choice') return;
    try {
      const snapshot = this.roleAllocation.finalizeDefenseChoices();
      this.syncRoleAllocation(snapshot);
      this.commitAllocationIfComplete();
    } catch (error) {
      if (error instanceof RoleAllocationError && ['DEFENSE_CHOICE_INCOMPLETE', 'DEFENSE_REQUEST_PENDING'].includes(error.code)) {
        return;
      }
      this.sendAllocationError(client, error);
    }
  }

  private syncRoleAllocation(snapshot: RoleAllocationPublicSnapshot): void {
    applyRoleAllocationSnapshot(this.state.roleAllocation, snapshot);
  }

  private commitAllocationIfComplete(): void {
    const plan = this.roleAllocation?.getCompletedPlan();
    if (!plan) return;

    const issues = applyCoreRolePlan(this.state, plan, lobbyRulesFromState(this.state.rules));
    if (issues.length > 0) {
      this.broadcast('roles:allocation:failed', { issues });
      this.cancelRoleAllocation('atomic-validation-failed');
      return;
    }

    this.startPreparation(plan);
    this.broadcast('roles:allocation:complete', {
      judgeSessionId: plan.judgePlayerId,
      prosecutionSessionId: plan.prosecutionPlayerId,
      defendantSessionIds: plan.defendantPlayerIds,
    });
    this.roleAllocation = undefined;
  }

  private startPreparation(plan: CoreRoleAllocationPlan): void {
    const participants = new Map<string, PreparationParticipant>();
    const add = (playerId: string, role: PreparationParticipant['role']) => {
      participants.set(playerId, { playerId, role, requiredForOpening: true });
    };

    add(plan.judgePlayerId, 'judge');
    add(plan.prosecutionPlayerId, 'prosecution');
    for (const defendantId of plan.defendantPlayerIds) add(defendantId, 'defendant');
    for (const representation of plan.defenseRepresentations) {
      if (representation.lawyerPlayerId) add(representation.lawyerPlayerId, 'defense');
    }

    resetPreparationState(this.state.preparation);
    this.preparation = new PreparationCoordinator({
      participants: [...participants.values()],
      defenseRepresentations: plan.defenseRepresentations,
      vault: this.privateCaseVault,
      isConnected: (playerId) => this.state.players.get(playerId)?.connected === true,
    });
    this.syncPreparation(this.preparation.start());
  }

  private syncPreparation(snapshot: PreparationPublicSnapshot): void {
    applyPreparationSnapshot(this.state.preparation, snapshot);
  }

  private runPreparationAction(
    client: Client,
    action: (coordinator: PreparationCoordinator) => PreparationPublicSnapshot,
  ): void {
    if (this.state.phase !== 'preparation' || !this.preparation) return;
    try {
      this.syncPreparation(action(this.preparation));
    } catch (error) {
      this.sendPreparationError(client, error);
    }
  }

  private cancelRoleAllocation(reason: string): void {
    this.roleAllocation = undefined;
    this.preparation = undefined;
    this.state.phase = 'lobby';
    this.state.currentSpeakerId = '';
    this.state.defenseRepresentations.clear();
    resetRoleAllocationState(this.state.roleAllocation);
    resetPreparationState(this.state.preparation);

    for (const candidate of this.state.players.values()) {
      candidate.role = 'unassigned';
      candidate.ready = false;
      candidate.requestedFloor = false;
    }

    this.broadcast('roles:allocation:cancelled', { reason });
  }

  private clientBySessionId(sessionId: string): Client | undefined {
    return this.clients.find((client) => client.sessionId === sessionId);
  }

  private sendAllocationError(client: Client, error: unknown): void {
    if (error instanceof RoleAllocationError) {
      client.send('roles:allocation:error', { code: error.code, message: error.message });
      return;
    }
    client.send('roles:allocation:error', { code: 'ROLE_ALLOCATION_INTERNAL', message: 'Role allocation could not continue.' });
  }

  private broadcastAllocationError(error: unknown): void {
    if (error instanceof RoleAllocationError) {
      this.broadcast('roles:allocation:error', { code: error.code, message: error.message });
      return;
    }
    this.broadcast('roles:allocation:error', { code: 'ROLE_ALLOCATION_INTERNAL', message: 'Role allocation could not continue.' });
  }

  private sendPreparationError(client: Client, error: unknown): void {
    if (error instanceof PreparationError) {
      client.send('preparation:error', { code: error.code, message: error.message });
      return;
    }
    client.send('preparation:error', { code: 'PREPARATION_INTERNAL', message: 'Preparation action could not continue.' });
  }
}
