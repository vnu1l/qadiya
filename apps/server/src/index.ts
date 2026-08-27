import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { QADIYA_VERSION } from '@qadiya/shared';
import { CourtRoom } from './rooms/CourtRoom.js';

const port = Number(process.env.PORT ?? 2567);
const app = express();
const webDist = resolve(process.cwd(), 'apps/web/dist');
const webIndex = resolve(webDist, 'index.html');
const startedAt = new Date().toISOString();

const railwayRepository = [process.env.RAILWAY_GIT_REPO_OWNER, process.env.RAILWAY_GIT_REPO_NAME]
  .filter(Boolean)
  .join('/');

const buildInfo = Object.freeze({
  version: QADIYA_VERSION,
  platform:
    process.env.RENDER === 'true'
      ? 'render'
      : process.env.RAILWAY_ENVIRONMENT
        ? 'railway'
        : process.env.GIT_COMMIT_SHA
          ? 'ci-container'
          : 'local',
  commitSha:
    process.env.RENDER_GIT_COMMIT ??
    process.env.RAILWAY_GIT_COMMIT_SHA ??
    process.env.GIT_COMMIT_SHA ??
    'local',
  branch: process.env.RENDER_GIT_BRANCH ?? process.env.RAILWAY_GIT_BRANCH ?? 'local',
  deploymentId:
    process.env.RENDER_INSTANCE_ID ??
    process.env.RENDER_SERVICE_ID ??
    process.env.RAILWAY_DEPLOYMENT_ID ??
    'local',
  repository: (process.env.RENDER_GIT_REPO_SLUG ?? railwayRepository) || 'local',
  publicUrl: process.env.RENDER_EXTERNAL_URL ?? undefined,
  startedAt,
});

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '64kb' }));

app.get('/health', (_req, res) => {
  const frontendReady = existsSync(webIndex);
  res.status(frontendReady ? 200 : 503).json({
    ok: frontendReady,
    service: 'qadiya',
    frontendReady,
    ...buildInfo,
  });
});

app.get('/api/build', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(buildInfo);
});

app.use(
  express.static(webDist, {
    index: false,
    fallthrough: true,
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  }),
);

// SPA fallback. API/matchmaking requests are never masked by index.html.
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/matchmake')) return next();
  if (!existsSync(webIndex)) {
    return res.status(503).json({ ok: false, error: 'FRONTEND_NOT_BUILT' });
  }
  return res.sendFile(webIndex);
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
console.log(`[QADIYA] ${buildInfo.platform} ${buildInfo.commitSha.slice(0, 12)} listening on :${port}`);
