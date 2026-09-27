import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * utils.ts — Helpers transverses (aucune dépendance Next/React)
 * ────────────────────────────────────────────────────────────────────────────
 */

/**
 * Fusionne des classes Tailwind en résolvant les conflits.
 * Utilisé par tous les composants shadcn/ui (`cn()`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Génère un slug URL-safe depuis un texte libre.
 * Ex. « Huile moteur PETROVOLL 15W-40 » → « huile-moteur-petrovoll-15w-40 »
 *
 * TODO [slug] : brancher dans les hooks `beforeValidate` des collections Payload
 * (Produits, Categories, Secteurs) + gérer l'unicité (suffixe -2, -3…).
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Formate un prix / une quantité pour le marché ouest-africain.
 * TODO [i18n] : décider de la devise affichée par défaut (XOF / FCFA)
 * et du format de séparation des milliers selon le pays.
 */
export function formatPrice(value: number | null | undefined, currency = 'XOF'): string {
  if (value === null || value === undefined) return 'Sur devis'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Construit une URL absolue à partir du `NEXT_PUBLIC_SITE_URL`.
 * Utilisé pour les métadonnées SEO (Open Graph, canonical, sitemap).
 */
export function absoluteUrl(path = '/'): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return new URL(path, base).toString()
}

/**
 * TODO [utils] : ajouter
 *  - truncate(text, length) pour les extraits de description richText
 *  - isRichTextEmpty(node) pour éviter de rendre les blocs Payload vides
 *  - buildWhatsAppLink(number, message) pour le CTA B2B Afrique de l'Ouest
 */