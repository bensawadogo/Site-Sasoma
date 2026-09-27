/**
 * hero.config.ts — configuration UNIQUE du hero au scroll (BRIEF-MAITRE.md §8).
 *
 * Tout ce qui se règle sans toucher au code est ici : paliers, temps de la
 * timeline, mise en page, ancres, textes et CTA. Les prompts de génération
 * vivent dans scenario/shots.md et reprennent les mêmes ancres.
 *
 * Conventions :
 *  - progression du scroll de 0 (haut du hero) à 1 (fin du hero) ;
 *  - ancres en FRACTIONS de l'image source (x, y ∈ [0, 1], origine en haut à
 *    gauche). Le code les convertit en pixels selon le recadrage `cover` ;
 *  - `aMesurer: true` = valeur provisoire, remplacée par la mesure réelle
 *    (phase 4 pour le bidon, phase 5 pour le moteur). Le test
 *    hero.config.test.ts vérifie la cohérence de l'ensemble.
 */

export type Palier = 'lite' | 'standard' | 'full'
export type Format = 'mobile' | 'desktop'

export interface Point {
  x: number
  y: number
  aMesurer?: boolean
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
    { id: 't3', debut: 0.55, fin: 0.92 }, // séquence V1 + V2 : cames → pistons → vilebrequin
    { id: 'fin', debut: 0.92, fin: 1 }, // produits + CTA
  ] satisfies Temps[],
  /** Découpage de t3 entre les deux vidéos (fraction de t3). */
  partageSequence: { v1: 0.5, v2: 0.5 },
  /** Bascule du bidon pendant t2 (degrés, sens horaire sur mobile). */
  angleVersement: 115,

  // ── Paliers (§8) ───────────────────────────────────────────────────────────
  paliers: {
    lite: {
      // saveData, 2g/3g, deviceMemory ≤ 2 ou prefers-reduced-motion
      dprMax: 1,
      images: 0, // affiches fixes + CSS/SVG, aucune séquence
      budgetKo: 500,
    },
    standard: {
      dprMax: 1.5,
      images: 48,
      taille: { mobile: [540, 960], desktop: [960, 540] },
      format: 'webp',
      qualite: 55,
    },
    full: {
      // deviceMemory ≥ 6 et 4g/wifi
      dprMax: 2,
      images: 96,
      taille: { mobile: [1080, 1920], desktop: [1920, 1080] },
      format: 'avif',
    },
  },
  /** Garde-fou : on descend d'un palier si une image dépasse ce temps moyen pendant `duree`. */
  gardeFou: { msParImage: 24, dureeMs: 2000 },
  /** Nombre d'images décodées gardées en mémoire autour de l'image courante. */
  fenetreDecodage: 12,
  /** Forçage manuel du palier : ?tier=lite|standard|full */
  parametreForcage: 'tier',

  // ── Mise en page (fractions de l'écran) ───────────────────────────────────
  // Réservé en haut pour l'en-tête ; bas assombri pour les textes (§6.2).
  zones: {
    mobile: {
      entete: { x: 0, y: 0, l: 1, h: 0.12 },
      bidon: { x: 0.3, y: 0.12, l: 0.4, h: 0.26 },
      textes: { x: 0.06, y: 0.72, l: 0.88, h: 0.24 },
    },
    desktop: {
      entete: { x: 0, y: 0, l: 1, h: 0.12 },
      bidon: { x: 0.06, y: 0.18, l: 0.24, h: 0.46 },
      textes: { x: 0.05, y: 0.7, l: 0.42, h: 0.25 },
    },
  } satisfies Record<Format, Record<string, Zone>>,

  // ── Ancres ─────────────────────────────────────────────────────────────────
  ancres: {
    /** Dans les photos du bidon P1/P2 (phase 4). */
    bidon: {
      spout: { x: 0.5, y: 0.08, aMesurer: true }, // goulot : départ du filet
      bottlePivot: { x: 0.5, y: 0.62, aMesurer: true }, // centre de rotation
    },
    /** Dans les images moteur E1 : ouverture de remplissage (arrivée du filet), tolérance ±3 %. */
    filler: {
      mobile: { x: 0.5, y: 0.5, aMesurer: true },
      desktop: { x: 0.6, y: 0.46, aMesurer: true },
    },
    tolerance: 0.03,
    /**
     * Zone horizontale toujours visible d'une image 9:16 recadrée sur un
     * écran 360×800 (on perd 12,5 % de chaque côté) : le filler doit y rester.
     */
    zoneSure: { mobile: { xMin: 0.15, xMax: 0.85 } },
  },

  // ── Fichiers ───────────────────────────────────────────────────────────────
  sources: {
    photos: 'assets/photos/stark', // P1 avec bouchon, P2 sans bouchon, P3 bouchon, P4 bande de niveau
    ia: 'assets/ai', // E1-916, E1-169, E2-…, E3-…, V1-M, V1-D, V2-M, V2-D
  },

  // ── Couleurs (research/palette.json) ──────────────────────────────────────
  couleurs: {
    huile: ['#f0cc30', '#cc9c0c'], // or du logo Petrovöll : dégradé du filet
    refletHuile: '#fff4c2',
    accent: '#c7161c', // rouge marque
    fond: '#000000',
  },

  // ── Produits (ids de research/catalogue.json) ─────────────────────────────
  // Le bidon qui verse est le STÄRK (voiture) ; la fin présente les deux gammes.
  produitVerse: 'stark-synthetique',
  produitsFin: [
    { id: 'stark-synthetique', libelle: 'Voiture', nom: 'STÄRK' },
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
