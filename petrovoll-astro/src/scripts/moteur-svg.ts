/**
 * moteur-svg.ts — animation du moteur vectoriel du hero (temps T3, décision D3).
 *
 * Le dessin vit dans src/components/hero/MoteurSVG.astro (repère 1000×1000).
 * Ici :
 *  - la cinématique pure (bielle-manivelle, arbre à cames à demi-vitesse,
 *    levée des soupapes), exportée et testée dans moteur-svg.test.ts ;
 *  - animerMoteur(), qui ne fait qu'écrire des attributs transform / opacity
 *    (aucun filtre, aucune géométrie recalculée). Une valeur identique à la
 *    précédente n'est pas réécrite.
 *
 * Convention d'angle : degrés, sens horaire à l'écran, 0 = cylindre 1 au point
 * mort haut (PMH) au début de l'admission. Ordre d'allumage 1-3-4-2.
 */

// ── Géométrie (doit correspondre au dessin, vérifié par le test) ──────────────
export const GEOMETRIE = {
  /** Abscisse de l'axe de chaque cylindre (1 → 4). */
  cylindres: [230, 410, 590, 770],
  /** Ordonnée de l'axe du vilebrequin. */
  axeVilebrequin: 641,
  /** Rayon de manivelle (demi-course). */
  rayonManivelle: 56,
  /** Entraxe de la bielle (maneton → axe de piston). */
  longueurBielle: 190,
  /** Ordonnée de l'axe de piston au PMH. */
  axePistonPMH: 395,
  /** Distance axe de piston → dessus du piston. */
  hauteurCalotte: 50,
  /** Ordonnée de l'axe de l'arbre à cames. */
  axeCames: 240,
  /** Décalage des soupapes par rapport à l'axe du cylindre (admission à gauche). */
  ecartSoupapes: 38,
  /** Ordonnée de la face des soupapes fermées. */
  faceSoupape: 329,
  /** Came : rayon de base, rayon du nez, distance centre → centre du nez. */
  came: { base: 22, nez: 8, excentration: 26 },
  /** Hauteur libre du ressort de soupape (retenue → siège). */
  hauteurRessort: 25,
  /** Siège du ressort (fixe). */
  siegeRessort: 312,
  /** Ouverture de remplissage (arrivée du filet d'huile). */
  remplissage: { x: 500, y: 120 },
} as const

/** Décalage de chaque cylindre dans le cycle de 720° (ordre d'allumage 1-3-4-2). */
export const PHASES = [0, 540, 180, 360] as const

/** Angle de cycle (en degrés vilebrequin) où chaque soupape est le plus ouverte. */
export const PIC_LEVEE = { admission: 90, echappement: 630 } as const

export type Sens = keyof typeof PIC_LEVEE
export type Temps = 'admission' | 'compression' | 'detente' | 'echappement'

export interface EtatMoteur {
  /** Rotation du vilebrequin, en degrés. */
  angle: number
  /** 0 → 1 : le couvre-culasse et le bloc deviennent transparents. */
  coupe: number
  /** 0 → 1 : l'huile nappe l'arbre à cames. */
  huileCames: number
  /** 0 → 1 : l'huile nappe les pistons et les cylindres. */
  huilePistons: number
  /** 0 → 1 : l'huile nappe le vilebrequin et ses paliers. */
  huileVilebrequin: number
}

const RAD = Math.PI / 180
const mod = (a: number, n: number) => ((a % n) + n) % n
const borner = (v: number) => Math.min(1, Math.max(0, v))
const rampe = (v: number, de: number, a: number) => borner((v - de) / (a - de))
const arrondi = (v: number) => Math.round(v * 100) / 100

// ── Cinématique pure ──────────────────────────────────────────────────────────

/** Position du cylindre `i` (0 → 3) dans son cycle à 4 temps, de 0 à 720°. */
export const angleCycle = (angle: number, i: number) => mod(angle - PHASES[i], 720)

/** Temps moteur en cours pour le cylindre `i`. */
export function tempsMoteur(angle: number, i: number): Temps {
  const c = angleCycle(angle, i)
  return c < 180 ? 'admission' : c < 360 ? 'compression' : c < 540 ? 'detente' : 'echappement'
}

/** Angle de la manivelle du cylindre `i` (0 = maneton en haut), de 0 à 360°. */
export const angleManivelle = (angle: number, i: number) => mod(angle - PHASES[i], 360)

/** Position du maneton du cylindre `i` (repère du dessin). */
export function maneton(angle: number, i: number): { x: number; y: number } {
  const t = angleManivelle(angle, i) * RAD
  const { cylindres, axeVilebrequin, rayonManivelle: r } = GEOMETRIE
  return { x: cylindres[i] + r * Math.sin(t), y: axeVilebrequin - r * Math.cos(t) }
}

