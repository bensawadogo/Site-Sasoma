'use client'

import { Search, SlidersHorizontal } from 'lucide-react'

import type { Categorie, Secteur } from '@/types'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ProduitFiltre — filtres du catalogue (colonne desktop / drawer mobile)
 * ────────────────────────────────────────────────────────────────────────────
 * Principe de navigation retenu : les filtres sont SÉRIALISÉS DANS L'URL
 *   /produits?secteur=lubrifiants&categorie=huiles-moteur&disponible=true&q=15w40
 * → pages partageables, indexables, compatibles avec le bouton « retour ».
 *
 * `'use client'` car les contrôles sont interactifs (router.push, état).
 *
 * TODO [filtres] :
 *  - [ ] Mise à jour de l'URL :
 *          const router = useRouter()
 *          const params = useSearchParams()
 *          → reconstruire la query string puis `router.push('/produits?' + qs)`
 *        (utiliser `scroll: false` pour éviter le saut en haut de page)
 *  - [ ] Remplacer les <input> natifs par les composants shadcn
 *        (Checkbox, Select, Accordion, Input) — cf. components/ui/README.md
 *  - [ ] Débouncer le champ de recherche (~300 ms) avant de pousser l'URL
 *  - [ ] Mobile : rendre la colonne dans une <Sheet /> (drawer) avec un bouton
 *        « Filtrer » affichant le nombre de filtres actifs
 *  - [ ] Accessibilité : <fieldset> + <legend> pour chaque groupe de filtres
 *  - [ ] Bouton « Réinitialiser les filtres » si au moins un filtre est actif
 *  - [ ] Nombre de résultats par facette (nécessite un comptage serveur)
 */
export interface ProduitFiltreProps {
  /** Secteurs à proposer (les 5 secteurs actifs). */
  secteurs?: Secteur[]
  /** Catégories à proposer (filtrées par le secteur sélectionné si pertinent). */
  categories?: Categorie[]
  /** Marques distinctes présentes au catalogue. */
  marques?: string[]
  /** Query params courants (transmis par le serveur). */
  searchParams?: Record<string, string | string[] | undefined>
}

export default function ProduitFiltre({
  secteurs = [],
  categories = [],
  marques = [],
  searchParams = {},
}: ProduitFiltreProps) {
  // TODO [filtres] : dériver ces valeurs de `searchParams`
  // (attention : les query params arrivent en `string | string[]`)
  const rechercheCourante = ''
  const secteurCourant = ''
  const disponibleCourant = false

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 font-display text-sm tracking-industrial text-white/70">
        <SlidersHorizontal aria-hidden className="size-4" />
        FILTRES
      </div>

      {/* Recherche libre */}
      <div>
        <label
          htmlFor="filtre-recherche"
          className="mb-3 block text-xs uppercase tracking-wide text-white/40"
        >
          Recherche
        </label>
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30"
          />
          <input
            id="filtre-recherche"
            type="search"
            defaultValue={rechercheCourante}
            placeholder="Référence, viscosité, marque…"
            className="w-full rounded-sm border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-brand-500 focus:outline-none"
            // TODO [filtres] : onChange débouncé → mise à jour de l'URL
          />
        </div>
      </div>

      {/* Secteurs */}
      <fieldset>
        <legend className="mb-3 text-xs uppercase tracking-wide text-white/40">Secteur</legend>
        <ul className="space-y-2.5">
          {secteurs.length > 0
            ? secteurs.map((secteur) => (
                <li key={secteur.id}>
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-white/65 hover:text-white">
                    <input
                      type="checkbox"
                      defaultChecked={secteurCourant === secteur.slug}
                      className="size-4 accent-[#D4420A]"
                      // TODO [filtres] : onChange → router.push(`?secteur=${secteur.slug}`)
                    />
                    {secteur.nom}
                  </label>
                </li>
              ))
            : // Placeholder du squelette (aucune donnée Payload en base)
              ['Huile moteur & lubrifiants', 'Transport & logistique', 'Pneumatiques'].map(
                (nom) => (
                  <li key={nom}>
                    <label className="flex cursor-not-allowed items-center gap-3 text-sm text-white/25">
                      <input type="checkbox" disabled className="size-4" />
                      {nom}
                    </label>
                  </li>
                ),
              )}
        </ul>
      </fieldset>

      {/* Catégories */}
      <fieldset>
        <legend className="mb-3 text-xs uppercase tracking-wide text-white/40">Catégorie</legend>
        <p className="text-sm text-white/30">
          {categories.length > 0
            ? `${categories.length} catégorie(s) disponible(s)`
            : 'Catégories à connecter à Payload.'}
        </p>
        {/* TODO [filtres] : liste des catégories (accordéon shadcn) */}
      </fieldset>

      {/* Marques */}
      <fieldset>
        <legend className="mb-3 text-xs uppercase tracking-wide text-white/40">Marque</legend>
        <p className="text-sm text-white/30">
          {marques.length > 0 ? marques.join(' · ') : 'Marques à connecter à Payload.'}
        </p>
        {/* TODO [filtres] : cases à cocher depuis les valeurs distinctes (distinct) */}
      </fieldset>

      {/* Disponibilité */}
      <fieldset>
        <legend className="mb-3 text-xs uppercase tracking-wide text-white/40">
          Disponibilité
        </legend>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-white/65 hover:text-white">
          <input
            type="checkbox"
            defaultChecked={disponibleCourant}
            className="size-4 accent-[#D4420A]"
          />
          Afficher uniquement les produits en stock
        </label>
      </fieldset>

      {/* TODO [filtres] : bouton de réinitialisation + bouton « Appliquer » (mobile) */}
    </div>
  )
}