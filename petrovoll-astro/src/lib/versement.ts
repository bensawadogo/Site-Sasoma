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
 * chute libre : l'huile quitte le goulot avec la pente `pente` (> 0 = vers le bas, dans
 * le sens du versement, vers la gauche comme vers la droite), x avance régulièrement et
 * y accélère. Courbe de Bézier quadratique dont le point de contrôle est au milieu en x,
 * sur la tangente de départ.
 */
export function pointFilet(a: Pt, b: Pt, pente: number, t: number): Pt {
  const c = { x: (a.x + b.x) / 2, y: a.y + (pente * Math.abs(b.x - a.x)) / 2 }
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
  /** Limites de l'écran : bords gauche et droit, haut (sous l'en-tête) à ne pas dépasser. */
  gauche: number
  droite: number
  haut: number
}

/**
 * Goulot du bidon basculé : la cible demandée, rapprochée de l'orifice ou descendue si
 * le bidon sortait de l'écran ou passait sous l'en-tête, sans jamais passer de l'autre
 * côté de l'orifice ni sous son niveau (l'huile doit tomber dedans).
 */
export function placerGoulot(p: PlacementGoulot): Pt {
  const g = { x: p.orifice.x + p.cible.x * p.bidon.h, y: p.orifice.y + p.cible.y * p.bidon.h }
  const demi = demiEncombrement(p.bidon.l, p.bidon.h, p.angle)
  const pivot = { x: g.x + p.goulotVersPivot.x, y: g.y + p.goulotVersPivot.y }
  if (p.cible.x <= 0) {
    // Bidon à gauche de l'orifice : il ne doit pas sortir à gauche.
    const manque = p.gauche - (pivot.x - demi.l)
    if (manque > 0) g.x = Math.min(g.x + manque, p.orifice.x - 4)
  } else {
    // Bidon à droite : il ne doit pas sortir à droite.
    const manque = pivot.x + demi.l - p.droite
    if (manque > 0) g.x = Math.max(g.x - manque, p.orifice.x + 4)
  }
  const manqueY = p.haut - (pivot.y - demi.h)
  if (manqueY > 0) g.y = Math.min(g.y + manqueY, p.orifice.y - 0.2 * p.bidon.h)
  return g
}

// ── Chorégraphie naturelle du versement (spec « versement naturel », 29/09) ──────────
// Tout est une fonction pure de u (0 → 1 sur la séquence du bidon) : le scroll arrière
// rembobine. Angles en degrés ; positif = sens horaire à l'écran.

/** Courbe d'accélération façon CSS cubic-bezier(x1, y1, x2, y2). */
export function courbe(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  const bez = (t: number, a: number, b: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    // x(t) est croissante : dichotomie (24 pas, précision ≈ 1e-7).
    let bas = 0
    let haut = 1
    for (let k = 0; k < 24; k++) {
      const t = (bas + haut) / 2
      if (bez(t, x1, x2) < x) bas = t
      else haut = t
    }
    return bez((bas + haut) / 2, y1, y2)
  }
}

const borne = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const dans = (u: number, a: number, b: number) => borne((u - a) / (b - a))
const lin = (a: number, b: number, t: number) => a + (b - a) * t

/** Phases de la séquence du bidon (fractions de u). */
export const PHASES = {
  anticipation: [0, 0.06],
  levee: [0.06, 0.35],
  approche: [0.35, 0.45],
  versement: [0.45, 0.76],
  coupure: [0.76, 0.81],
  sortie: [0.81, 1],
} as const

const E_LEVEE = courbe(0.45, 0, 0.25, 1)
const E_APPROCHE = courbe(0.2, 0.7, 0.3, 1)
const E_VERSEMENT = courbe(0.4, 0, 0.8, 1)
const E_COUPURE = courbe(0.5, 0, 0.2, 1)
const E_SORTIE = courbe(0.55, 0, 0.9, 0.6)

