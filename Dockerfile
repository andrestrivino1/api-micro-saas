# syntax = docker/dockerfile:1
# Multi-stage build for NestJS + TypeORM on Fly.io
#
# Stage `deps`:    install all deps (incl. dev) needed to compile TypeScript.
# Stage `build`:   produce dist/ with `nest build`.
# Stage `runtime`: slim image with only prod deps + dist/.

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main"]
