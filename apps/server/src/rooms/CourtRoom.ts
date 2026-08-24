import { Client, Room } from '@colyseus/core';
import { MapSchema, Schema, type } from '@colyseus/schema';

class PlayerState extends Schema {
  @type('string') displayName = 'لاعب';
  @type('string') role = 'unassigned';
  @type('boolean') connected = true;
}

class CourtState extends Schema {
  @type('string') phase = 'lobby';
  @type('string') currentSpeakerId = '';
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}

export class CourtRoom extends Room<CourtState> {
  maxClients = 10;

  onCreate() {
    this.setState(new CourtState());

    this.onMessage('speaker:request', (client) => {
      if (!this.state.players.has(client.sessionId)) return;
      this.state.currentSpeakerId = client.sessionId;
    });
  }

  onJoin(client: Client, options: { displayName?: string }) {
    const player = new PlayerState();
    player.displayName = options.displayName?.trim().slice(0, 32) || 'لاعب';
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) player.connected = false;
  }
}
