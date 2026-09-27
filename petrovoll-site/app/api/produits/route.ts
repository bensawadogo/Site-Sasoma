import { NextResponse } from 'next/server'

import type { ApiReponse, FiltresProduits, Produit } from '@/types'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/produits — Liste paginée et filtrable des produits
 * ────────────────────────────────────────────────────────────────────────────
 * Paramètres de requête acceptés :
 *   ?secteur=lubrifiants
 *   &categorie=huiles-moteur
 *   &marque=PETROVOLL
 *   &disponible=true
 *   &q=15w40
 *   &page=1&limite=12
 *   &tri=recent|nom-asc|nom-desc
 *
 * TODO [api] :
 *  - [ ] Brancher la Payload Local API (plus rapide que Prisma ici car les
 *        collections et les droits sont déjà déclarés côté Payload) :
 *          const payload = await getPayload({ config })
 *          const result = await payload.find({ collection: 'produits', where, … })
 *  - [ ] Traduire `filtres` en clause `where` Payload (and/or/like/equals)
 *  - [ ] Whitelister les valeurs de `tri` (jamais de tri arbitraire depuis l'URL)
 *  - [ ] Mettre en cache : `revalidateTag('produits')` + revalidation déclenchée
 *        par les hooks afterChange de la collection Produits
 *  - [ ] Ajouter les en-têtes Cache-Control (s-maxage + stale-while-revalidate)
 *  - [ ] Documenter la réponse avec un schéma Zod partagé (contrat API stable)
 */

// Route dynamique : les filtres proviennent de la requête.
export const dynamic = 'force-dynamic'

/** Normalise les query params en objet `FiltresProduits` typé. */
function parseFiltres(searchParams: URLSearchParams): FiltresProduits {
  const nombre = (cle: string, defaut: number) => {
    const valeur = Number(searchParams.get(cle))
    return Number.isFinite(valeur) && valeur > 0 ? valeur : defaut
  }

  return {
    secteur: searchParams.get('secteur') ?? undefined,
    categorie: searchParams.get('categorie') ?? undefined,
    marque: searchParams.get('marque') ?? undefined,
    disponible: searchParams.get('disponible') === 'true' ? true : undefined,
    recherche: searchParams.get('q') ?? undefined,
    page: nombre('page', 1),
    limite: nombre('limite', 12),
    // TODO [api] : valider `tri` contre une liste blanche typée
    tri: (searchParams.get('tri') as FiltresProduits['tri']) ?? 'recent',
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filtres = parseFiltres(searchParams)

  // TODO [api] : remplacer ce retour vide par la requête Payload / Prisma
  const produits: Produit[] = []

  const reponse: ApiReponse<Produit[]> = {
    data: produits,
    meta: {
      filtres,
      total: produits.length,
      page: filtres.page ?? 1,
      limite: filtres.limite ?? 12,
      totalPages: 0,
      // TODO [api] : renseigner depuis `result.totalDocs` renvoyé par Payload
    },
  }

  return NextResponse.json(reponse)
}

/**
 * POST /api/produits — Création d'un produit
 *
 * ⚠️  Une seule voie d'écriture en production : la Payload Local API appelée
 *     depuis ce handler (jamais d'écriture directe Prisma si Payload est la
 *     source de vérité — sinon l'index de recherche et les hooks ne s'exécutent pas).
 *
 * TODO [api] :
 *  - [ ] Vérifier la session (auth()) et le rôle (super-admin / editeur)
 *  - [ ] Valider le corps avec un schéma Zod strict
 *  - [ ] Retourner 201 + le document créé, 400 si validation, 403 si rôle insuffisant
 *  - [ ] Journaliser la création (LogAudit)
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Non implémenté — voir les TODO du handler POST (auth + validation Zod + Payload).',
    },
    { status: 501 },
  )
}