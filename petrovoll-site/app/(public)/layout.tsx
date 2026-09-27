import type { ReactNode } from 'react'

import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * app/(public)/layout.tsx — Layout du site vitrine
 * ────────────────────────────────────────────────────────────────────────────
 * Le route group `(public)` n'apparaît PAS dans l'URL : il sert uniquement à
 * isoler le site public du panel admin (`app/(admin)`).
 *
 * Structure :
 *   Navbar (sticky, glassmorphism au scroll)
 *     └── <main> contenu de la page
 *   Footer
 *
 * TODO [layout] :
 *  - [ ] Ajouter un fil d'Ariane (breadcrumb) conditionnel selon la route
 *  - [ ] Ajouter un bouton « devis » flottant (WhatsApp/mobile) pour le B2B
 *  - [ ] Footer : coordonnées réelles, mentions légales, RCCM/IFU (obligatoire
 *        en Afrique de l'Ouest), politique de confidentialité
 */
export default function PublicLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <div className="flex min-h-dvh flex-col bg-ink-900">
      <Navbar />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>
  )
}