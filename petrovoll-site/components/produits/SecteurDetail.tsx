import Link from 'next/link'

import type { Secteur } from '@/types'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SecteurDetail — contenu de la page /secteurs/[secteur]
 * ────────────────────────────────────────────────────────────────────────────
 * NOTE : ce composant COMPLÈTE l'arborescence demandée (il n'était pas listé) :
 * la route app/(public)/secteurs/[secteur]/page.tsx a besoin d'un contenu, et
 * le garder ici évite de mettre de la présentation dans le fichier de route.
 *
 * Structure cible :
 *   1. Bandeau visuel du secteur (imageIllustration + couleur d'accent)
 *   2. Présentation du métier (richText Payload)
 *   3. Produits rattachés au secteur (<ProduitGrid /> filtré)
 *   4. CTA devis propre au secteur
 *
 * TODO [data] : recevoir le secteur chargé côté serveur (Payload)
 * TODO [ui] :
 *  - [ ] Rendu richText Lexical (`@payloadcms/richtext-lexical/react`)
 *  - [ ] Appliquer `secteur.couleur` sur les accents (bordure, filet, badge)
 *  - [ ] Icône Lucide dynamique depuis `secteur.icone`
 *  - [ ] Navigation entre secteurs (« secteur suivant / précédent »)
 *  - [ ] Si le secteur est le principal (estPrincipal), afficher un bloc
 *        PETROVOLL dédié et plus imposant
 */
export interface SecteurDetailProps {
  /** Secteur chargé côté serveur. Null tant que la data n'est pas branchée. */
  secteur: Secteur | null
  /** Slug demandé (affichage temporaire du squelette). */
  slug: string
}

export default function SecteurDetail({ secteur, slug }: SecteurDetailProps) {
  const couleur = secteur?.couleur ?? '#D4420A'

  return (
    <div>
      {/* En-tête du secteur */}
      <header className="mb-16 max-w-3xl">
        <p className="mb-4 font-display text-sm tracking-industrial" style={{ color: couleur }}>
          {/* TODO [data] : libellé / accroche réels du secteur */}
          SECTEUR D’ACTIVITÉ
        </p>

        <h1 className="section-underline text-4xl text-white md:text-6xl">
          {/* TODO [data] : nom réel du secteur (fallback : le slug demandé) */}
          {secteur?.nom ?? slug}
        </h1>

        <p className="mt-6 text-base text-white/60">
          {/* TODO [data] : rendu du richText `description` */}
          {secteur
            ? 'Description du secteur à rendre depuis le richText Payload.'
            : `Contenu du secteur « ${slug} » à connecter à Payload CMS.`}
        </p>
      </header>

      {/* Bandeau visuel — TODO [data] : imageIllustration (Cloudinary, ratio 16:9) */}
      <div className="mb-16 flex aspect-[16/9] items-center justify-center rounded-lg border border-white/10 bg-white/[0.02]">
        <span className="font-display text-4xl tracking-industrial text-white/10">
          PETROVOLL
        </span>
      </div>

      {/* Produits du secteur — TODO [data] : grille alimentée par Payload
          (where: { secteur: { equals: secteur.id } }) */}
      <section aria-labelledby="produits-secteur" className="mb-16">
        <h2 id="produits-secteur" className="mb-8 text-3xl text-white">
          Nos produits pour ce secteur
        </h2>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-8 py-16 text-center">
          <p className="text-sm text-white/40">
            {/* TODO [ui] : insérer <ProduitGrid produits={…} /> ici */}
            Grille produits du secteur à connecter (composant ProduitGrid).
          </p>
        </div>
      </section>

      {/* CTA devis contextualisé */}
      <section className="rounded-lg border border-brand-500/30 bg-petrovoll-gradient px-8 py-12">
        <h2 className="text-3xl text-white">Un besoin dans ce secteur ?</h2>
        <p className="mt-4 max-w-xl text-sm text-white/60">
          {/* TODO [contenu] : préciser les conditions commerciales du secteur */}
          Nos équipes établissent un devis adapté à vos volumes et à votre zone
          de livraison.
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
            Voir le catalogue complet
          </Link>
        </div>
      </section>
    </div>
  )
}