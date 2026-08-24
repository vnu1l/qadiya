import { Client, Room } from '@colyseus/core';
import { isSessionKind, rulesForSession, type SessionKind } from '@qadiya/shared';
import { sanitizePrivateRulesPatch, sanitizeRolePreferences } from '../domain/lobbyInput';
import {
  applyLobbyRulesState,
  applyRolePreferencesState,
  CourtState,
  lobbyRulesFromState,
  PlayerState,
} from '../state/CourtState';

function isJudge(player: PlayerState | undefined): boolean {
  return player?.role === 'judge';
}

function normalizedSessionKind(value: unknown): SessionKind {
  return isSessionKind(value) ? value : 'casual';
}

export class CourtRoom extends Room<CourtState> {
  maxClients = 12;

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

    this.onMessage('roles:preferences', (client, payload: unknown) => {
      if (this.state.phase !== 'lobby' && this.state.phase !== 'role-allocation') return;
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

    if (this.state.hostSessionId === client.sessionId) {
      const nextHost = [...this.state.players.entries()].find(
        ([sessionId, candidate]) => sessionId !== client.sessionId && candidate.connected,
      );
      this.state.hostSessionId = nextHost?.[0] ?? '';
    }
  }
}
