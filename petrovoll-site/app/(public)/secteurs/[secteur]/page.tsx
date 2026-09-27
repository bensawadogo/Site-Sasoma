import type { Metadata } from 'next'

import SecteurDetail from '@/components/produits/SecteurDetail'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * /secteurs/[secteur] — Page d'un secteur d'activité
 * ────────────────────────────────────────────────────────────────────────────
 * Valeurs attendues du paramètre (slug du secteur) :
 *   lubrifiants · transport-logistique · distribution-import-export
 *   pneumatiques · fournitures-bureau
 *
 * ⚠️  Next.js 14 : `params` synchrone (voir TODO migration Next 15 sur la fiche
 *     produit app/(public)/produits/[slug]/page.tsx).
 *
 * Contenu de la page (à brancher) :
 *   1. Bandeau visuel du secteur (imageIllustration + couleur d'accent)
 *   2. Présentation du métier (richText)
 *   3. Grille des produits rattachés à ce secteur
 *   4. CTA devis spécifique au secteur
 *
 * TODO [data] :
 *  - [ ] payload.find({ collection: 'secteurs', where: { slug: { equals } } })
 *  - [ ] 404 via notFound() si le slug n'existe pas
 *  - [ ] generateStaticParams() avec les 5 slugs (ISR)
 *  - [ ] `notFound()` pour tout slug inconnu (ex. /secteurs/nimporte-quoi)
 *  - [ ] generateMetadata() dynamique (title = nom du secteur)
 */
export const metadata: Metadata = {
  title: 'Secteur d’activité',
  description:
    'Découvrez nos activités : huiles moteur et lubrifiants PETROVOLL, transport & logistique, distribution et import-export, pneumatiques, fournitures de bureau.',
}

export default function SecteurPage({ params }: { params: { secteur: string } }) {
  const { secteur } = params

  return (
    <div className="container py-16">
      {/* TODO [ui] : ce composant est à créer dans components/produits/ */}
      <SecteurDetail
        // TODO [data] : passer l'objet Secteur typé (types/index.ts → Secteur)
        secteur={null}
        slug={secteur}
      />

      <p className="mt-6 text-sm text-white/40">
        {/* Message temporaire du squelette — à supprimer après câblage data */}
        Squelette : secteur « {secteur} » — données non câblées.
      </p>
    </div>
  )
}