/**
 * hero-video.config.ts — réglages du hero VIDÉO, un bloc par format (demande de Ben :
 * code séparé mobile / desktop). La timeline, les textes, le bidon et les couleurs
 * restent ceux de hero.config.ts (HERO), communs aux deux.
 *
 * Moteur (v3) : un vrai 4 cylindres en COUPE, rigide, au centre ; on voit l'intérieur
 * (arbre à cames, pistons et bielles, vilebrequin). Image fixe assets/ai/v3/K1.png,
 * trois plans caméra fixe enchaînés (journal ops/credits.md) :
 *   C1 l'huile entre par l'orifice et nappe l'arbre à cames ; C2 elle descend sur les
 *   pistons ; C3 elle atteint le vilebrequin. Composés sur K1 (métal rigide par
 *   construction) par ops/scripts/composer_huile.py, découpés par npm run hero:video.
 *
 * Bidon à DROITE, moteur à GAUCHE (Ben, 29/09 : « le bidon est au mauvais sens »). La
 * photo du bidon a son goulot en haut à gauche : penché vers la gauche, le goulot passe
 * devant et l'étiquette reste lisible (versement naturel, l'huile arrive au bec vers 60°).
 * À gauche du moteur, il aurait dû presque se retourner. Les images du moteur sont donc
 * retournées au découpage : son goulot passe en haut à droite, côté bidon. Après le
 * versement, la main emporte le bidon vers le haut ; les étiquettes prennent sa place.
 *
 * Conventions : zones en fractions de l'écran ; points du moteur en fractions de la
 * vidéo source retournée (1344×768), ramenés au recadrage de chaque format par `dansImage`.
 */
import manifeste from '@/assets/hero/video/manifest.json'
import type { Point, Zone } from '@/hero.config'

/** Points du moteur dans la vidéo source retournée (repérés sur K1, x → 1 − x). */
export const MOTEUR = {
  /** Ouverture du goulot de remplissage, en haut à droite du moteur : arrivée du filet. */
  orifice: { x: 0.6751, y: 0.1424 },
  /** Bords du moteur (calage à l'écran, colonne des étiquettes). */
  bordGauche: 0.205,
  bordDroit: 0.8,
  /** Pièces commentées (côté droit du moteur), dans l'ordre des textes HERO.textes.t3. */
  pieces: [
    { x: 0.6, y: 0.235 },
    { x: 0.648, y: 0.415 },
    { x: 0.648, y: 0.765 },
  ],
}

/** Plans de la vidéo, en fractions de t3 : l'huile nappe chaque pièce pendant son plan. */
export const PLANS_T3: [number, number][] = [
  [0, 0.34],
  [0.34, 0.67],
  [0.67, 0.95],
]

/**
 * Arrivée de l'étiquette (et du texte) de chaque pièce, en fraction de t3 : quand l'huile
 * l'a nappée. Celle des cames attend la fin du versement, pour ne pas croiser le bidon.
 */
export const APPARITIONS_REPERES = [0.45, 0.55, 0.76]

/** Point de la vidéo source → point de l'image d'un format (recadrée). */
export function dansImage(p: Point, r: Zone): Point {
  return { x: (p.x - r.x) / r.l, y: (p.y - r.y) / r.h }
}

export interface ReglagesHeroVideo {
  nom: 'mobile' | 'desktop'
  /** Hauteur de la zone de scroll (scène collée). */
  hauteur: string
  sequence: {
    dossier: string
    images: number
    largeur: number
    hauteur: number
    version: string
    /** Partie de la vidéo source gardée pour ce format (fractions). */
    recadrage: Zone
    /** Partie gardée quand l'image est rognée, ou place de l'image réduite (0,5 = centre). */
    focale: { x: number; y: number }
    /** Si présent : ce bord du moteur est calé à cette abscisse de l'écran (remplace focale.x). */
    cale?: { bord: 'gauche' | 'droite'; x: number }
    /** 1 = couvre la zone ; < 1 = image réduite dans la scène noire. */
    zoom: number
    /** Définition maximale du canvas (pixels par pixel CSS). */
    dprMax: number
    /** Chargées en parallèle. */
    parallele: number
  }
  /** moteur : rectangle du canvas de la séquence (plein écran sur desktop). */
  zones: { entete: Zone; moteur: Zone; bidon: Zone; textes: Zone; fin: Zone }
  /**
   * Hauteur de chute du filet, du goulot à l'orifice, en hauteurs de bidon. Le script en
   * déduit où la main tient le goulot pour que l'huile, à plein débit, tombe dans l'orifice.
   */
  chuteFilet: number
  /** Goulot devant (bidon à droite, penché vers la gauche) ou derrière (bidon à gauche). */
  bec: 'avant' | 'arriere'
  /** Côté des étiquettes : par rapport au moteur (colonne) ou au point (pastille). */
  etiquettes: 'gauche' | 'droite'
  /**
   * Étiquettes des pièces : 'colonne' = titre et texte à côté du moteur, reliés par
   * un trait ; 'pastille' = titre seul, collé au point, le texte reste en bas.
   */
  reperes: 'colonne' | 'pastille'
}

export const HERO_MOBILE: ReglagesHeroVideo = {
  nom: 'mobile',
  hauteur: '280svh',
  sequence: {
    dossier: '/hero-video/mobile',
    ...manifeste.mobile,
    // Moteur calé à gauche, en bas ; le bidon verse depuis la droite.
    focale: { x: 0.5, y: 0.5 },
    cale: { bord: 'gauche', x: 0.04 },
    zoom: 1,
    dprMax: 2,
    parallele: 4,
  },
  zones: {
    entete: { x: 0, y: 0, l: 1, h: 0.12 },
    moteur: { x: 0, y: 0.38, l: 1, h: 0.3 },
    bidon: { x: 0.67, y: 0.13, l: 0.3, h: 0.14 },
    textes: { x: 0.06, y: 0.68, l: 0.88, h: 0.28 },
    fin: { x: 0.06, y: 0.3, l: 0.88, h: 0.66 },
  },
  chuteFilet: 0.45,
  bec: 'avant',
  etiquettes: 'gauche',
  reperes: 'pastille',
}

export const HERO_DESKTOP: ReglagesHeroVideo = {
  nom: 'desktop',
  hauteur: '340svh',
  sequence: {
    dossier: '/hero-video/desktop',
    ...manifeste.desktop,
    // Image réduite, posée en bas et calée à gauche : le moteur occupe la gauche de
    // l'écran, l'orifice descend à un tiers de la hauteur, le bidon penché au-dessus
    // reste sous l'en-tête.
    focale: { x: 0.5, y: 1 },
    cale: { bord: 'gauche', x: 0.05 },
    zoom: 0.72,
    dprMax: 2,
    parallele: 6,
  },
  zones: {
    entete: { x: 0, y: 0, l: 1, h: 0.12 },
    moteur: { x: 0, y: 0, l: 1, h: 1 },
    bidon: { x: 0.74, y: 0.2, l: 0.2, h: 0.26 },
    textes: { x: 0.66, y: 0.55, l: 0.3, h: 0.4 },
    fin: { x: 0.5, y: 0.26, l: 0.46, h: 0.66 },
  },
  chuteFilet: 0.32,
  bec: 'avant',
  etiquettes: 'droite',
  reperes: 'colonne',
}

/** Largeur (px) à partir de laquelle on affiche le hero desktop. */
export const RUPTURE_DESKTOP = 900
