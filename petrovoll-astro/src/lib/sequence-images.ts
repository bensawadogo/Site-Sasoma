/**
 * sequence-images.ts — calculs purs des séquences d'images du hero vidéo (testés).
 * Utilisé par src/scripts/hero-video/ (mobile et desktop).
 */

export interface Taille {
  l: number
  h: number
}

export interface Couverture {
  x: number
  y: number
  l: number
  h: number
}

/** Image affichée pour une progression 0 → 1 dans une séquence de `total` images. */
export function indexImage(t: number, total: number): number {
  if (total <= 1) return 0
  return Math.min(total - 1, Math.max(0, Math.round(t * (total - 1))))
}

/**
 * Ordre de chargement : une image sur `pas` d'abord (toute la séquence devient
 * jouable vite, en saccadé), puis les images intermédiaires.
 */
export function ordreChargement(total: number, pas = 4): number[] {
  const premier: number[] = []
  const reste: number[] = []
  for (let i = 0; i < total; i++) (i % pas === 0 || i === total - 1 ? premier : reste).push(i)
  return [...premier, ...reste]
}

/** Image chargée la plus proche de `i` (null si aucune). */
export function plusProche(i: number, pret: (k: number) => boolean, total: number): number | null {
  for (let d = 0; d < total; d++) {
    if (i - d >= 0 && pret(i - d)) return i - d
    if (i + d < total && pret(i + d)) return i + d
  }
  return null
}

/**
 * Rectangle où dessiner une image pour qu'elle couvre l'écran (comme object-fit:
 * cover). `focaleX` (0 → 1) choisit la partie gardée quand l'image est rognée
 * sur les côtés : 0,5 = centre, plus grand = on garde la droite.
 */
export function couverture(image: Taille, ecran: Taille, focaleX = 0.5, focaleY = 0.5, zoom = 1): Couverture {
  // zoom < 1 : image plus petite que l'écran (son fond noir se fond dans la scène noire).
  const echelle = Math.max(ecran.l / image.l, ecran.h / image.h) * zoom
  const l = image.l * echelle
  const h = image.h * echelle
  return { x: (ecran.l - l) * focaleX, y: (ecran.h - h) * focaleY, l, h }
}

/** Point de l'image (fractions) → position à l'écran, pour une couverture donnée. */
export function pointCouvert(p: { x: number; y: number }, c: Couverture): { x: number; y: number } {
  return { x: c.x + p.x * c.l, y: c.y + p.y * c.h }
}
