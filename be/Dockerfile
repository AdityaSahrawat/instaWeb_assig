FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma Client
RUN pnpm prisma:generate

# Build project
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built files and dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

EXPOSE 4000

CMD ["pnpm", "start"]
