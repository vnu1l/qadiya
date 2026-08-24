# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/server/package.json apps/server/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/case-engine/package.json packages/case-engine/package.json
# One-time bootstrap: the repository was created without its lockfile. pnpm generates
# the canonical lock during this build; the running preview exposes it temporarily
# so it can be committed and this stage can return to --frozen-lockfile.
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/server/package.json apps/server/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/case-engine/package.json packages/case-engine/package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/apps/web/dist apps/web/dist
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/case-engine/dist packages/case-engine/dist

USER node
EXPOSE 2567
CMD ["node", "apps/server/dist/index.js"]
