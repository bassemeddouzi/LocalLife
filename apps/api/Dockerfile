# LocalLife API — Railway / Docker
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
RUN pnpm install --filter @locallife/api... --frozen-lockfile

FROM deps AS build
COPY apps/api apps/api
COPY packages/shared-types packages/shared-types
WORKDIR /app/apps/api
RUN pnpm exec prisma generate
RUN pnpm run build && test -f dist/main.js

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["pnpm", "run", "start:migrate"]
