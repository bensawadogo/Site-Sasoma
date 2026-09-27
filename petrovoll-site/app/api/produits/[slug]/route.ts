import { NextResponse } from 'next/server'

import type { ApiReponse, Produit } from '@/types'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/produits/[slug] — Détail d'un produit
 * ────────────────────────────────────────────────────────────────────────────
 * ⚠️  Next.js 14 : `params` est synchrone. En Next.js 15 :
 *       export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> })
 *       const { slug } = await params
 *
 * TODO [api] :
 *  - [ ] payload.find({ collection: 'produits', where: { slug: { equals: slug } }, depth: 2 })
 *  - [ ] 404 explicite si aucun document (ne jamais renvoyer `undefined` en 200)
 *  - [ ] Cache : `revalidateTag(`produit:${slug}`)`
 *  - [ ] Inclure les produits similaires (même catégorie) dans `meta`
 */
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const { slug } = params

  // TODO [api] : remplacer par la requête Payload
  const produit: Produit | null = null

  if (!produit) {
    return NextResponse.json(
      {
        error: `Produit « ${slug} » introuvable (données non câblées — squelette).`,
      },
      { status: 404 },
    )
  }

  const reponse: ApiReponse<Produit> = { data: produit }
  return NextResponse.json(reponse)
}