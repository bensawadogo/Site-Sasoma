/**
 * hero.config.ts — configuration UNIQUE du hero au scroll (BRIEF-MAITRE.md §8).
 *
 * Tout ce qui se règle sans toucher au code est ici : paliers, temps de la
 * timeline, mise en page, ancres, cadrages du moteur, textes et CTA.
 *
 * Conventions :
 *  - progression du scroll de 0 (haut du hero) à 1 (fin du hero) ;
 *  - zones en fractions de l'ÉCRAN ; ancres du bidon en fractions de la photo ;
 *    points du moteur en fractions de son dessin (repère carré 1000×1000) ;
 *  - hero.config.test.ts vérifie la cohérence de l'ensemble.
 *
 * Décision D3 (TODO.md) : le moteur est une illustration SVG animée par le
 * scroll (src/components/hero/MoteurSVG.astro), pas une vidéo IA.
 */

import geometrieBidon from '@/assets/hero/bidon/geometrie.json'
import type { CleCadrage } from '@/lib/hero-timeline'

export type Palier = 'lite' | 'standard' | 'full'
export type Format = 'mobile' | 'desktop'

export interface Point {
  x: number
  y: number
}

/** Rectangle en fractions de l'écran. */
export interface Zone {
  x: number
  y: number
  l: number
  h: number
}

export interface Temps {
  id: 'ouverture' | 't1' | 't2' | 't3' | 'fin'
  debut: number
  fin: number
}

