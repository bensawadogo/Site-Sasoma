import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

/**
 * Collections de contenu — relisent les fichiers écrits par l'admin Keystatic
 * (keystatic.config.ts : même structure, mêmes noms de champs).
 *
 * Règle : le client saisit depuis son téléphone, et une erreur de schéma
 * bloquerait la mise en ligne SANS qu'il comprenne pourquoi. Les schémas sont
 * donc tolérants (valeurs par défaut, champs vides acceptés, trop de photos
 * tronquées au lieu de refusées). Seul ce qui rendrait une page inutilisable
 * (un produit sans nom) fait échouer le build.
 */

/** Texte facultatif : Keystatic écrit '' pour un champ vidé. */
const texte = z
  .string()
  .nullish()
  .transform((v) => v?.trim() || undefined)

const PHOTOS_MAX = 5

const produits = defineCollection({
  loader: glob({ pattern: '*.mdoc', base: './src/content/produits' }),
  schema: ({ image }) =>
    z.object({
      nom: z.string().min(1),
      // Slug d'une entrée « secteurs ». Pas de reference() : supprimer un
      // secteur encore utilisé ne doit pas bloquer le site (le produit reste
      // visible dans le catalogue général).
      secteur: texte,
      prix: z.number().int().nonnegative().nullish(),
      conditionnement: texte,
      photos: z
        .array(image())
        .nullish()
        .transform((photos) => (photos ?? []).slice(0, PHOTOS_MAX)),
      disponible: z.boolean().default(true),
      enAvant: z.boolean().default(false),
      marque: texte,
      reference: texte,
    }),
})

const secteurs = defineCollection({
  loader: glob({ pattern: '*.mdoc', base: './src/content/secteurs' }),
  schema: z.object({
    nom: z.string().min(1),
    icone: texte,
    ordre: z.number().nullish().transform((v) => v ?? 10),
    resume: texte,
  }),
})

/** Pages éditoriales simples (À propos, Mentions légales). */
const pages = defineCollection({
  loader: glob({ pattern: '*.mdoc', base: './src/content/pages' }),
  // Titre facultatif : un champ vidé dans l'admin disparaît du fichier, et la
  // page retombe sur son titre par défaut (PageEditoriale.astro) au lieu de
  // faire échouer le build.
  schema: z.object({ titre: texte }),
})

const accueil = defineCollection({
  loader: glob({ pattern: 'index.yaml', base: './src/content/accueil' }),
  schema: z.object({
    chiffres: z
      .array(z.object({ valeur: z.string(), libelle: z.string() }))
      .nullish()
      .transform((liste) => (liste ?? []).filter((c) => c.valeur.trim() && c.libelle.trim())),
    appelTitre: texte,
    appelTexte: texte,
  }),
})

const parametresSite = defineCollection({
  loader: glob({ pattern: 'index.yaml', base: './src/content/parametresSite' }),
  schema: z.object({
    nomSociete: z.string().default('SASOMA'),
    slogan: texte,
    telephone: texte,
    whatsapp: texte,
    email: texte,
    adresse: texte,
    horaires: texte,
    reseauxSociaux: z
      .array(z.object({ plateforme: z.string(), url: z.string().nullish() }))
      .nullish()
      .transform((liste) =>
        (liste ?? []).filter((r): r is { plateforme: string; url: string } => Boolean(r.url)),
      ),
    rccm: texte,
    ifu: texte,
  }),
})

export const collections = { produits, secteurs, pages, accueil, parametresSite }
