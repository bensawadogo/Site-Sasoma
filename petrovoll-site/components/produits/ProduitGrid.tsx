import ProduitCard from '@/components/produits/ProduitCard'
import type { Produit } from '@/types'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ProduitGrid — grille de produits (catalogue, secteur, produits similaires)
 * ────────────────────────────────────────────────────────────────────────────
 * Composant SERVEUR (aucun état) : la grille reste hors du bundle client, ce
 * qui allège fortement la page sur mobile — priorité pour le marché visé.
 *
 * TODO [ui] :
 *  - [ ] Pagination ou « charger plus » :
 *        la pagination serveur par URL (SEO-friendly) est préférable au
 *        chargement infini pour un catalogue B2B référençable
 *  - [ ] État vide soigné : message + suggestions de secteurs + contact
 *  - [ ] Squelettes de chargement (loading.tsx) cohérents avec la grille
 *  - [ ] Animation d'apparition en cascade — si nécessaire, extraire la grille
 *        dans un composant client dédié pour éviter de rendre toute la page client
 *  - [ ] `grid-cols` : 1 (mobile) / 2 (tablette) / 3 (desktop) / 4 (large)
 */
export interface ProduitGridProps {
  produits: Produit[]
  /** Nombre total de résultats (pagination). */
  total?: number
  /** Nombre de colonnes en desktop (variante « produits similaires »). */
  colonnes?: 3 | 4
}

export default function ProduitGrid({ produits, total = 0, colonnes = 3 }: ProduitGridProps) {
  // État vide — TODO [ux] : enrichir (catégories suggérées, CTA contact)
  if (produits.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] px-8 py-16 text-center">
        <p className="font-display text-2xl tracking-industrial text-white/70">
          AUCUN PRODUIT À AFFICHER
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-white/45">
          {/* TODO [data] : distinguer « catalogue vide » de « filtres trop stricts »
              et proposer la réinitialisation des filtres dans le second cas. */}
          Le catalogue n’est pas encore alimenté ou aucun produit ne correspond
          aux filtres sélectionnés.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Compteur de résultats — TODO [seo] : libellé accessible (aria-live) */}
      <p className="mb-6 text-xs uppercase tracking-wide text-white/40">
        {total > 0 ? `${total} produit${total > 1 ? 's' : ''}` : `${produits.length} produit(s)`}
      </p>

      <ul
        className={
          colonnes === 4
            ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'
        }
      >
        {produits.map((produit) => (
          <li key={produit.id}>
            <ProduitCard produit={produit} />
          </li>
        ))}
      </ul>

      {/* TODO [ui] : <Pagination /> (composant shadcn) — voir components/ui/README.md */}
    </div>
  )
}