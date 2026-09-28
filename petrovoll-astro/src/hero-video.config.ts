/**
 * hero-video.config.ts — réglages du hero VIDÉO, un bloc par format (demande de Ben :
 * code séparé mobile / desktop). La timeline, les textes, le bidon et les couleurs
 * restent ceux de hero.config.ts (HERO), communs aux deux.
 *
 * Moteur : séquences d'images tirées des vidéos IA V1 (E1 → E2 : le cache s'ouvre,
 * les cames s'huilent) et V2 (E2 → E3 : rotation vers le moteur huilé), générées
 * sur deAPI (LTX-2.5, journal ops/credits.md) puis découpées par npm run hero:video.
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
    /** Orifice de remplissage dans l'image (arrivée du filet). */
    orifice: { x: number; y: number }
    /** Partie gardée quand l'image est rognée, ou place de l'image réduite (0,5 = centre). */
    focale: { x: number; y: number }
    /** 1 = couvre l'écran ; < 1 = image réduite dans la scène noire. */
    zoom: number
    /** Définition maximale du canvas (pixels par pixel CSS). */
    dprMax: number
    /** Chargées en parallèle. */
    parallele: number
  }
  zones: { entete: Zone; bidon: Zone; textes: Zone; fin: Zone }
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
    orifice: { x: 0.711, y: 0.449 },
    focale: { x: 0.5, y: 0.5 },
    zoom: 1,
    dprMax: 2,
    parallele: 4,
  },
  zones: {
    entete: { x: 0, y: 0, l: 1, h: 0.12 },
    bidon: { x: 0.3, y: 0.12, l: 0.4, h: 0.2 },
    textes: { x: 0.06, y: 0.74, l: 0.88, h: 0.22 },
    fin: { x: 0.06, y: 0.3, l: 0.88, h: 0.66 },
  },
  cibleGoulot: { y: 0.26 },
  filet: 'vertical',
  epaisseurFilet: 6,
}

export const HERO_DESKTOP: ReglagesHeroVideo = {
  nom: 'desktop',
  hauteur: '320svh',
  sequence: {
    dossier: '/hero-video/desktop',
    ...manifeste.desktop,
    orifice: { x: 0.772, y: 0.364 },
    focale: { x: 0.7, y: 0.55 },
    zoom: 0.8, // moteur moins envahissant : place à gauche pour le bidon et les textes
    dprMax: 2,
    parallele: 6,
  },
  zones: {
    entete: { x: 0, y: 0, l: 1, h: 0.12 },
    bidon: { x: 0.06, y: 0.14, l: 0.2, h: 0.34 },
    textes: { x: 0.05, y: 0.68, l: 0.4, h: 0.26 },
    fin: { x: 0.05, y: 0.26, l: 0.46, h: 0.66 },
  },
  cibleGoulot: { x: 0.5, y: 0.27 },
  filet: 'arc',
  epaisseurFilet: 9,
}

/** Largeur (px) à partir de laquelle on affiche le hero desktop. */
export const RUPTURE_DESKTOP = 900
