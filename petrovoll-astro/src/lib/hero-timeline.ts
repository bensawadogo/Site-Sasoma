/**
 * hero-timeline.ts — calculs purs du hero au scroll (aucun accès au DOM),
 * testés dans hero-timeline.test.ts. Le script src/scripts/hero-scroll.ts
 * ne fait que lire le DOM, appeler ces fonctions et écrire des transform.
 */
import type { Palier, Point } from '@/hero.config'

export interface Taille {
  l: number
  h: number
}

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

/**
 * Position à l'écran (px) d'un point exprimé en fractions d'une image
 * affichée en `object-fit: cover` centré.
 */
export function couvrir(point: Point, image: Taille, ecran: Taille): { x: number; y: number } {
  const echelle = Math.max(ecran.l / image.l, ecran.h / image.h)
  const dx = (ecran.l - image.l * echelle) / 2
  const dy = (ecran.h - image.h * echelle) / 2
  return { x: dx + point.x * image.l * echelle, y: dy + point.y * image.h * echelle }
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

/** Index d'image (0 … n-1) pour un avancement 0 → 1 de la séquence. */
export const imageDepuis = (t: number, n: number) => Math.round(borner(t) * (n - 1))

/** Ordre de chargement : 1 image sur `pas` d'abord, puis on comble les trous. */
export function ordreChargement(n: number, pas = 4): number[] {
  // La première puis la dernière image d'abord : début et fin du scroll nets.
  const ordre = n > 1 ? [0, n - 1] : [0]
  const vus = new Set(ordre)
  for (let p = pas; p >= 1; p = Math.floor(p / 2)) {
    for (let i = 0; i < n; i += p) {
      if (!vus.has(i)) {
        vus.add(i)
        ordre.push(i)
      }
    }
  }
  return ordre
}

/** Images à garder décodées autour de l'image courante. */
export function fenetre(courant: number, n: number, taille: number): number[] {
  const debut = borner(courant - Math.floor(taille / 2), 0, Math.max(0, n - taille))
  return Array.from({ length: Math.min(taille, n) }, (_, i) => debut + i)
}

/** Image chargée la plus proche de `cible` (null si aucune). */
export function plusProche(cible: number, disponibles: Iterable<number>): number | null {
  let meilleur: number | null = null
  for (const i of disponibles) {
    if (meilleur === null || Math.abs(i - cible) < Math.abs(meilleur - cible)) meilleur = i
  }
  return meilleur
}
