import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Content Collections (Astro 5 — Content Layer API)
 * ════════════════════════════════════════════════════════════════════════════
 *  ⚠️  ÉCART PAR RAPPORT À LA SPEC : le fichier s'appelle
 *      `src/content.config.ts` et non `src/content/config.ts`.
 *      Astro 5 a déplacé la configuration des collections à la racine de
 *      `src/` (l'ancien emplacement est legacy/déprécié). Avec l'API Content
 *      Layer, chaque collection déclare son `loader` (`glob()` pour lire les
 *      fichiers écrits par Keystatic).
 *
 *  ⚠️  FORMAT DES FICHIERS : Keystatic écrit UN SEUL `.mdoc` par produit /
 *      secteur (frontmatter YAML + description riche), d'où
 *      `pattern: '*.mdoc'`. Le rendu du contenu riche se fait ensuite avec
 *      `const { Content } = await entry.render()`.
 *
 *  Les schémas ci-dessous valident le frontmatter ÉCRIT PAR KEYSTATIC :
 *  toute incohérence casse le build (c'est voulu : garde-fou qualité).
 *
 *  TODO [contenu] :
 *   - [ ] Ajouter une collection `actualites` si le client veut publier des news
 *   - [ ] Passer `image` en schéma `image()` d'Astro pour importer les visuels
 *         locaux directement dans <Image /> (largeur/hauteur typées)
 *   - [ ] Brancher un loader distant (Cloudinary) si les images ne sont plus
 *         versionnées dans le dépôt
 */

/** Contrainte métier : 5 visuels maximum par produit. */
const IMAGES_MAX = 5

const SECTEURS_VALUES = [
  'lubrifiants',
  'transport',
  'distribution',
  'pneumatiques',
  'fournitures',
] as const

/* ── Produits ─────────────────────────────────────────────────────────────── */
const produits = defineCollection({
  // Un fichier <slug>.mdoc par produit (écrit par Keystatic)
  loader: glob({ pattern: '*.mdoc', base: './src/content/produits' }),
  schema: z.object({
    titre: z.string().min(3, 'Le titre doit contenir au moins 3 caractères.'),
    secteur: z.enum(SECTEURS_VALUES),
    marque: z.string().default('PETROVOLL'),
    reference: z.string().optional(),
    images: z
      .array(
        z.object({
          // Chemin géré par Keystatic (fichier du dépôt) — valeur permissive :
          // voir le TODO ci-dessus pour un typage fort via `image()`.
          image: z.string().nullish(),
          // URL Cloudinary externe (alternative au fichier versionné)
          urlCloudinary: z.string().nullish(),
          // Obligatoire : accessibilité + SEO + citabilité par les IA
          alt: z.string().min(3, 'Le texte alternatif est obligatoire.'),
        }),
      )
      .max(IMAGES_MAX, `Maximum ${IMAGES_MAX} images par produit.`)
      .default([]),
    /** true → mise en vedette en héros sur la Home (section PETROVOLL) */
    estProduitPhare: z.boolean().default(false),
    disponible: z.boolean().default(true),
  }),
})

/* ── Secteurs ─────────────────────────────────────────────────────────────── */
const secteurs = defineCollection({
  loader: glob({ pattern: '*.mdoc', base: './src/content/secteurs' }),
  schema: z.object({
    nom: z.string().min(2),
    /** Nom d'icône Lucide en PascalCase (Droplet, Truck, Globe…) */
    icone: z.string().default('Droplet'),
    /** Couleur d'accent hexadécimale (#RRGGBB ou #RGB) */
    couleur: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Couleur hexadécimale attendue (ex. #D4420A).')
      .default('#D4420A'),
  }),
})

/* ── Paramètres du site (singleton) ───────────────────────────────────────── */
const parametresSite = defineCollection({
  // Keystatic écrit src/content/parametresSite/index.yaml
  loader: glob({ pattern: 'index.yaml', base: './src/content/parametresSite' }),
  schema: z.object({
    nomSociete: z.string().default('PETROVOLL'),
    slogan: z.string().optional(),
    telephone: z.string().optional(),
    // TODO [validation] : renforcer en z.string().email() une fois l'adresse
    // définitive connue (un champ vide casserait sinon le build).
    email: z.string().optional(),
    adresse: z.string().optional(),
    reseauxSociaux: z
      .array(
        z.object({
          plateforme: z.enum(['linkedin', 'facebook', 'instagram', 'whatsapp', 'youtube']),
          url: z.string().nullish(),
        }),
      )
      .default([]),
  }),
})

export const collections = { produits, secteurs, parametresSite }