/** Ordonnée de l'axe de piston du cylindre `i` (système bielle-manivelle). */
export function axePiston(angle: number, i: number): number {
  const t = angleManivelle(angle, i) * RAD
  const { axeVilebrequin, rayonManivelle: r, longueurBielle: l } = GEOMETRIE
  return axeVilebrequin - (r * Math.cos(t) + Math.sqrt(l * l - (r * Math.sin(t)) ** 2))
}

/** Inclinaison de la bielle (degrés, sens horaire ; 0 = verticale). */
export function angleBielle(angle: number, i: number): number {
  const t = angleManivelle(angle, i) * RAD
  const { rayonManivelle: r, longueurBielle: l } = GEOMETRIE
  return -Math.asin((r * Math.sin(t)) / l) / RAD
}

/** Rotation de l'arbre à cames : demi-vitesse du vilebrequin. */
export const angleArbreCames = (angle: number) => angle / 2

/**
 * Rotation de la came (nez vers le bas = 0) qui commande la soupape `sens`
 * du cylindre `i`. Tourne à la vitesse de l'arbre à cames.
 */
export const rotationCame = (angle: number, i: number, sens: Sens) =>
  angleArbreCames(angle) - (PHASES[i] + PIC_LEVEE[sens]) / 2

/**
 * Levée d'un poussoir plat sous une came tournée de `rotation` degrés : c'est
 * la fonction de support de l'enveloppe convexe (cercle de base + nez).
 */
export function leveeCame(rotation: number): number {
  const { base, nez, excentration } = GEOMETRIE.came
  return Math.max(0, excentration * Math.cos(rotation * RAD) + nez - base)
}

/** Levée de la soupape `sens` du cylindre `i`. */
export const leveeSoupape = (angle: number, i: number, sens: Sens) => leveeCame(rotationCame(angle, i, sens))

// ── Animation (DOM) ───────────────────────────────────────────────────────────

type Phase = 'cames' | 'pistons' | 'vilebrequin'
type Mode = 'opacite' | 'extinction' | 'echelle-x' | 'echelle-y' | 'translation-y'

interface Ecriture {
  el: Element
  attr: 'transform' | 'opacity'
  dernier: string
}
interface Organe {
  x: number
  cyl: number
  sens: Sens
  ecr: Ecriture
}
interface Film {
  phase: Phase
  mode: Mode
  o: number
  de: number
  a: number
  max: number
  ecr: Ecriture
}
interface Goutte {
  x: number
  y0: number
  y1: number
  decalage: number
  phase: Phase
  de: number
  a: number
  pos: Ecriture
  opa: Ecriture
}
interface Cache {
  exterieur: Ecriture[]
  cames: Organe[]
  soupapes: Organe[]
  ressorts: Organe[]
  pistons: Organe[]
  bielles: Organe[]
  manivelles: Organe[]
  films: Film[]
  gouttes: Goutte[]
}

const caches = new WeakMap<SVGSVGElement, Cache>()

const ecriture = (el: Element, attr: Ecriture['attr']): Ecriture => ({ el, attr, dernier: el.getAttribute(attr) ?? '' })

function ecrire(e: Ecriture, valeur: string) {
  if (e.dernier === valeur) return
  e.el.setAttribute(e.attr, valeur)
  e.dernier = valeur
}

const nombre = (el: Element, nom: string, defaut = 0) => {
  const v = el.getAttribute(`data-${nom}`)
  return v === null || v === '' ? defaut : Number(v)
}

function construireCache(racine: SVGSVGElement): Cache {
  const tous = (sel: string) => [...racine.querySelectorAll(sel)]
  // Ordre du DOM : un organe par cylindre (1 → 4), ou deux (admission puis
  // échappement) pour la distribution. L'abscisse vient de GEOMETRIE.
  const organes = (sel: string, parSoupape = false): Organe[] =>
    tous(sel).map((el, k) => {
      const cyl = parSoupape ? k >> 1 : k
      const ech = parSoupape && k % 2 === 1
      const dx = parSoupape ? (ech ? 1 : -1) * GEOMETRIE.ecartSoupapes : 0
      return {
        x: GEOMETRIE.cylindres[cyl] + dx,
        cyl,
        sens: ech ? 'echappement' : 'admission',
        ecr: ecriture(el, 'transform'),
      }
    })
  return {
    exterieur: tous('[data-exterieur]').map((el) => ecriture(el, 'opacity')),
    cames: organes('[data-came]', true),
    soupapes: organes('[data-soupape]', true),
    ressorts: organes('[data-ressort]', true),
    pistons: organes('[data-piston]'),
    bielles: organes('[data-bielle]'),
    manivelles: organes('[data-manivelle]'),
    films: tous('[data-film]').map((el) => {
      const mode = (el.getAttribute('data-mode') ?? 'opacite') as Mode
      const opacite = mode === 'opacite' || mode === 'extinction'
      return {
        phase: el.getAttribute('data-film') as Phase,
        mode,
        o: nombre(el, 'o'),
        de: nombre(el, 'de'),
        a: nombre(el, 'a', 1),
        max: nombre(el, 'max', 1),
        ecr: ecriture(el, opacite ? 'opacity' : 'transform'),
      }
    }),
    gouttes: tous('[data-goutte]').map((el) => ({
      x: nombre(el, 'x'),
      y0: nombre(el, 'y0'),
      y1: nombre(el, 'y1'),
      decalage: nombre(el, 'decalage'),
      phase: el.getAttribute('data-goutte') as Phase,
      de: nombre(el, 'de'),
      a: nombre(el, 'de') + 0.15,
      pos: ecriture(el, 'transform'),
      opa: ecriture(el, 'opacity'),
    })),
  }
}

