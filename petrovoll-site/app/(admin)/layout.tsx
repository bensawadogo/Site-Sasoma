import type { Metadata } from 'next'
import type { ReactNode } from 'react'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * app/(admin)/layout.tsx — Layout du panel d'administration
 * ────────────────────────────────────────────────────────────────────────────
 * Route group `(admin)` → n'apparaît pas dans l'URL (l'admin vit sous /admin).
 *
 * ⚠️  DOUBLE PROTECTION RECOMMANDÉE :
 *   1. `middleware.ts` (matcher /admin/:path*) → redirige les anonymes
 *   2. ce layout → garde serveur (défense en profondeur)
 *
 * TODO [auth] :
 *  - [ ] Décommenter la garde ci-dessous une fois NextAuth câblé :
 *        const session = await auth()
 *        if (!session) redirect('/admin/login')
 *  - [ ] Vérifier le rôle pour les sections sensibles (utilisateurs, paramètres)
 *  - [ ] Injecter un contexte de session pour la sidebar admin
 *  - [ ] Éviter d'appliquer le Navbar/Footer publics à l'admin (layout séparé)
 */
export const metadata: Metadata = {
  title: 'Administration PETROVOLL',
  // L'admin ne doit JAMAIS être indexé
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  // TODO [auth] : garde serveur — décommenter après configuration de NextAuth
  // const session = await auth()
  // if (!session) redirect('/admin/login')

  return (
    <div className="min-h-dvh bg-ink-950 text-white">
      {/*
        TODO [ui] : structure du panel
         - [ ] Sidebar collapsible (Produits, Secteurs, Catégories, Médias, Utilisateurs)
         - [ ] Barre supérieure : utilisateur connecté, rôle, déconnexion
         - [ ] Fil d'Ariane admin
        NOTE : le panel natif de Payload v3 (monté sous /admin) fournit déjà tout
        cela gratuitement — ne construire une UI custom QUE si le client l'exige.
      */}
      {children}
    </div>
  )
}