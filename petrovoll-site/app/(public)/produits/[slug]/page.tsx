import type { Metadata } from 'next'
// TODO [data] : importer `notFound` de 'next/navigation' et l'appeler dès que
// la requête Payload est branchée (produit introuvable → 404 propre).
// import { notFound } from 'next/navigation'

import ProduitDetail from '@/components/produits/ProduitDetail'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * /produits/[slug] — Fiche produit
 * ────────────────────────────────────────────────────────────────────────────
 * ⚠️  Next.js 14 : `params` est SYNCHRONE (objet simple).
 *     À partir de Next.js 15, `params` devient une Promise
 *     (`await params`) → prévoir l'adaptation lors de la migration.
 *
 * TODO [data] :
 *  - [ ] Charger le produit via la Payload Local API :
 *        `const payload = await getPayload({ config })
 *         const { docs } = await payload.find({ collection: 'produits',
 *           where: { slug: { equals: slug } }, depth: 2, limit: 1 })
 *         if (!docs[0]) notFound()`
 *  - [ ] `generateStaticParams()` pour pré-générer les fiches (ISR)
 *  - [ ] JSON-LD `Product` (+ `Offer` si prix public) pour le SEO
 *  - [ ] Fil d'Ariane : Accueil / Produits / Secteur / Produit
 *  - [ ] Bloc « produits similaires » (même catégorie, hors produit courant)
 */
export const metadata: Metadata = {
  // TODO [seo] : generateMetadata() dynamique à partir du produit chargé
  // (title, description = extrait, openGraph.images = 1re image Cloudinary)
  title: 'Fiche produit',
  description: 'Détail d’un produit PETROVOLL : caractéristiques, conditionnements et disponibilité.',
}

export default function ProduitPage({ params }: { params: { slug: string } }) {
  const { slug } = params

  // TODO [data] : remplacer par la requête Payload — placeholder de garde
  const produit = null as null | Record<string, unknown>

  return (
    <div className="container py-16">
      {/* TODO [ui] : fil d'Ariane Accueil / Produits / Secteur / Produit */}
      <ProduitDetail
        // TODO [data] : passer l'objet Produit typé (types/index.ts → Produit)
        produit={null}
        slug={slug}
      />

      {!produit ? (
        <p className="mt-6 text-sm text-white/40">
          {/* Message temporaire du squelette — à supprimer après câblage data */}
          Squelette : données produit non câblées (slug « {slug} »).
          {/* TODO [data] : une fois Payload branché, appeler notFound() si le
              produit n'existe pas au lieu d'afficher ce placeholder. */}
        </p>
      ) : null}
    </div>
  )
}