/**
 * Met le moteur dans l'état demandé. À appeler dans requestAnimationFrame ;
 * n'écrit que des attributs transform et opacity.
 */
export function animerMoteur(racine: SVGSVGElement, etat: EtatMoteur): void {
  let c = caches.get(racine)
  if (!c) {
    c = construireCache(racine)
    caches.set(racine, c)
  }
  const { angle } = etat
  const g = GEOMETRIE
  const huile: Record<Phase, number> = {
    cames: borner(etat.huileCames),
    pistons: borner(etat.huilePistons),
    vilebrequin: borner(etat.huileVilebrequin),
  }

  // Coupe : l'extérieur s'efface (courbe rapide, l'intérieur se lit dès 0,5).
  const ext = String(arrondi((1 - borner(etat.coupe)) ** 2))
  for (const e of c.exterieur) ecrire(e, ext)

  // Distribution : cames (rotation) et soupapes (levée), ressorts (compression).
  for (const o of c.cames) {
    ecrire(o.ecr, `translate(${o.x} ${g.axeCames}) rotate(${arrondi(mod(rotationCame(angle, o.cyl, o.sens), 360))})`)
  }
  for (const o of c.soupapes) ecrire(o.ecr, `translate(${o.x} ${arrondi(leveeSoupape(angle, o.cyl, o.sens))})`)
  for (const o of c.ressorts) {
    const k = arrondi(1 - leveeSoupape(angle, o.cyl, o.sens) / g.hauteurRessort)
    ecrire(o.ecr, `matrix(1 0 0 ${k} ${o.x} ${arrondi(g.siegeRessort * (1 - k))})`)
  }

  // Attelage mobile : pistons, bielles, vilebrequin.
  for (const o of c.pistons) ecrire(o.ecr, `translate(${o.x} ${arrondi(axePiston(angle, o.cyl))})`)
  for (const o of c.bielles) {
    const m = maneton(angle, o.cyl)
    ecrire(o.ecr, `translate(${arrondi(m.x)} ${arrondi(m.y)}) rotate(${arrondi(angleBielle(angle, o.cyl))})`)
  }
  for (const o of c.manivelles) {
    ecrire(o.ecr, `translate(${o.x} ${g.axeVilebrequin}) rotate(${arrondi(angleManivelle(angle, o.cyl))})`)
  }

  // Films d'huile : chacun suit la progression de sa phase entre data-de et data-a.
  for (const f of c.films) {
    const v = rampe(huile[f.phase], f.de, f.a)
    const s = arrondi(v)
    switch (f.mode) {
      case 'opacite':
        ecrire(f.ecr, String(arrondi(v * f.max)))
        break
      case 'extinction':
        ecrire(f.ecr, String(arrondi((1 - v) * f.max)))
        break
      case 'echelle-x': // s'étale depuis x = data-o
        ecrire(f.ecr, `matrix(${s} 0 0 1 ${arrondi(f.o * (1 - s))} 0)`)
        break
      case 'echelle-y': // coule vers le bas depuis y = data-o
        ecrire(f.ecr, `matrix(1 0 0 ${s} 0 ${arrondi(f.o * (1 - s))})`)
        break
      case 'translation-y': // monte de data-o unités jusqu'à sa place
        ecrire(f.ecr, `translate(0 ${arrondi(f.o * (1 - v))})`)
        break
    }
  }

  // Gouttes : tombent au rythme du moteur (une chute par tour), puis s'effacent.
  for (const d of c.gouttes) {
    const porte = rampe(huile[d.phase], d.de, d.a)
    const t = mod(angle / 360 + d.decalage, 1)
    ecrire(d.pos, `translate(${d.x} ${arrondi(d.y0 + (d.y1 - d.y0) * t * t)})`)
    ecrire(d.opa, String(arrondi(porte * Math.min(1, t * 8, (1 - t) * 5))))
  }
}
