/**
 * versement.ts — calculs purs du versement du bidon (hero vidéo), testés dans
 * versement.test.ts : trajectoire du filet, placement du bidon basculé.
 */

export interface Pt {
  x: number
  y: number
}

/**
 * Point du filet d'huile, du goulot `a` à l'orifice `b`, pour t de 0 à 1. Parabole de
 * chute libre : l'huile quitte le goulot avec la pente `pente` (dy/dx, > 0 = vers le
 * bas), x avance régulièrement et y accélère. Courbe de Bézier quadratique dont le point
 * de contrôle est au milieu en x, sur la tangente de départ.
 */
export function pointFilet(a: Pt, b: Pt, pente: number, t: number): Pt {
  const c = { x: (a.x + b.x) / 2, y: a.y + (pente * (b.x - a.x)) / 2 }
  const u = 1 - t
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }
}

/** Demi-largeur et demi-hauteur d'un rectangle l × h tourné de `degres`. */
export function demiEncombrement(l: number, h: number, degres: number): { l: number; h: number } {
  const a = (degres * Math.PI) / 180
  const c = Math.abs(Math.cos(a))
  const s = Math.abs(Math.sin(a))
  return { l: (l * c + h * s) / 2, h: (l * s + h * c) / 2 }
}

export interface PlacementGoulot {
  /** Orifice du moteur à l'écran (px). */
  orifice: Pt
  /** Goulot visé, par rapport à l'orifice, en hauteurs de bidon. */
  cible: Pt
  /** Bidon (px) et position du pivot par rapport au goulot une fois basculé (px). */
  bidon: { l: number; h: number }
  goulotVersPivot: Pt
  angle: number
  /** Limites de l'écran : bord gauche et haut (sous l'en-tête) à ne pas dépasser. */
  gauche: number
  haut: number
}

/**
 * Goulot du bidon basculé : la cible demandée, décalée à droite ou vers le bas si le
 * bidon sortait de l'écran ou passait sous l'en-tête, sans jamais passer à droite de
 * l'orifice ni sous son niveau (l'huile doit tomber dedans).
 */
export function placerGoulot(p: PlacementGoulot): Pt {
  const g = { x: p.orifice.x + p.cible.x * p.bidon.h, y: p.orifice.y + p.cible.y * p.bidon.h }
  const demi = demiEncombrement(p.bidon.l, p.bidon.h, p.angle)
  const pivot = { x: g.x + p.goulotVersPivot.x, y: g.y + p.goulotVersPivot.y }
  const manqueX = p.gauche - (pivot.x - demi.l)
  if (manqueX > 0) g.x = Math.min(g.x + manqueX, p.orifice.x - 4)
  const manqueY = p.haut - (pivot.y - demi.h)
  if (manqueY > 0) g.y = Math.min(g.y + manqueY, p.orifice.y - 0.2 * p.bidon.h)
  return g
}
