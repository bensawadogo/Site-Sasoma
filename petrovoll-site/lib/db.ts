import { PrismaClient } from '@prisma/client'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * db.ts — Client Prisma singleton
 * ────────────────────────────────────────────────────────────────────────────
 * En développement, Next.js recharge les modules à chaud : sans singleton on
 * ouvrirait une nouvelle connexion à chaque HMR jusqu'à saturer PostgreSQL.
 *
 * ⚠️  `@prisma/client` est généré par `npm run prisma:generate`.
 *     Le typecheck échouera tant que la commande n'a pas été lancée.
 *
 * TODO [db] :
 *  - [ ] Lancer `npm run prisma:generate` après `npm install`
 *  - [ ] Exposer des helpers typés (getProduitBySlug, getSecteursActifs…)
 *        OU choisir la Payload Local API comme unique source de vérité
 *        (recommandé : éviter de dupliquer la logique d'accès aux données)
 *  - [ ] Ajouter un middleware Prisma de soft-delete si besoin métier
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

export default db