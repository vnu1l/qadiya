import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { CourtRoom } from './rooms/CourtRoom.js';

const port = Number(process.env.PORT ?? 2567);
const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '64kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'qadiya-game-server', version: '0.1.0' });
});

const httpServer = createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer,
    pingInterval: 6_000,
    pingMaxRetries: 4,
    maxPayload: 64 * 1024,
  }),
});

gameServer.define('court', CourtRoom);

await gameServer.listen(port);
console.log(`[QADIYA] game server listening on :${port}`);
