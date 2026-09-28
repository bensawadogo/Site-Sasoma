/**
 * hero-video.config.ts — réglages du hero VIDÉO, un bloc par format (demande de Ben :
 * code séparé mobile / desktop). La timeline, les textes, le bidon et les couleurs
 * restent ceux de hero.config.ts (HERO), communs aux deux.
 *
 * Moteur : un vrai bloc moteur, rigide (image assets/ai/v2/moteur-1101.png, orifice de
 * remplissage ouvert sur le cache culbuteurs). Séquences tirées de deux vidéos IA
 * enchaînées, générées sur deAPI (LTX-2.5, journal ops/credits.md) à partir d'UNE
 * image (pas de fondu entre images différentes, donc pas de déformation) :
 *   V1 : la caméra avance vers l'orifice ; V2 : l'huile dorée coule dans l'orifice.
 * Découpées par npm run hero:video.
 *
 * Conventions : zones en fractions de l'écran ; points du moteur en fractions de
 * l'image de la séquence (repérés sur la première image).
 */
import manifeste from '@/assets/hero/video/manifest.json'
import type { Zone } from '@/hero.config'

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
    /** Orifice de remplissage dans la 1re image (arrivée du filet). */
    orifice: { x: number; y: number }
    /** Fraction de t3 où la vidéo démarre : avant, 1re image fixe (le filet finit de couler). */
    debut: number
    /** Partie gardée quand l'image est rognée, ou place de l'image réduite (0,5 = centre). */
    focale: { x: number; y: number }
    /** 1 = couvre l'écran ; < 1 = image réduite dans la scène noire. */
    zoom: number
    /** Définition maximale du canvas (pixels par pixel CSS). */
    dprMax: number
    /** Chargées en parallèle. */
    parallele: number
  }
  /** moteur : rectangle du canvas de la séquence (plein écran sur desktop). */
  zones: { entete: Zone; moteur: Zone; bidon: Zone; textes: Zone; fin: Zone }
  /** Arrivée du goulot en fin de bascule (fractions de l'écran) ; x absent = aligné sur l'orifice. */
  cibleGoulot: { x?: number; y: number }
  /** Forme du filet : chute verticale ou arc (départ horizontal). */
  filet: 'vertical' | 'arc'
  epaisseurFilet: number
}

export const HERO_MOBILE: ReglagesHeroVideo = {
  nom: 'mobile',
  hauteur: '260svh',
  sequence: {
    dossier: '/hero-video/mobile',
    ...manifeste.mobile,
    orifice: { x: 0.646, y: 0.3848 }, // dans le carré recadré (build-hero-video.mjs)
    debut: 0.2,
    focale: { x: 0.5, y: 0.5 },
    zoom: 1,
    dprMax: 2,
    parallele: 4,
  },
  zones: {
    entete: { x: 0, y: 0, l: 1, h: 0.12 },
    moteur: { x: 0, y: 0.29, l: 1, h: 0.46 }, // carré pleine largeur, bords fondus
    bidon: { x: 0.3, y: 0.11, l: 0.4, h: 0.2 },
    textes: { x: 0.06, y: 0.74, l: 0.88, h: 0.22 },
    fin: { x: 0.06, y: 0.3, l: 0.88, h: 0.66 },
  },
  cibleGoulot: { y: 0.27 },
  filet: 'vertical',
  epaisseurFilet: 6,
}

export const HERO_DESKTOP: ReglagesHeroVideo = {
  nom: 'desktop',
  hauteur: '320svh',
  sequence: {
    dossier: '/hero-video/desktop',
    ...manifeste.desktop,
    orifice: { x: 0.7235, y: 0.3848 },
    debut: 0.2,
    focale: { x: 0.7, y: 0.5 },
    zoom: 1,
    dprMax: 2,
    parallele: 6,
  },
  zones: {
    entete: { x: 0, y: 0, l: 1, h: 0.12 },
    moteur: { x: 0, y: 0, l: 1, h: 1 },
    bidon: { x: 0.08, y: 0.15, l: 0.16, h: 0.27 },
    textes: { x: 0.05, y: 0.68, l: 0.4, h: 0.26 },
    fin: { x: 0.05, y: 0.26, l: 0.46, h: 0.66 },
  },
  // Le bidon vient au-dessus de l'orifice et verse à la verticale, comme sur mobile.
  cibleGoulot: { y: 0.245 },
  filet: 'vertical',
  epaisseurFilet: 9,
}

/** Largeur (px) à partir de laquelle on affiche le hero desktop. */
export const RUPTURE_DESKTOP = 900
