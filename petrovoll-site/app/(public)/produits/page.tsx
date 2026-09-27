import type { Metadata } from 'next'

import ProduitFiltre from '@/components/produits/ProduitFiltre'
import ProduitGrid from '@/components/produits/ProduitGrid'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * /produits — Catalogue complet (tous secteurs confondus)
 * ────────────────────────────────────────────────────────────────────────────
 * Filtres attendus (query params, cf. type FiltresProduits dans types/index.ts) :
 *   ?secteur=lubrifiants&categorie=huiles-moteur&marque=PETROVOLL
 *   &disponible=true&q=15w40&page=2&tri=recent
 *
 * TODO [data] :
 *  - [ ] Construire la requête Payload `where` à partir de `searchParams`
 *  - [ ] Pagination serveur (limit 12 par défaut) + URL partageables
 *  - [ ] `export const dynamic = 'force-dynamic'` si filtres très variables,
 *        sinon ISR + revalidation par tags
 *  - [ ] États vides : aucun résultat → message + suggestion de catégories
 */
export const metadata: Metadata = {
  title: 'Catalogue produits',
  description:
    'Catalogue PETROVOLL : huiles moteur et lubrifiants, pneumatiques, fournitures de bureau et solutions logistiques.',
  // TODO [seo] : canonical + OG image générée dynamiquement (opengraph-image.tsx)
}

export default function ProduitsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  return (
    <div className="container py-16">
      {/* En-tête de page */}
      <header className="mb-12 max-w-3xl">
        <p className="mb-3 font-display text-sm tracking-industrial text-brand-500">
          {/* TODO [contenu] : libellé éditorialisable depuis Payload */}
          CATALOGUE
        </p>
        <h1 className="section-underline text-4xl text-white md:text-6xl">Nos produits</h1>
        <p className="mt-6 text-base text-white/60">
          {/* TODO [contenu] : texte de présentation à récupérer depuis Payload */}
          Description de présentation du catalogue à connecter à Payload CMS.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        {/* Colonne filtres — sticky sur desktop, drawer sur mobile */}
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <ProduitFiltre
            // TODO [data] : passer les secteurs/catégories/marques réellement en base
            secteurs={[]}
            categories={[]}
            marques={[]}
            searchParams={searchParams}
          />
        </aside>

        {/* Grille de résultats */}
        <section>
          <ProduitGrid
            produits={[]}
            // TODO [data] : total réel renvoyé par Payload (result.totalDocs)
            total={0}
          />
        </section>
      </div>
    </div>
  )
}