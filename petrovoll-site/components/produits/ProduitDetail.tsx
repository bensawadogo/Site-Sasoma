import Link from 'next/link'

import type { Produit } from '@/types'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ProduitDetail — contenu de la fiche produit (/produits/[slug])
 * ────────────────────────────────────────────────────────────────────────────
 * Structure cible :
 *   1. Galerie d'images (jusqu'à 5 visuels, miniatures cliquables)
 *   2. Informations clés : nom, marque PETROVOLL, référence commerciale,
 *      disponibilité, secteur/catégorie
 *   3. Description riche (richText Payload → rendu `prose prose-invert`)
 *   4. Bloc « Demander un devis » (formulaire court ou lien /contact pré-rempli)
 *   5. Produits similaires (même catégorie) — TODO [ui]
 *
 * TODO [ui] :
 *  - [ ] Galerie interactive (client component) : image principale + miniatures,
 *        préchargement de la suivante, zoom optionnel
 *  - [ ] Rendu du richText : convertir l'AST Lexical en React
 *        (`@payloadcms/richtext-lexical/react` → <RichText content={…} />)
 *  - [ ] Ajouter les caractéristiques techniques en tableau (viscosité,
 *        normes API/ACEA, conditionnement) une fois les données fournies
 *  - [ ] Téléchargement de la fiche technique PDF si fournie
 *  - [ ] Bouton WhatsApp contextualisé avec la référence du produit
 *  - [ ] JSON-LD Product (SEO) + fil d'Ariane
 *  - [ ] 404 propre si le produit n'existe pas (notFound())
 */
export interface ProduitDetailProps {
  /** Produit chargé côté serveur. Null tant que la data n'est pas branchée. */
  produit: Produit | null
  /** Slug demandé (utilisé pour l'affichage temporaire du squelette). */
  slug: string
}

export default function ProduitDetail({ produit, slug }: ProduitDetailProps) {
  // ── Placeholder : la data n'est pas encore branchée ───────────────────────
  if (!produit) {
    return (
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-lg border border-white/10 bg-white/[0.02]">
          <span className="font-display text-4xl tracking-industrial text-white/10">
            PETROVOLL
          </span>
        </div>

        <div>
          <p className="font-display text-sm tracking-industrial text-brand-500">FICHE PRODUIT</p>
          <h1 className="mt-4 text-4xl text-white md:text-5xl">Produit « {slug} »</h1>
          <p className="mt-6 max-w-xl text-sm text-white/50">
            {/* TODO [data] : remplacer tout ce bloc par le rendu réel du produit */}
            Contenu non câblé. Brancher la Payload Local API dans
            app/(public)/produits/[slug]/page.tsx pour alimenter cette fiche
            (galerie, référence, description riche, disponibilité).
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="rounded-sm bg-brand-500 px-7 py-3.5 text-sm font-semibold uppercase tracking-industrial text-white transition-colors hover:bg-brand-600"
            >
              Demander un devis
            </Link>
            <Link
              href="/produits"
              className="rounded-sm border border-white/20 px-7 py-3.5 text-sm font-semibold uppercase tracking-industrial text-white transition-colors hover:border-gold-400 hover:text-gold-400"
            >
              Retour au catalogue
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Rendu avec data réelle (à compléter) ─────────────────────────────────
  return (
    <div className="grid gap-12 lg:grid-cols-2">
      {/* TODO [ui] : galerie d'images (jusqu'à produit.images.length = 5) */}
      <div className="aspect-square rounded-lg border border-white/10 bg-white/[0.02]" />

      <div>
        <p className="font-display text-sm tracking-industrial text-brand-500">
          {produit.marque ?? 'PETROVOLL'}
        </p>
        <h1 className="mt-4 text-4xl text-white md:text-5xl">{produit.nom}</h1>

        <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-white/10 py-6">
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/40">Référence</dt>
            <dd className="mt-1 text-sm text-white/90">{produit.references ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/40">Disponibilité</dt>
            <dd className="mt-1 text-sm text-white/90">
              {produit.disponible === false ? 'Hors stock' : 'En stock'}
            </dd>
          </div>
        </dl>

        {/* TODO [ui] : rendu du richText Lexical (description riche) */}
        <div className="prose prose-invert mt-8 max-w-none">
          <p className="text-sm text-white/50">Description riche à connecter.</p>
        </div>

        <Link
          href="/contact"
          className="mt-10 inline-flex rounded-sm bg-brand-500 px-7 py-3.5 text-sm font-semibold uppercase tracking-industrial text-white transition-colors hover:bg-brand-600"
        >
          Demander un devis
        </Link>
      </div>

      {/* TODO [ui] : produits similaires (même catégorie, hors produit courant) */}
    </div>
  )
}