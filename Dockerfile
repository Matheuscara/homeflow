# Base stage
FROM node:22-alpine AS base

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN apk add --no-cache openssl
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client specifically for the linux/musl target if needed, 
# but usually `prisma generate` in build step handles it.
RUN npx prisma generate
RUN npm run build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

RUN apk add --no-cache openssl

# Start command (includes migration for simplicity in this dev setup, 
# though ideally migrations run in a separate release step)
CMD [  "sh", "-c", "npx prisma migrate deploy && node dist/main"]