export const HERO = {
  /** Hauteur de la zone de scroll (le hero reste collé en `position: sticky`). */
  hauteur: { mobile: '250svh', desktop: '300svh' },
  /** Au-delà de cette largeur (px) on passe en mise en page desktop. */
  pointDeRupture: 900,

  // ── Timeline (§8, plages contiguës de 0 à 1) ──────────────────────────────
  temps: [
    { id: 'ouverture', debut: 0, fin: 0.08 },
    { id: 't1', debut: 0.08, fin: 0.35 }, // l'huile monte dans le bidon
    { id: 't2', debut: 0.35, fin: 0.55 }, // bouchon, bascule 115°, filet d'huile
    { id: 't3', debut: 0.55, fin: 0.92 }, // moteur : cames → pistons → vilebrequin
    { id: 'fin', debut: 0.92, fin: 1 }, // produits + CTA
  ] satisfies Temps[],
  /** Bascule du bidon pendant t2 (degrés, sens horaire sur mobile). */
  angleVersement: 115,

  // ── Paliers (§8) ───────────────────────────────────────────────────────────
  // Le moteur étant vectoriel, les paliers ne changent plus le poids téléchargé
  // (identique partout) mais le coût de rendu : définition du canvas du filet et
  // animations continues.
  paliers: {
    lite: { dprMax: 1, refletAnime: false }, // saveData, 2g/3g, ≤ 2 Go ou mouvement réduit
    standard: { dprMax: 1.5, refletAnime: true },
    full: { dprMax: 2, refletAnime: true }, // ≥ 6 Go et 4g/wifi, ou ordinateur
  },
  /**
   * Garde-fou : on descend d'un palier si l'intervalle moyen entre deux images
   * dépasse `msParImage` pendant `dureeMs` (tout compris : script, style,
   * dessin). Un écran bridé à 30 Hz descend donc aussi : sans gravité, les
   * paliers ne changent que la définition du filet et son reflet.
   */
  gardeFou: { msParImage: 24, dureeMs: 2000 },
  /** Forçage manuel du palier : ?tier=lite|standard|full */
  parametreForcage: 'tier',

  // ── Mise en page (fractions de l'écran) ───────────────────────────────────
  // Réservé en haut pour l'en-tête ; bas assombri pour les textes (§6.2).
  zones: {
    mobile: {
      entete: { x: 0, y: 0, l: 1, h: 0.12 },
      bidon: { x: 0.32, y: 0.13, l: 0.36, h: 0.22 }, // basculé, il doit tenir dans la largeur
      moteur: { x: 0.04, y: 0.34, l: 0.92, h: 0.38 },
      textes: { x: 0.06, y: 0.72, l: 0.88, h: 0.24 },
      fin: { x: 0.06, y: 0.3, l: 0.88, h: 0.66 }, // le bidon est sorti : la fin prend la place
    },
    desktop: {
      entete: { x: 0, y: 0, l: 1, h: 0.12 },
      bidon: { x: 0.14, y: 0.16, l: 0.24, h: 0.36 },
      moteur: { x: 0.44, y: 0.3, l: 0.52, h: 0.66 },
      textes: { x: 0.05, y: 0.7, l: 0.36, h: 0.25 },
      fin: { x: 0.05, y: 0.3, l: 0.5, h: 0.62 },
    },
  } satisfies Record<Format, Record<string, Zone>>,

  // ── Ancres ─────────────────────────────────────────────────────────────────
  ancres: {
    /** Mesurées sur la photo P1 par scripts/build-bidon-hero.mjs (goulot : départ du filet ; pivot : centre de masse). */
    bidon: { spout: geometrieBidon.spout, bottlePivot: geometrieBidon.bottlePivot },
    /**
     * Où le goulot doit arriver en fin de bascule (fractions de l'écran).
     * Mobile : juste au-dessus de l'orifice du moteur (même x) → versement vertical.
     * Desktop : à gauche du moteur → filet en arc jusqu'à l'orifice.
     */
    cibleGoulot: { mobile: { y: 0.3 }, desktop: { x: 0.52, y: 0.24 } },
  },

  // ── Moteur SVG (repère du dessin : fractions de 1000×1000) ─────────────────
  moteur: {
    /** Orifice de remplissage : arrivée du filet d'huile. */
    filler: { x: 0.5, y: 0.12 },
    /** Tours de vilebrequin pendant t3. */
    tours: 4,
    /** Plages (fractions de t3) : révélation de l'intérieur, puis huile pièce par pièce. */
    coupe: [0, 0.12],
    huile: { cames: [0.05, 0.33], pistons: [0.33, 0.66], vilebrequin: [0.66, 0.95] },
    /**
     * Cadrages pendant t3 (t = fraction de t3) : le point (x, y) du dessin est
     * amené au centre de la zone moteur, avec ce zoom. Interpolés en douceur ;
     * deux clés identiques = plan fixe. Vue d'ensemble → cames → pistons → vilebrequin.
     */
    cadrages: [
      { t: 0, x: 0.5, y: 0.5, zoom: 1 },
      { t: 0.1, x: 0.5, y: 0.26, zoom: 1.7 },
      { t: 0.3, x: 0.5, y: 0.26, zoom: 1.7 },
      { t: 0.4, x: 0.5, y: 0.52, zoom: 1.5 },
      { t: 0.62, x: 0.5, y: 0.52, zoom: 1.5 },
      { t: 0.72, x: 0.5, y: 0.8, zoom: 1.6 },
      { t: 1, x: 0.5, y: 0.8, zoom: 1.6 },
    ] satisfies CleCadrage[],
  },

  // ── Aperçu : moteur en images IA (?moteur=ia) ─────────────────────────────
  // Images E1 → E3 (ops/credits.md, npm run hero:moteur-ia) à la place du SVG,
  // seulement avec ce paramètre d'adresse : le site reste sur le SVG (D3) tant
  // que Ben n'a pas validé la version IA. Même carré, mêmes zones à l'écran.
  moteurIA: {
    parametre: 'moteur',
    valeur: 'ia',
    /** Orifice visible sur E1, en fractions du carré (arrivée du filet). */
    filler: { x: 0.75, y: 0.33 },
    /** Fondus pendant t3 (fractions de t3) : cache ouvert huilé (E2), puis moteur huilé (E3). */
    fondus: { e2: [0.2, 0.45], e3: [0.6, 0.85] },
    /** Caméra : poussée vers l'orifice (V1), puis recul sur tout le moteur (V2). */
    cadrages: [
      { t: 0, x: 0.5, y: 0.5, zoom: 1 },
      { t: 0.08, x: 0.5, y: 0.5, zoom: 1 },
      { t: 0.4, x: 0.66, y: 0.36, zoom: 1.5 },
      { t: 0.55, x: 0.66, y: 0.36, zoom: 1.5 },
      { t: 0.9, x: 0.5, y: 0.52, zoom: 1.05 },
      { t: 1, x: 0.5, y: 0.52, zoom: 1.05 },
    ] satisfies CleCadrage[],
  },

  // ── Couleurs (research/palette.json) ──────────────────────────────────────
  couleurs: {
    huile: ['#f0cc30', '#cc9c0c'], // or du logo Petrovöll : dégradé du filet
    refletHuile: '#fff4c2',
  },

  // ── Produits (ids de research/catalogue.json) ─────────────────────────────
  // Le bidon qui verse est le STÄRK (voiture) ; la fin présente les deux gammes.
  produitVerse: 'stark-semi-synthetique', // la photo P1 : STÄRK Teil Synthetisches 10W40
  produitsFin: [
    { id: 'stark-semi-synthetique', libelle: 'Voiture', nom: 'STÄRK' },
    { id: 'motpro-4t', libelle: 'Moto', nom: 'MÖTPRO 4T' },
  ],

  // ── Textes FR (aucune donnée technique : règle 5, pas de TDS reçue) ───────
  // {societe} est remplacé par le nom saisi dans l'admin (Réglages du site).
  textes: {
    ouverture: {
      surtitre: 'Lubrifiants allemands depuis 1999',
      titre: 'Petrovöll au Burkina Faso',
      indice: 'Faites défiler',
    },
    t1: { titre: 'Qualité allemande', texte: 'Des huiles formulées en Allemagne depuis 1999.' },
    t2: { titre: 'La bonne huile, au bon endroit', texte: 'Une vidange régulière, c’est un moteur qui dure.' },
    t3: [
      { titre: 'Arbre à cames', texte: 'L’huile réduit le frottement sur les cames.' },
      { titre: 'Pistons', texte: 'Elle protège les pistons et les parois des cylindres.' },
      { titre: 'Vilebrequin', texte: 'Elle protège les paliers qui tournent à plein régime.' },
    ],
    fin: {
      titre: 'Voiture ou moto, protégez votre moteur',
      texte: 'Distribué au Burkina Faso par {societe}.',
      cta: 'Commander sur WhatsApp',
      ctaSecondaire: 'Voir le catalogue',
      lienSecondaire: '/produits',
    },
  },
  /** Message pré-rempli du bouton WhatsApp (numéro saisi dans l'admin). */
  messageWhatsApp: 'Bonjour {societe}, je souhaite commander de l’huile Petrovöll.',
} as const
