import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'

import type { RoleUtilisateur } from '@/types'
// TODO [auth] : décommenter quand l'authentification sera câblée
// import { compare } from 'bcryptjs'
// import { db } from '@/lib/db'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * auth.ts — NextAuth.js v5 (Auth.js) — provider Credentials
 * ────────────────────────────────────────────────────────────────────────────
 * Objectif : protéger le panel admin (Payload + routes /admin) avec des rôles
 * `super-admin` / `editeur`.
 *
 * ️  Deux stratégies possibles — à TRANCHER (TODO [auth] n°1) :
 *
 *   A) Payload est la source de vérité des utilisateurs (collection `Users`) :
 *      `authorize` appelle la Payload Local API (getPayload → payload.login).
 *      → Recommandé : un seul jeu d'utilisateurs, rôles gérés côté Payload.
 *
 *   B) NextAuth gère sa propre table d'users via Prisma + bcryptjs (ci-dessous).
 *      → Plus de code à maintenir, risque de désynchronisation avec Payload.
 *
 * ️  Edge runtime : le `middleware.ts` s'exécute sur l'edge. bcryptjs et Prisma
 *     n'y fonctionnent pas → prévoir un `lib/auth.config.ts` « léger » (sans
 *     adapter ni bcrypt) importé par le middleware, et garder ce fichier-ci
 *     pour le runtime Node (route handler / server components).
 */

/* ── Typage des sessions (rôles) ─────────────────────────────────────────── */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: RoleUtilisateur
    } & DefaultSession['user']
  }

  interface User {
    role?: RoleUtilisateur
  }
}

/**
 * Vue minimale du JWT que ce fichier manipule.
 * NOTE : on évite volontairement l'augmentation du module 'next-auth/jwt' afin
 * de ne pas dépendre du chemin exact du type exporté par la version installée
 * de next-auth (v5 beta). Un cast local remplit le même rôle, sans couplage.
 */
interface JwtPetrovoll {
  id?: string
  role?: RoleUtilisateur
}

/* ── Validation du formulaire de connexion ───────────────────────────────── */
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  // Sessions JWT : indispensable avec le provider Credentials.
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 }, // 8 h (journée de travail)
  pages: {
    // TODO [auth] : créer la page de login admin dédiée (design industriel
    // noir/rouge, sans Navbar publique).
    signIn: '/admin/login',
    error: '/admin/login',
  },
  providers: [
    Credentials({
      name: 'PETROVOLL Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      /**
       * TODO [auth] : implémentation à câbler — logique attendue :
       *
       *   const parsed = credentialsSchema.safeParse(credentials)
       *   if (!parsed.success) return null
       *
       *   const user = await db.user.findUnique({ where: { email: parsed.data.email } })
       *   if (!user?.passwordHash) return null
       *
       *   const valid = await compare(parsed.data.password, user.passwordHash)
       *   if (!valid) return null
       *
       *   // TODO : rate-limiting (5 tentatives / 15 min) + journal d'audit
       *   return { id: user.id, email: user.email, name: user.name, role: user.role }
       */
      authorize: async () => {
        // Placeholder volontaire : aucun utilisateur ne peut se connecter tant
        // que le TODO ci-dessus n'est pas implémenté.
        return null
      },
    }),
  ],
  callbacks: {
    /**
     * Propage l'id et le rôle dans le JWT.
     * TODO [auth] : compléter — la logique attendue est :
     *   if (user) { jeton.id = user.id ; jeton.role = user.role }
     */
    jwt({ token, user }) {
      const jeton = token as JwtPetrovoll
      if (user) {
        const utilisateur = user as { id?: string; role?: RoleUtilisateur }
        jeton.id = utilisateur.id
        jeton.role = utilisateur.role
      }
      return token
    },
    /** Expose l'id et le rôle au front (sidebar admin, guards serveur). */
    session({ session, token }) {
      const jeton = token as JwtPetrovoll
      const sessionUtilisateur = session.user as { id?: string; role?: RoleUtilisateur }
      if (jeton.id) sessionUtilisateur.id = jeton.id
      if (jeton.role) sessionUtilisateur.role = jeton.role
      return session
    },
  },
})

/* ── Helpers de garde (à utiliser dans les server components / route handlers) */
// TODO [auth] : implémenter
// export async function requireAdmin() { const s = await auth(); if (!s) redirect('/admin/login'); return s }
// export async function requireSuperAdmin() { … }
// export function can(role, action: 'create'|'update'|'delete'|'publish') { … }

// Réexport explicite pour éviter un import inutilisé de `credentialsSchema`
// tant que `authorize` n'est pas implémenté.
export { credentialsSchema }