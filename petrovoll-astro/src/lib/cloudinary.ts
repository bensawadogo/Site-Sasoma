/**
 * ─────────────────────────────────────────────────────────────────────────────
 * lib/cloudinary.ts — URLs et uploads des visuels produits
 * ────────────────────────────────────────────────────────────────────────────
 * Deux usages, deux contextes d'exécution :
 *   1. CÔTÉ CLIENT / BUILD (safe) : construction d'URLs de transformation
 *      → seuls le `cloud_name` et le `public_id` sont nécessaires.
 *   2. CÔTÉ SERVEUR UNIQUEMENT : upload signé / suppression (secrets API).
 *      Ne JAMAIS importer ces fonctions dans un composant client.
 *
 * Rappel d'architecture : par défaut, les images produits sont VERSIONNÉES
 * dans le dépôt (champ `fields.image` de Keystatic) et optimisées au build par
 * <Image /> d'Astro. Cloudinary sert d'alternative pour les visuels lourds ou
 * édités hors dépôt (`urlCloudinary` dans keystatic.config.ts).
 *
 * TODO [cloudinary] :
 *  - [ ] Renseigner CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET dans .env
 *  - [ ] Ajouter la route d'upload signé si l'admin doit téléverser directement
 *        (src/pages/api/cloudinary-upload.ts → export `prerender = false`)
 *  - [ ] Définir des presets nommés côté Cloudinary (catalogue, hero, og)
 */

/** Nom du cloud (public). Vide → les helpers retournent null proprement. */
const CLOUD_NAME = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME ?? ''

/** Presets de transformation : garder des ratios cohérents avec la grille. */
export const PRESETS = {
  /** Vignette catalogue — ProduitCard (4:3) */
  catalogue: 'c_fill,w_600,h_450,q_auto,f_auto',
  /** Galerie / fiche produit */
  detail: 'c_fit,w_1200,q_auto,f_auto',
  /** Visuel héros (Home, section PETROVOLL) */
  hero: 'c_fit,w_1600,q_auto,f_auto',
  /** Image de partage Open Graph (1200×630 obligatoire) */
  og: 'c_fill,w_1200,h_630,q_auto,f_auto',
} as const

export type PresetCloudinary = keyof typeof PRESETS

/**
 * Construit une URL Cloudinary optimisée.
 * @param publicId identifiant du média (ex. « petrovoll/bidon-5w30 »)
 * @param preset   preset de transformation (voir PRESETS)
 * @returns l'URL absolue, ou null si le cloud_name n'est pas configuré.
 */
export function buildCloudinaryUrl(publicId: string, preset: PresetCloudinary = 'detail'): string | null {
  if (!CLOUD_NAME || !publicId) return null
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${PRESETS[preset]}/${publicId}`
}

/**
 * Extrait le public_id d'une URL Cloudinary (utile pour la suppression).
 * TODO [cloudinary] : gérer les URLs déjà transformées (segment /image/upload/<preset>/).
 */
export function extractPublicId(url: string): string | null {
  const marqueur = '/image/upload/'
  const index = url.indexOf(marqueur)
  if (index === -1) return null
  return url
    .slice(index + marqueur.length)
    .replace(/^v\d+\//, '')
    .replace(/\.[a-z0-9]+$/i, '')
}

/* ── Serveur uniquement (secrets) ───────────────────────────────────────────
 * TODO [cloudinary] : implémenter dans un endpoint SSR (`prerender = false`) :
 *
 *   import { createHash } from 'node:crypto'
 *
 *   export function signatureUpload(params: Record<string, string>) {
 *     const secret = import.meta.env.CLOUDINARY_API_SECRET ?? ''
 *     const aSigner = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&')
 *     return createHash('sha1').update(aSigner + secret).digest('hex')
 *   }
 *
 *   export async function supprimerImage(publicId: string) {
 *     // POST https://api.cloudinary.com/v1_1/<cloud>/image/destroy
 *     // avec signature + api_key (jamais côté navigateur)
 *   }
 * ------------------------------------------------------------------------- */
