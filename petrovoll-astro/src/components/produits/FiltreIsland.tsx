/**
 * FiltreIsland.tsx — SEULE island React du catalogue (client:load).
 * Pourquoi React ici : etat local (secteur, dispo, recherche) + filtrage
 * instantane sans rechargement. Tout le reste du catalogue reste du HTML pur.
 *
 * Mobile-first : <details> natif pour les filtres (tactile, zero JS requis
 * pour ouvrir/fermer), selects >= 48px de haut.
 *
 * TODO [produit] :
 *  - [ ] Debouncer la recherche (150 ms) pour preserver l'INP sur mobile
 *  - [ ] Synchroniser les filtres dans l'URL (?secteur=, ?q=) pour partage/SEO
 *  - [ ] Compter les resultats (role="status", aria-live="polite")
 */
import { useMemo, useState } from 'react'

export interface ProduitFiltreItem {
  slug: string
  titre: string
  marque?: string
  secteur: string
  disponible?: boolean
}

interface Props {
  produits: ProduitFiltreItem[]
  secteurInitial?: string
}

const SECTEURS = [
  { value: 'tous', label: 'Tous les secteurs' },
  { value: 'lubrifiants', label: 'Lubrifiants' },
  { value: 'transport', label: 'Transport' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'pneumatiques', label: 'Pneumatiques' },
  { value: 'fournitures', label: 'Fournitures' },
]

export default function FiltreIsland({ produits, secteurInitial = 'tous' }: Props) {
  const [secteur, setSecteur] = useState(secteurInitial)
  const [recherche, setRecherche] = useState('')
  const [dispoUniquement, setDispoUniquement] = useState(false)

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return produits.filter((p) => {
      if (secteur !== 'tous' && p.secteur !== secteur) return false
      if (dispoUniquement && p.disponible === false) return false
      if (q && !`${p.titre} ${p.marque ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [produits, secteur, recherche, dispoUniquement])

  return (
    <div className="mb-8">
      <details className="rounded-md border border-border bg-surface p-4 sm:p-5" open>
        <summary className="cursor-pointer touch-manipulation py-2 font-semibold">
          Filtrer ({filtres.length} résultat{filtres.length > 1 ? 's' : ''})
        </summary>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex min-h-[48px] flex-col gap-1 text-sm">
            Secteur
            <select
              value={secteur}
              onChange={(e) => setSecteur(e.target.value)}
              className="min-h-[48px] rounded border border-border bg-primary px-3"
            >
              {SECTEURS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-h-[48px] flex-col gap-1 text-sm">
            Recherche
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Ex. 5W-30, pneu, ramette…"
              className="min-h-[48px] rounded border border-border bg-primary px-3"
            />
          </label>

          <label className="flex min-h-[48px] cursor-pointer touch-manipulation items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={dispoUniquement}
              onChange={(e) => setDispoUniquement(e.target.checked)}
              className="h-6 w-6 accent-[#D4420A]"
            />
            Disponibles uniquement
          </label>
        </div>
      </details>

      {/* TODO [produit] : rendre la grille filtree ici (map -> cards) ou emettre
          un CustomEvent vers ProduitGrid. Version squelette : compteur seul. */}
      <p role="status" aria-live="polite" className="mt-3 text-sm text-muted">
        {filtres.length} produit{filtres.length > 1 ? 's' : ''} correspondant(s).
      </p>
    </div>
  )
}
