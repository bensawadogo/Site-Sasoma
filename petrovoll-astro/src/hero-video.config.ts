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
 * Composition de la Méthode V2 (Ben) : bidon à GAUCHE, moteur à DROITE ; le goulot est
 * en haut à gauche du moteur, côté bidon. Après le versement, le bidon se redresse et
 * s'efface (maquette client) : la colonne de gauche passe aux étiquettes des pièces.
 *
 * Conventions : zones en fractions de l'écran ; points du moteur en fractions de la
 * vidéo source (1344×768), ramenés au recadrage de chaque format par `dansImage`.
 */
import manifeste from '@/assets/hero/video/manifest.json'
import type { Point, Zone } from '@/hero.config'

/** Points du moteur dans la vidéo source (repérés sur K1). */
export const MOTEUR = {
  /** Ouverture du goulot de remplissage, en haut à gauche du moteur : arrivée du filet. */
  orifice: { x: 0.3249, y: 0.1424 },
  /** Bords du moteur : gauche (colonne des étiquettes sur desktop), droit (calage à l'écran). */
  bordGauche: 0.2,
  bordDroit: 0.795,
  /** Pièces commentées (côté gauche du moteur), dans l'ordre des textes HERO.textes.t3. */
  pieces: [
    { x: 0.4, y: 0.235 },
    { x: 0.352, y: 0.415 },
    { x: 0.352, y: 0.765 },
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
export const APPARITIONS_REPERES = [0.34, 0.47, 0.74]

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
    /** Si présent : le bord droit du moteur est calé à cette abscisse de l'écran (remplace focale.x). */
    caleDroite?: number
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
  /**
   * Étiquettes des pièces : 'colonne' = titre et texte à gauche du moteur, reliés par
   * un trait ; 'pastille' = titre seul, à droite du point, le texte reste en bas.
   */
  reperes: 'colonne' | 'pastille'
}

export const HERO_MOBILE: ReglagesHeroVideo = {
  nom: 'mobile',
  hauteur: '280svh',
  sequence: {
    dossier: '/hero-video/mobile',
    ...manifeste.mobile,
    // Zone plus haute que l'image : le moteur est calé à droite, le goulot reste assez
    // loin du bord gauche pour le bidon basculé.
    focale: { x: 0.5, y: 0.5 },
    caleDroite: 0.99,
    zoom: 1,
    dprMax: 2,
    parallele: 4,
  },
  zones: {
    entete: { x: 0, y: 0, l: 1, h: 0.12 },
    moteur: { x: 0, y: 0.38, l: 1, h: 0.3 }, // moteur en bas à droite (Méthode V2)
    bidon: { x: 0.03, y: 0.13, l: 0.3, h: 0.14 },
    textes: { x: 0.06, y: 0.68, l: 0.88, h: 0.28 },
    fin: { x: 0.06, y: 0.3, l: 0.88, h: 0.66 },
  },
  chuteFilet: 0.45,
  reperes: 'pastille',
}

export const HERO_DESKTOP: ReglagesHeroVideo = {
  nom: 'desktop',
  hauteur: '340svh',
  sequence: {
    dossier: '/hero-video/desktop',
    ...manifeste.desktop,
    // Image réduite, posée en bas et calée à droite : le moteur occupe la droite de
    // l'écran, l'orifice descend à un tiers de la hauteur, le bidon basculé au-dessus
    // reste sous l'en-tête.
    focale: { x: 0.5, y: 1 },
    caleDroite: 0.95,
    zoom: 0.72,
    dprMax: 2,
    parallele: 6,
  },
  zones: {
    entete: { x: 0, y: 0, l: 1, h: 0.12 },
    moteur: { x: 0, y: 0, l: 1, h: 1 },
    bidon: { x: 0.06, y: 0.2, l: 0.2, h: 0.26 },
    textes: { x: 0.04, y: 0.5, l: 0.21, h: 0.44 },
    fin: { x: 0.05, y: 0.26, l: 0.46, h: 0.66 },
  },
  chuteFilet: 0.32,
  reperes: 'colonne',
}

/** Largeur (px) à partir de laquelle on affiche le hero desktop. */
export const RUPTURE_DESKTOP = 900
