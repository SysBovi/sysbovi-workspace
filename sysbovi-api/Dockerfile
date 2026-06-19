# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# bcrypt e outros módulos nativos precisam de ferramentas de compilação
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Remove devDependencies, mantendo node_modules com módulos nativos já compilados
RUN npm prune --omit=dev

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copia apenas o necessário para produção
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Usuário sem privilégios de root
USER node

EXPOSE 3001

CMD ["node", "dist/main"]
