/**
 * Fonctions pures de mise en forme (aucune dépendance Astro) — testées dans
 * format.test.ts. Elles absorbent les saisies imparfaites du client : un
 * numéro avec espaces, un prix vide, un texte avec du balisage…
 */

/** « 12 500 FCFA », ou « Prix sur demande » si le prix n'est pas renseigné. */
export function formaterPrix(prix: number | null | undefined): string {
  if (prix === null || prix === undefined || !Number.isFinite(prix)) return 'Prix sur demande'
  // Espace insécable fine (U+202F) comme séparateur de milliers : c'est ce que
  // produit fr-FR ; on la remplace par une espace insécable classique, mieux
  // supportée par les polices des vieux Android.
  return `${new Intl.NumberFormat('fr-FR').format(prix).replace(/ /g, ' ')} FCFA`
}

/** Garde uniquement les chiffres d'un numéro saisi à la main. */
export function chiffresSeuls(numero: string | null | undefined): string {
  return (numero ?? '').replace(/\D/g, '')
}

/** Indicatif du Burkina Faso, ajouté aux numéros locaux (8 chiffres). */
const INDICATIF_BF = '226'

/** Lien WhatsApp avec message pré-rempli ; null si aucun numéro. */
export function lienWhatsApp(numero: string | null | undefined, message?: string): string | null {
  // wa.me veut le format international sans « + » ni « 00 » ; un numéro local
  // saisi sans indicatif (« 70 12 34 56 ») serait lu comme un autre pays.
  let chiffres = chiffresSeuls(numero).replace(/^00/, '')
  if (chiffres.length === 8) chiffres = INDICATIF_BF + chiffres
  if (!chiffres) return null
  return message
    ? `https://wa.me/${chiffres}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${chiffres}`
}

/** Lien tel: (garde le « + » de l'indicatif) ; null si aucun numéro. */
export function lienTelephone(numero: string | null | undefined): string | null {
  const nettoye = (numero ?? '').replace(/[^\d+]/g, '')
  return nettoye.replace(/\+/g, '') ? `tel:${nettoye}` : null
}

/**
 * Extrait de texte brut depuis du Markdoc (meta description, cartes) :
 * retire commentaires, titres, puces, liens et gras, puis coupe au mot.
 */
export function extraitTexte(markdoc: string | null | undefined, longueur = 155): string {
  const texte = (markdoc ?? '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\{%[\s\S]*?%\}/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (texte.length <= longueur) return texte
  const coupe = texte.slice(0, longueur)
  const dernierEspace = coupe.lastIndexOf(' ')
  return `${(dernierEspace > 0 ? coupe.slice(0, dernierEspace) : coupe).replace(/[,;:.\s]+$/, '')}…`
}

/** Sérialise du JSON-LD sans permettre de sortir de la balise <script>. */
export function jsonLdSur(donnees: unknown): string {
  return JSON.stringify(donnees)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
