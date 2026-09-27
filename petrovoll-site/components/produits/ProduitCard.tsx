import Link from 'next/link'

import type { Produit } from '@/types'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ProduitCard — carte produit du catalogue
 * ────────────────────────────────────────────────────────────────────────────
 * Utilisée dans :
 *   • ProduitGrid          (catalogue /produits)
 *   • Produits similaires  (fiche produit)
 *   • Produits d'un secteur (/secteurs/<slug>)
 *
 * TODO [ui] :
 *  - [ ] Remplacer le placeholder visuel par next/image (image Cloudinary,
 *        preset `catalogue` 600×450, `sizes` adaptés à la grille)
 *  - [ ] Badge de disponibilité (En stock / Hors stock) — vert/rouge sobres
 *  - [ ] Badge « PETROVOLL » si `marque === 'PETROVOLL'`
 *  - [ ] Effet de survol au clavier (focus-visible) et non uniquement à la souris
 *  - [ ] Afficher la référence commerciale (`references`)
 *  - [ ] Prévoir une prop `variante` ('grille' | 'compacte' | 'phare')
 *  - [ ] `loading="lazy"` par défaut (sauf au-dessus de la ligne de flottaison)
 */
export interface ProduitCardProps {
  produit: Produit
}

export default function ProduitCard({ produit }: ProduitCardProps) {
  const enStock = produit.disponible !== false

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] transition-colors hover:border-brand-500/60">
      {/* Visuel — TODO [data] : 1re image de `produit.images` via Cloudinary */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-800">
        <div className="flex size-full items-center justify-center">
          <span className="font-display text-2xl tracking-industrial text-white/10">
            {produit.marque ?? 'PETROVOLL'}
          </span>
        </div>

        {/* Badge de disponibilité */}
        <span
          className={
            enStock
              ? 'absolute left-3 top-3 rounded-sm bg-ink-950/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gold-400 backdrop-blur'
              : 'absolute left-3 top-3 rounded-sm bg-ink-950/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-500 backdrop-blur'
          }
        >
          {enStock ? 'En stock' : 'Hors stock'}
        </span>
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col p-5">
        {/* TODO [data] : catégorie / secteur (relation à peupler) */}
        <p className="text-[11px] uppercase tracking-industrial text-white/40">
          {typeof produit.secteur === 'object' && produit.secteur !== null
            ? produit.secteur.nom
            : 'Secteur'}
        </p>

        <h3 className="mt-2 text-lg leading-snug text-white">
          <Link href={`/produits/${produit.slug}`} className="hover:text-gold-400">
            {produit.nom}
          </Link>
        </h3>

        {/* Référence commerciale */}
        {produit.references ? (
          <p className="mt-1 text-xs text-white/40">Réf. {produit.references}</p>
        ) : null}

        {/* TODO [data] : extrait du richText `description` (helper truncate) */}
        <p className="mt-3 flex-1 text-sm text-white/50">Description à connecter.</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          {/* Pas de prix public : le parcours B2B passe par un devis */}
          <span className="text-xs uppercase tracking-wide text-white/35">Prix sur devis</span>
          <Link
            href={`/produits/${produit.slug}`}
            className="text-xs font-semibold uppercase tracking-industrial text-brand-500 transition-colors group-hover:text-gold-400"
          >
            Détails →
          </Link>
        </div>
      </div>
    </article>
  )
}