/**
 * Façon de verser, selon le côté du goulot. La photo du bidon a son goulot en haut à
 * GAUCHE : penché vers la gauche, le goulot passe devant (versement naturel, l'huile
 * arrive au bec vers 60°, l'étiquette reste lisible) ; penché vers la droite, il reste
 * derrière (le bidon doit presque se retourner, de 97° à 128°). Angles en valeur
 * absolue ; `sens` : +1 = horaire. Seuils : angle où l'huile atteint le bec selon le
 * remplissage (simulation de la silhouette du bidon : volume conservé, surface horizontale).
 */
export interface Profil {
  sens: 1 | -1
  levee: number
  debutVersement: number
  finVersement: number
  coupure: number
  sortie: number
  seuils: [number, number][]
}

/** Bidon à droite du moteur, penché vers la gauche : le goulot passe devant. */
export const BEC_AVANT: Profil = {
  sens: -1,
  levee: 40,
  debutVersement: 64,
  finVersement: 92,
  coupure: 52,
  sortie: 20,
  seuils: [
    [0.1, 102],
    [1 / 3, 84],
    [0.5, 71],
    [2 / 3, 60],
    [0.9, 34],
  ],
}

/** Bidon à gauche du moteur, penché vers la droite : le goulot reste derrière. */
export const BEC_ARRIERE: Profil = {
  sens: 1,
  levee: 80,
  debutVersement: 106,
  finVersement: 128,
  coupure: 88,
  sortie: 40,
  seuils: [
    [0.1, 147],
    [1 / 3, 121],
    [0.5, 109],
    [2 / 3, 97],
    [0.9, 79],
  ],
}

/**
 * Angle du bidon : petit recul (anticipation), levée, approche prudente jusqu'à ce que
 * l'huile atteigne le bec, versement en inclinant peu à peu (il se vide), coupure sèche,
 * puis la main l'emporte en le redressant à moitié. Signé selon `profil.sens`.
 */
export function angleBidon(u: number, profil: Profil = BEC_ARRIERE): number {
  const P = PHASES
  const { levee, debutVersement: d, finVersement: f, coupure: c, sortie: s } = profil
  let a: number
  if (u < P.levee[0]) a = -3 * dans(u, ...P.anticipation)
  else if (u < P.approche[0]) a = lin(-3, levee, E_LEVEE(dans(u, ...P.levee)))
  else if (u < P.versement[0]) a = lin(levee, d, E_APPROCHE(dans(u, ...P.approche)))
  else if (u < P.coupure[0]) {
    const v = dans(u, ...P.versement)
    // Dérive de la main : ±0,6°, deux cycles ; le débit « respire » avec elle.
    a = lin(d, f, E_VERSEMENT(v)) + 0.6 * Math.sin(2 * Math.PI * 2 * v) * Math.sin(Math.PI * v)
  } else if (u < P.sortie[0]) a = lin(f, c, E_COUPURE(dans(u, ...P.coupure)))
  else a = lin(c, s, E_SORTIE(dans(u, ...P.sortie)))
  return profil.sens * a
}

/** Angle (valeur absolue) où l'huile atteint le bec, selon le remplissage. */
export function angleDebut(remplissage: number, profil: Profil = BEC_ARRIERE): number {
  const S = profil.seuils
  const r = borne(remplissage, S[0][0], S[S.length - 1][0])
  for (let k = 1; k < S.length; k++) {
    const [r1, a1] = S[k]
    const [r0, a0] = S[k - 1]
    if (r <= r1) return lin(a0, a1, (r - r0) / (r1 - r0))
  }
  return S[S.length - 1][1]
}

/** Débit (0 → 1) : nul tant que l'huile n'atteint pas le bec, plein 12° plus loin. */
export function debit(angle: number, remplissage: number, profil: Profil = BEC_ARRIERE): number {
  return borne((Math.abs(angle) - angleDebut(remplissage, profil)) / 12) ** 1.5
}

export interface EtatVersement {
  angle: number
  remplissage: number
  debit: number
}

