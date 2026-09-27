/**
 * ─────────────────────────────────────────────────────────────────────────────
 * types/index.ts — Types métier partagés (front + API routes + admin)
 * ────────────────────────────────────────────────────────────────────────────
 * Objectif : une seule description du domaine, utilisable avant même que les
 * types Payload générés (`types/payload-types.ts`) n'existent.
 *
 * TODO [types] : une fois Payload câblé (`npm run payload:generate-types`),
 * préférer `import type { Produit, Secteur } from '@/types/payload-types'`
 * et convertir les interfaces ci-dessous en alias pour éviter la duplication.
 */

/* ─ Rôles & authentification ────────────────────────────────────────────── */
export type RoleUtilisateur = 'super-admin' | 'editeur'

export interface UtilisateurAdmin {
  id: string
  email: string
  nom: string
  role: RoleUtilisateur
  actif: boolean
}

/* ── Secteurs d'activité (5 secteurs de la société) ─────────────────────── */
/** Clés stables des secteurs — utilisées pour les routes /secteurs/[secteur]. */
export type CleSecteur =
  | 'lubrifiants'
  | 'transport-logistique'
  | 'distribution-import-export'
  | 'pneumatiques'
  | 'fournitures-bureau'

export interface Secteur {
  id: string
  nom: string
  slug: string
  /** Nom d'icône Lucide (ex. 'Droplet', 'Truck', 'Globe', 'CircleDot', 'Paperclip') */
  icone: string
  /** Couleur d'accent hexadécimale (ex. '#D4420A') */
  couleur: string
  description: unknown // richText Lexical — TODO [types] : typer précisément
  ordreAffichage?: number
  estPrincipal?: boolean // true pour « Huile moteur & lubrifiants » (PETROVOLL)
}

/* ─ Catégories produits ─────────────────────────────────────────────────── */
export interface Categorie {
  id: string
  nom: string
  slug: string
  secteur: string | Secteur
  description?: unknown // richText
  parent?: string | Categorie | null
}

/* ── Médias (collection Payload Media + Cloudinary) ──────────────────────── */
export interface MediaAsset {
  id: string
  alt: string
  url: string
  /** Identifiant Cloudinary pour les transformations / suppressions */
  publicId?: string
  largeur?: number
  hauteur?: number
  format?: string
  taille?: number
}

/* ── Produits ───────────────────────────────────────────────────────────── */
export interface Produit {
  id: string
  nom: string
  slug: string
  secteur: Secteur | string
  categorie?: Categorie | string | null
  description?: unknown // richText Lexical
  /** Galerie limitée à 5 visuels (contrainte d'admin Payload) */
  images?: MediaAsset[] | string[]
  /** true → mise en vedette sur la Home (section produit phare PETROVOLL) */
  estProduitPhare: boolean
  /** Marque commerciale, ex. « PETROVOLL » */
  marque?: string
  /** Référence commerciale, ex. « PTV-15W40-5L » */
  references?: string
  disponible: boolean
  /** Date d'ajout automatique (admin.date ou hook beforeChange) */
  dateAjout: string
  createdAt?: string
  updatedAt?: string
}

/** Payload renvoie `{ docs, totalDocs, page, totalPages }`. */
export interface ResultatPagine<T> {
  docs: T[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/* ── Filtres catalogue (/produits) ───────────────────────────────────────── */
export interface FiltresProduits {
  secteur?: string
  categorie?: string
  marque?: string
  disponible?: boolean
  recherche?: string
  page?: number
  limite?: number
  tri?: 'recent' | 'nom-asc' | 'nom-desc'
}

/* ── Demandes de contact / devis B2B ────────────────────────────────────── */
export interface DemandeDevis {
  nom: string
  entreprise?: string
  email: string
  telephone: string
  pays?: string
  secteurConcerne?: CleSecteur | string
  quantiteEstimee?: string
  message: string
  consentementRgpd: boolean
}

/** Réponse standard des route handlers du projet. */
export interface ApiReponse<T> {
  data: T
  meta?: Record<string, unknown>
  error?: string
}

/* ── Navigation ─────────────────────────────────────────────────────────── */
/** Entrée de menu (Navbar, MobileMenu, Footer). */
export interface LienNavigation {
  label: string
  href: string
  /** Sous-entrées éventuelles (menu déroulant « Secteurs », footer) */
  enfants?: LienNavigation[]
  /** Cible externe → Link désactivé, <a rel="noopener"> utilisé */
  externe?: boolean
}

/* TODO [types] : ajouter
 *  - ChiffreCle (StatsSection : libellé, valeur, suffixe)
 *  - MicroAnimationLottie (chemin JSON + options de lecture)
 *  - MetaSeo (title, description, ogImage, canonical)
 */