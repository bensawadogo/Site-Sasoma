/**
 * ─────────────────────────────────────────────────────────────────────────────
 * lib/utils.ts — helpers purs (aucune dépendance Astro/React)
 * ────────────────────────────────────────────────────────────────────────────
 * Testés mentalement sur les cas limites du marché cible (3G, petits écrans).
 */

/** Fusionne des classes conditionnelles (alternative légère à clsx). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Tronque un texte brut proprement (coupe au dernier espace).
 * Utilisé pour les extraits de description sur les cards produit :
 * `entry.body` (Markdoc brut) → texte court.
 */
export function truncate(texte: string, longueur = 140): string {
  const propre = texte.replace(/\s+/g, ' ').trim()
  if (propre.length <= longueur) return propre
  const coupe = propre.slice(0, longueur)
  return `${coupe.slice(0, coupe.lastIndexOf(' '))}…`
}

/** Génère un slug URL-safe (fallback si un slug doit être dérivé côté code). */
export function slugify(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Construit un lien WhatsApp profond avec message pré-rempli.
 * `numero` : format international SANS « + » ni espaces (ex. « 2250000000000 »).
 * Retourne null si le numéro n'est pas configuré (le CTA est alors masqué).
 */
export function buildWhatsAppLink(numero?: string, message?: string): string | null {
  const propre = numero?.replace(/[^\d]/g, '')
  if (!propre) return null
  const texte = message ?? 'Bonjour, je souhaite un devis PETROVOLL.'
  return `https://wa.me/${propre}?text=${encodeURIComponent(texte)}`
}

/**
 * Construit une URL absolue à partir de `site` (astro.config.mjs).
 * Utilisé par le sitemap, les canonical et les balises og:url.
 */
export function absoluteUrl(chemin = '/', site?: URL | string): string {
  const base = site ? site.toString() : '/'
  return new URL(chemin, base).toString()
}

/**
 * Choisit la meilleure source d'image disponible pour un visuel produit.
 * Priorité : Cloudinary (URL absolue) puis fichier versionné (chemin public).
 * TODO [images] : retourner les dimensions et brancher <Image /> d'Astro pour
 * obtenir WebP/AVIF + width/height automatiques (zéro CLS).
 */
export function resolveImageSource(visuel?: {
  image?: string | null
  urlCloudinary?: string | null
}): string | null {
  if (!visuel) return null
  if (visuel.urlCloudinary) return visuel.urlCloudinary
  if (visuel.image) {
    // Keystatic stocke un chemin déjà préfixé par `publicPath`
    return visuel.image.startsWith('/') ? visuel.image : `/${visuel.image}`
  }
  return null
}

/** Formate une date en français, format court (ex. « 12 mars 2026 »). */
export function formatDateFr(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/* TODO [utils] : ajouter
 *  - extraireTexteMarkdoc(body) : nettoyage des balises Markdoc pour les extraits
 *  - buildTelLink(numero) : lien tel: normalisé pour les CTA mobiles
 *  - isValidHex(couleur) : garde-fou réutilisable côté composants
 */
