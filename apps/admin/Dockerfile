# LocalLife Admin / Portals — Railway / Docker
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/admin/package.json apps/admin/
RUN pnpm install --filter @locallife/admin... --frozen-lockfile
COPY apps/admin apps/admin
WORKDIR /app/apps/admin
# Build-time Vite vars (set on Railway Admin service → Redeploy)
ARG VITE_API_URL=https://locallife-production.up.railway.app
ARG VITE_MAPBOX_TOKEN=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
RUN pnpm run build && test -f dist/index.html

FROM nginx:1.27-alpine
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
ENV PORT=80
EXPOSE 80
# Railway injects PORT — rewrite nginx listen before start
CMD ["/bin/sh", "-c", "sed -i \"s/listen 80;/listen ${PORT};/\" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