/**
 * Table du versement : le remplissage baisse de `depart` à `arrivee` au rythme du débit
 * (intégré une fois, sur `n` pas). Renvoie l'état pour tout u, par interpolation.
 */
export function tableVersement(depart: number, arrivee: number, profil: Profil = BEC_ARRIERE, n = 256): (u: number) => EtatVersement {
  const simuler = (k: number) => {
    const r = new Float64Array(n + 1)
    const d = new Float64Array(n + 1)
    r[0] = depart
    for (let i = 0; i <= n; i++) {
      d[i] = debit(angleBidon(i / n, profil), r[i], profil)
      if (i < n) r[i + 1] = Math.max(0.05, r[i] - (k * d[i]) / n)
    }
    return { r, d }
  }
  // Coefficient de vidage : deux passes suffisent à tomber sur `arrivee`.
  let k = 1
  for (let passe = 0; passe < 3; passe++) {
    const { r } = simuler(k)
    const perdu = depart - r[n]
    if (perdu > 1e-6) k *= (depart - arrivee) / perdu
  }
  const { r, d } = simuler(k)
  return (u: number) => {
    const x = borne(u) * n
    const i = Math.min(n - 1, Math.floor(x))
    const f = x - i
    return { angle: angleBidon(borne(u), profil), remplissage: lin(r[i], r[i + 1], f), debit: lin(d[i], d[i + 1], f) }
  }
}

/**
 * Ballottement de la surface de l'huile (degrés) : retard sur la vitesse de rotation,
 * puis oscillations amorties après chaque arrêt (2 Hz, amortissement 0,15). `duree` :
 * durée simulée de la séquence, en secondes.
 */
export function ballottement(u: number, duree: number, profil: Profil = BEC_ARRIERE): number {
  const pas = 0.004
  // Vitesse de rotation en degrés par seconde simulée.
  const vitesse = (angleBidon(borne(u + pas), profil) - angleBidon(borne(u - pas), profil)) / (2 * pas) / duree
  let phi = borne(-0.08 * vitesse, -6, 6)
  const w = 2 * Math.PI * 2
  const zeta = 0.15
  const wd = w * Math.sqrt(1 - zeta * zeta)
  for (const uk of [PHASES.approche[0], PHASES.versement[0], PHASES.sortie[0]]) {
    const s = (u - uk) * duree
    if (s > 0) phi += profil.sens * 5 * Math.exp(-zeta * w * s) * Math.sin(wd * s)
  }
  return phi
}

/** Rotation d'un vecteur de `degres` (sens horaire à l'écran). */
export function tourner(v: Pt, degres: number): Pt {
  const a = (degres * Math.PI) / 180
  return { x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) }
}

export interface GeometrieBidon {
  /** Positions au repos, à l'écran (px) : pivot de rotation (origine CSS), goulot, poignée. */
  pivot: Pt
  goulot: Pt
  poignee: Pt
  hauteur: number
  /** Où se tient le goulot pendant le versement (px). */
  goulotVerse: Pt
}

export interface PoseBidon {
  angle: number
  /** Translation CSS à appliquer (px), rotation autour du pivot. */
  translation: Pt
  /** Position du goulot à l'écran (px). */
  goulot: Pt
}

/**
 * Pose du bidon pour u : la main le tient par la poignée pour le lever (arc vers le
 * haut), garde le goulot presque immobile au-dessus de l'orifice pendant qu'elle
 * l'incline, puis l'emporte vers le haut, du côté d'où il vient (il sort de l'image en
 * s'effaçant). Les passages d'un point d'appui à l'autre tombent juste (même position).
 */
