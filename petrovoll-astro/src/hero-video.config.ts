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
 * Bidon à DROITE (Ben) : les images du moteur sont retournées en miroir au découpage,
 * le goulot est donc en haut à droite du moteur, côté bidon.
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
  /** Bord gauche du moteur (colonne des étiquettes sur desktop, côté opposé au bidon). */
  bordGauche: 0.205,
  /** Pièces commentées, dans l'ordre des textes HERO.textes.t3 (cames, pistons, vilebrequin). */
  pieces: [
    { x: 0.345, y: 0.235 },
    { x: 0.328, y: 0.415 },
    { x: 0.328, y: 0.765 },
  ],
}

/** Plans de la vidéo, en fractions de t3 : l'huile nappe chaque pièce pendant son plan. */
export const PLANS_T3: [number, number][] = [
  [0, 0.34],
  [0.34, 0.67],
  [0.67, 0.95],
]

/** Retard de l'étiquette (et du texte) d'une pièce sur le début de son plan, en fraction de t3. */
export const RETARD_REPERE = 0.06

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
    /** 1 = couvre la zone ; < 1 = image réduite dans la scène noire. */
    zoom: number
    /** Définition maximale du canvas (pixels par pixel CSS). */
    dprMax: number
    /** Chargées en parallèle. */
    parallele: number
  }
  /** moteur : rectangle du canvas de la séquence (plein écran sur desktop). */
  zones: { entete: Zone; moteur: Zone; bidon: Zone; textes: Zone; fin: Zone }
  /** Bascule du bidon (degrés ; < 0 = sens inverse des aiguilles, il verse vers la gauche). */
  angleVersement: number
  /**
   * Goulot en fin de bascule, par rapport à l'orifice, en hauteurs de bidon (x > 0 : à
   * droite, y < 0 : au-dessus). Le script le rapproche de l'orifice si le bidon basculé
   * sortait de l'écran.
   */
  cibleGoulot: Point
  /** Épaisseur du filet d'huile à la sortie du goulot (px). */
  epaisseurFilet: number
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
    // Zone plus haute que l'image : elle déborde un peu à gauche ; la focale garde le
    // moteur entier et laisse l'orifice assez loin du bord droit pour le bidon basculé.
    focale: { x: 0.45, y: 0.5 },
    zoom: 1,
    dprMax: 2,
    parallele: 4,
  },
  zones: {
    entete: { x: 0, y: 0, l: 1, h: 0.12 },
    moteur: { x: 0, y: 0.3, l: 1, h: 0.4 },
    bidon: { x: 0.67, y: 0.13, l: 0.3, h: 0.13 },
    textes: { x: 0.06, y: 0.68, l: 0.88, h: 0.28 },
    fin: { x: 0.06, y: 0.3, l: 0.88, h: 0.66 },
  },
  angleVersement: -105,
  cibleGoulot: { x: 0.2, y: -0.62 },
  epaisseurFilet: 5,
  reperes: 'pastille',
}

export const HERO_DESKTOP: ReglagesHeroVideo = {
  nom: 'desktop',
  hauteur: '340svh',
  sequence: {
    dossier: '/hero-video/desktop',
    ...manifeste.desktop,
    // Image réduite et posée en bas : l'orifice descend à un tiers de l'écran, le bidon
    // basculé au-dessus reste sous l'en-tête.
    focale: { x: 0.5, y: 1 },
    zoom: 0.78,
    dprMax: 2,
    parallele: 6,
  },
  zones: {
    entete: { x: 0, y: 0, l: 1, h: 0.12 },
    moteur: { x: 0, y: 0, l: 1, h: 1 },
    bidon: { x: 0.77, y: 0.19, l: 0.18, h: 0.26 },
    textes: { x: 0.04, y: 0.5, l: 0.21, h: 0.44 },
    fin: { x: 0.05, y: 0.26, l: 0.46, h: 0.66 },
  },
  angleVersement: -105,
  cibleGoulot: { x: 0.5, y: -0.38 },
  epaisseurFilet: 9,
  reperes: 'colonne',
}

/** Largeur (px) à partir de laquelle on affiche le hero desktop. */
export const RUPTURE_DESKTOP = 900
