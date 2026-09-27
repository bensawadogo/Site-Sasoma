import { v2 as cloudinary } from 'cloudinary'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * cloudinary.ts — Stockage et transformation des visuels produits
 * ────────────────────────────────────────────────────────────────────────────
 * Toutes les images produits (bidons PETROVOLL, pneus, fournitures) transitent
 * par Cloudinary afin de bénéficier de :
 *  • l'optimisation automatique (f_auto, q_auto)
 *  • la génération de variantes (thumb catalogue, fiche produit, OG image)
 *  • la livraison via CDN (important pour la latence en Afrique de l'Ouest)
 *
 * TODO [cloudinary] :
 *  - [ ] Brancher `@payloadcms/plugin-cloud-storage` sur la collection Media
 *        pour que les uploads Payload partent directement vers Cloudinary
 *  - [ ] Implémenter uploadImage(file, folder) / deleteImage(publicId)
 *  - [ ] Ajouter des presets de transformation nommés (catalogue, hero, og)
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

/** Dossier racine des médias dans le compte Cloudinary. */
export const CLOUDINARY_ROOT_FOLDER = process.env.CLOUDINARY_FOLDER ?? 'petrovoll'

/**
 * Presets de transformation — surchargeables depuis l'admin plus tard.
 * NOTE : garder des ratios cohérents avec la grille produits (4:3 et 1:1).
 */
export const CLOUDINARY_PRESETS = {
  /** Vignette catalogue — ProduitCard */
  catalogue: 'c_fill,w_600,h_450,q_auto,f_auto',
  /** Fiche produit / galerie */
  detail: 'c_fit,w_1200,q_auto,f_auto',
  /** Visuel hero / section produit phare */
  hero: 'c_fit,w_1600,q_auto,f_auto',
  /** Image de partage Open Graph (1200×630 obligatoire) */
  og: 'c_fill,w_1200,h_630,q_auto,f_auto',
} as const

/**
 * TODO [cloudinary] : implémenter
 *
 * export async function uploadImage(file: Buffer, folder = CLOUDINARY_ROOT_FOLDER) { … }
 * export async function deleteImage(publicId: string) { … }
 * export function getPublicIdFromUrl(url: string): string { … }
 * export function buildTransformedUrl(publicId: string, preset: keyof typeof CLOUDINARY_PRESETS) { … }
 */

export { cloudinary }
export default cloudinary