import { lexicalEditor } from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Collection : categories
 * ────────────────────────────────────────────────────────────────────────────
 * Arborescence produits à 2 niveaux maximum (ex. Lubrifiants > Huiles moteur).
 * Chaque catégorie est rattachée à un secteur, ce qui permet :
 *   • le filtrage du catalogue : /produits?secteur=…&categorie=…
 *   • des URLs propres : /produits?categorie=huiles-moteur (ou /categorie/<slug>)
 *
 * TODO [categorie] :
 *  - [ ] Limiter la profondeur à 2 niveaux (hook beforeValidate)
 *  - [ ] Interdire une catégorie enfant rattachée à un autre secteur que le parent
 *  - [ ] Prévoir des visuels de catégorie (vignettes de nav catalogue)
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Catégorie', plural: 'Catégories' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'secteur', 'parent', 'ordre'],
    group: 'Catalogue',
    description: 'Classement fin des produits à l’intérieur d’un secteur.',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) =>
      (user as { role?: string } | null | undefined)?.role === 'super-admin',
  },
  fields: [
    {
      name: 'nom',
      type: 'text',
      required: true,
      label: 'Nom de la catégorie',
      admin: { description: 'Ex. « Huiles moteur », « Pneumatiques poids lourds ».' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug (URL)',
      admin: { position: 'sidebar', description: 'Généré depuis le nom (voir hook TODO).' },
      hooks: {
        // TODO [slug] : garantirSlugUnique(slugify(data.nom), 'categories')
        beforeValidate: [
          ({ data }) => (typeof data?.nom === 'string' ? (data.nom as string) : ''),
        ],
      },
    },
    {
      name: 'secteur',
      type: 'relationship',
      relationTo: 'secteurs',
      required: true,
      label: 'Secteur de rattachement',
      admin: {
        position: 'sidebar',
        description: 'Un produit hérite du secteur de sa catégorie.',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Catégorie parente',
      admin: {
        position: 'sidebar',
        description: 'Laisser vide pour une catégorie racine (niveau 1).',
        // TODO [filtres] : exclure la catégorie courante et ses enfants pour
        // éviter les cycles (filterOptions sur le secteur sélectionné).
      },
    },
    {
      name: 'ordre',
      type: 'number',
      label: 'Ordre d’affichage',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      editor: lexicalEditor(),
      admin: { description: 'Texte SEO affiché en tête de la liste de catégorie.' },
    },
  ],
  hooks: {
    // TODO [cache] : afterChange → revalider '/produits' + les tags de catégorie
  },
  timestamps: true,
}

export default Categories