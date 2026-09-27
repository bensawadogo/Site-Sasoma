import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * middleware.ts — Protection des routes d'administration
 * ────────────────────────────────────────────────────────────────────────────
 * Le matcher ci-dessous limite l'exécution du middleware à /admin (panel Payload
 * + éventuelles pages admin custom). Aucune autre route n'est impactée : le site
 * public reste entièrement statique/cacheable.
 *
 * ⚠️  CONTRAINTE IMPORTANTE — EDGE RUNTIME
 *     Le middleware s'exécute sur l'edge : Prisma, bcryptjs et `node:*` n'y sont
 *     pas disponibles. Le jour où `lib/auth.ts` importera la base de données,
 *     il faudra SPLITTER la configuration :
 *
 *       lib/auth.config.ts  → options sans adapter (callbacks, pages, providers
 *                             « legacy ») — importable par le middleware
 *       lib/auth.ts         → auth.config + Prisma/bcrypt (runtime Node only)
 *
 *     Référence : la doc NextAuth v5 recommande ce découpage pour l'Edge
 *     Compatibility.
 *
 * TODO [auth] :
 *  - [ ] Décommenter la vérification de session dès que le provider est câblé
 *  - [ ] Rediriger vers /admin/login en conservant la destination :
 *        `/admin/login?callbackUrl=${encodeURIComponent(req.nextUrl.pathname)}`
 *  - [ ] Vérifier le rôle pour les sous-routes sensibles
 *        (ex. /admin/collections/users réservé au super-admin)
 *  - [ ] Laisser passer les assets du panel Payload (importMap, css, favicons)
 *  - [ ] Ne PAS protéger les routes /api/auth/** (sinon boucle de redirection)
 */
export default auth((req) => {
  // req.auth contient la session décodée par NextAuth v5
  const session = req.auth

  if (!session) {
    // TODO [auth] : décommenter après câblage du provider Credentials
    // const loginUrl = new URL('/admin/login', req.nextUrl.origin)
    // loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    // return NextResponse.redirect(loginUrl)

    // Comportement actuel du squelette : on laisse passer (aucune donnée réelle
    // n'est exposée tant que Payload n'est pas monté).
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  /**
   * Routes concernées par la protection admin.
   * NOTE : /admin et /admin/<tout> sont couverts ; /api/auth/** est exclu.
   */
  matcher: ['/admin', '/admin/:path*'],
}