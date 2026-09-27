/**
 * hero-timeline.ts — calculs purs du hero au scroll (aucun accès au DOM),
 * testés dans hero-timeline.test.ts. Le script src/scripts/hero-scroll.ts
 * ne fait que lire le DOM, appeler ces fonctions et écrire des transform.
 */
import type { Palier } from '@/hero.config'

export const borner = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

/** Avancement (0 → 1) de `p` dans la plage [debut, fin]. */
export const local = (p: number, debut: number, fin: number) => borner((p - debut) / (fin - debut))

/** Départ et arrivée en douceur (smoothstep). */
export const doux = (t: number) => t * t * (3 - 2 * t)

/** Interpolation linéaire. */
export const mix = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Opacité d'un bloc visible sur [debut, fin] : fondu d'entrée juste APRÈS
 * `debut`, fondu de sortie juste AVANT `fin` — deux blocs voisins ne sont donc
 * jamais visibles en même temps. Un bloc qui commence à 0 (ou finit à 1) n'a
 * pas de fondu de ce côté : visible dès le chargement (ou jusqu'à la fin).
 */
export function opaciteBloc(p: number, debut: number, fin: number, fondu = 0.02): number {
  const entree = debut <= 0 ? 1 : local(p, debut, debut + fondu)
  const sortie = fin >= 1 ? 1 : 1 - local(p, fin - fondu, fin)
  return borner(Math.min(entree, sortie))
}

/** Rotation de `point` autour de `pivot` (degrés, sens horaire à l'écran). */
export function tournerAutour(point: { x: number; y: number }, pivot: { x: number; y: number }, degres: number) {
  const a = (degres * Math.PI) / 180
  const vx = point.x - pivot.x
  const vy = point.y - pivot.y
  return { x: pivot.x + vx * Math.cos(a) - vy * Math.sin(a), y: pivot.y + vx * Math.sin(a) + vy * Math.cos(a) }
}

export interface SignauxAppareil {
  forcage?: string | null
  saveData?: boolean
  typeConnexion?: string
  memoireGo?: number
  mouvementReduit?: boolean
  tactile?: boolean
  largeur: number
}

/** Palier du brief §8 : lite / standard / full, `?tier=` prioritaire. */
export function choisirPalier(s: SignauxAppareil): Palier {
  if (s.forcage === 'lite' || s.forcage === 'standard' || s.forcage === 'full') return s.forcage
  const lent = s.typeConnexion !== undefined && /^(slow-2g|2g|3g)$/.test(s.typeConnexion)
  if (s.saveData || lent || (s.memoireGo !== undefined && s.memoireGo <= 2) || s.mouvementReduit) return 'lite'
  const rapide = s.typeConnexion === undefined || s.typeConnexion === '4g'
  // deviceMemory n'existe pas sur Safari/Firefox : un grand écran sans tactile compte comme puissant.
  const puissant = s.memoireGo !== undefined ? s.memoireGo >= 6 : !s.tactile && s.largeur >= 900
  return rapide && puissant ? 'full' : 'standard'
}

/** Palier inférieur (garde-fou de performance). */
export const palierInferieur = (p: Palier): Palier => (p === 'full' ? 'standard' : 'lite')

/** Clé de cadrage : à l'avancement `t` (0 → 1), le point (x, y) du dessin est au centre, zoomé. */
export interface CleCadrage {
  t: number
  x: number
  y: number
  zoom: number
}

/** Cadrage à l'avancement `t`, interpolé en douceur entre deux clés consécutives. */
export function cadrageA(t: number, cles: readonly CleCadrage[]): Omit<CleCadrage, 't'> {
  const apres = cles.findIndex((c) => c.t > t)
  if (apres <= 0) {
    const { x, y, zoom } = cles[apres === -1 ? cles.length - 1 : 0]
    return { x, y, zoom }
  }
  const a = cles[apres - 1]
  const b = cles[apres]
  const u = doux(local(t, a.t, b.t))
  return { x: mix(a.x, b.x, u), y: mix(a.y, b.y, u), zoom: mix(a.zoom, b.zoom, u) }
}

/**
 * Transformation (origine en haut à gauche) qui amène le point `c` d'un dessin
 * carré de côté `cote` au point `cible` de l'écran. Le dessin est posé en (x0, y0).
 */
export function transformCadrage(
  c: Omit<CleCadrage, 't'>,
  carre: { x0: number; y0: number; cote: number },
  cible: { x: number; y: number },
): { tx: number; ty: number; s: number } {
  return { tx: cible.x - carre.x0 - c.zoom * c.x * carre.cote, ty: cible.y - carre.y0 - c.zoom * c.y * carre.cote, s: c.zoom }
}