export function poseBidon(u: number, g: GeometrieBidon, profil: Profil = BEC_ARRIERE): PoseBidon {
  const P = PHASES
  const angle = angleBidon(u, profil)
  const h = g.hauteur
  // Côté d'où vient le bidon : -1 = à gauche de l'orifice, +1 = à droite.
  const cote = -profil.sens
  const goulotLocal = { x: g.goulot.x - g.pivot.x, y: g.goulot.y - g.pivot.y }
  const poigneeLocal = { x: g.poignee.x - g.pivot.x, y: g.poignee.y - g.pivot.y }
  const poigneeVersGoulot = (a: number) => tourner({ x: goulotLocal.x - poigneeLocal.x, y: goulotLocal.y - poigneeLocal.y }, a)
  // Fin de levée : goulot un peu en retrait (plus haut, côté bidon) de sa place de versement.
  const approche = { x: g.goulotVerse.x + cote * 0.08 * h, y: g.goulotVerse.y - 0.06 * h }
  const bas = { x: g.poignee.x, y: g.poignee.y + 0.015 * h } // anticipation : il s'enfonce un peu

  let appui: 'poignee' | 'goulot'
  let cible: Pt
  if (u < P.levee[0]) {
    appui = 'poignee'
    cible = { x: g.poignee.x, y: lin(g.poignee.y, bas.y, dans(u, ...P.anticipation)) }
  } else if (u < P.approche[0]) {
    appui = 'poignee'
    const e = E_LEVEE(dans(u, ...P.levee))
    const v = poigneeVersGoulot(profil.sens * profil.levee)
    const fin = { x: approche.x - v.x, y: approche.y - v.y }
    cible = { x: lin(bas.x, fin.x, e), y: lin(bas.y, fin.y, e) - 0.15 * h * Math.sin(Math.PI * e) }
  } else if (u < P.sortie[0]) {
    appui = 'goulot'
    if (u < P.versement[0]) {
      const e = E_APPROCHE(dans(u, ...P.approche))
      cible = { x: lin(approche.x, g.goulotVerse.x, e), y: lin(approche.y, g.goulotVerse.y, e) }
    } else if (u < P.coupure[0]) {
      // La main dérive un peu (environ 4 px, deux cycles) : un geste humain.
      const v = dans(u, ...P.versement)
      const d = 0.017 * h * Math.sin(2 * Math.PI * 2 * v) * Math.sin(Math.PI * v)
      cible = { x: g.goulotVerse.x + d, y: g.goulotVerse.y + d * 0.5 }
    } else cible = g.goulotVerse
  } else {
    appui = 'poignee'
    // Sortie : la main l'emporte vers le haut, un peu vers son côté, en accélérant ; il
    // passe au-dessus des étiquettes.
    const e = E_SORTIE(dans(u, ...P.sortie))
    const v = poigneeVersGoulot(profil.sens * profil.coupure)
    const debut = { x: g.goulotVerse.x - v.x, y: g.goulotVerse.y - v.y }
    cible = { x: debut.x + cote * 0.35 * h * e, y: debut.y - 0.8 * h * e }
  }
  const local = appui === 'poignee' ? poigneeLocal : goulotLocal
  const r = tourner(local, angle)
  const translation = { x: cible.x - g.pivot.x - r.x, y: cible.y - g.pivot.y - r.y }
  const rg = tourner(goulotLocal, angle)
  return { angle, translation, goulot: { x: g.pivot.x + translation.x + rg.x, y: g.pivot.y + translation.y + rg.y } }
}

/**
 * Direction de sortie de l'huile : le long du col, jamais vers le haut (sous 90°, le col
 * pointe vers le ciel et l'huile passe par-dessus la lèvre), rabattue vers le bas à
 * faible débit (effet théière).
 */
export function directionFilet(angle: number, debitCourant: number): Pt {
  const a = (angle * Math.PI) / 180
  const col = { x: Math.sin(a), y: Math.max(0.15, -Math.cos(a)) }
  const k = 1 - 0.7 * debitCourant
  const d = { x: lin(col.x, 0, k), y: lin(col.y, 1, k) }
  const n = Math.hypot(d.x, d.y) || 1
  return { x: d.x / n, y: d.y / n }
}

/** Vitesse de sortie (m/s) selon le débit. */
export const vitesseSortie = (debitCourant: number) => 0.35 + 0.25 * debitCourant
