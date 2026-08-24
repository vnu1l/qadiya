import { Client, Room } from '@colyseus/core';
import { MapSchema, Schema, type } from '@colyseus/schema';
import type { CourtPhase, PlayerRole } from '@qadiya/shared';

class PlayerState extends Schema {
  @type('string') displayName = 'لاعب';
  @type('string') role: PlayerRole = 'unassigned';
  @type('boolean') connected = true;
  @type('boolean') requestedFloor = false;
}

class CourtState extends Schema {
  @type('string') phase: CourtPhase = 'lobby';
  @type('string') currentSpeakerId = '';
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}

function isJudge(player: PlayerState | undefined): boolean {
  return player?.role === 'judge';
}

export class CourtRoom extends Room<CourtState> {
  maxClients = 10;

  onCreate() {
    this.setState(new CourtState());

    // Requesting the floor never grants speaking authority by itself.
    this.onMessage('speaker:request', (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player?.connected) return;
      player.requestedFloor = true;
    });

    // Only the assigned judge can make another player the official speaker.
    this.onMessage('speaker:grant', (client, targetSessionId: string) => {
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

  onJoin(client: Client, options: { displayName?: string }) {
    const player = new PlayerState();
    player.displayName = options.displayName?.trim().slice(0, 32) || 'لاعب';
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    player.connected = false;
    player.requestedFloor = false;
    if (this.state.currentSpeakerId === client.sessionId) this.state.currentSpeakerId = '';
  }
}
