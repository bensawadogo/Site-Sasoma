# ════════════════════════════════════════════════════════════════════════════
#  Dockerfile — image de production PETROVOLL (Next.js 14 standalone)
# ════════════════════════════════════════════════════════════════════════════
#  Build multi-étapes : l'image finale ne contient que le runtime Node + la
#  sortie `.next/standalone` (générée grâce à `output: 'standalone'`).
#
#  TODO [docker] :
#   - [ ] Passer à `node:22-alpine` (LTS) lors de la migration Next.js 15
#   - [ ] Ajouter un `HEALTHCHECK` sur /api/health (route à créer)
#   - [ ] Épingler l'image par digest en production (sécurité de la chaîne)
#   - [ ] Si Payload tourne dans cette image : prévoir une étape de migration
#         (`node node_modules/payload/bin.js migrate`) AVANT le démarrage du web
# ════════════════════════════════════════════════════════════════════════════

FROM node:20-alpine AS base
# libc6-compat : nécessaire pour certaines dépendances natives (sharp)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ── Étape 1 : dépendances ───────────────────────────────────────────────────
FROM base AS deps
# .npmrc est copié AVANT l'install : il contient `legacy-peer-deps=true`,
# indispensable car Next.js 14 ne satisfait pas la peerDependency de Payload v3.
COPY package.json package-lock.json* .npmrc ./
# `npm ci` exige un package-lock.json : généré par le premier `npm install`
# en local, il DOIT être versionné. Le repli sur `npm install` évite un échec
# de build si le lockfile n'existe pas encore (premier démarrage du projet).
RUN if [ -f package-lock.json ]; then \
      npm ci --legacy-peer-deps; \
    else \
      npm install --legacy-peer-deps; \
    fi

# ── Étape 2 : build ────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Variables d'environnement de build (les secrets ne doivent PAS être figés ici)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
# TODO [payload] : `npm run payload:generate-importmap` avant le build une fois
#                  Payload monté (Next.js 15) — l'import map doit exister.

# ── Étape 3 : runtime ──────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Utilisateur non-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Sortie standalone + assets statiques
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Dossier d'upload Payload (dev/self-hosted) — monté en volume dans compose
RUN mkdir -p /app/public/media && chown -R nextjs:nodejs /app/public/media

USER nextjs
EXPOSE 3000

# TODO [payload] : si Payload doit tourner dans ce conteneur, ajouter ici un
# script d'entrée qui lance d'abord les migrations puis `node server.js`.
CMD ["node", "server.js"]