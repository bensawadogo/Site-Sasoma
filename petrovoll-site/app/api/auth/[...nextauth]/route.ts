import { handlers } from '@/lib/auth'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * app/api/auth/[...nextauth]/route.ts
 * ────────────────────────────────────────────────────────────────────────────
 * NextAuth.js v5 (Auth.js) expose ses handlers sous forme de fonctions GET/POST.
 * Le re-export direct ci-dessous est la convention officielle v5 :
 *
 *   export const { GET, POST } = handlers
 *
 * Routes fournies automatiquement :
 *   GET/POST /api/auth/signin         — formulaire / déclenchement de connexion
 *   GET/POST /api/auth/callback/*     — retours du provider Credentials
 *   POST     /api/auth/signout        — déconnexion
 *   GET      /api/auth/session        — session courante (JSON)
 *   GET      /api/auth/csrf           — jeton CSRF
 *
 * TODO [auth] :
 *  - [ ] Vérifier que AUTH_SECRET est bien défini en production (sinon NextAuth
 *        refuse de démarrer / invalide les sessions à chaque redéploiement)
 *  - [ ] Ajouter des providers supplémentaires si nécessaire (Google Workspace
 *        pour les comptes internes du groupe)
 *  - [ ] `export const runtime = 'nodejs'` explicite si un provider utilise
 *        Prisma/bcrypt (non compatibles edge)
 */
export const { GET, POST } = handlers