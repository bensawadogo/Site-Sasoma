import { lexicalEditor } from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Collection : secteurs
 * ────────────────────────────────────────────────────────────────────────────
 * Les 5 métiers du groupe (1 secteur = 1 page /secteurs/<slug>) :
 *   1. lubrifiants              → huile moteur & lubrifiants (PETROVOLL)  [PRINCIPAL]
 *   2. transport-logistique     → transport & logistique
 *   3. distribution-import-export → distribution, import/export
 *   4. pneumatiques             → pneumatiques
 *   5. fournitures-bureau       → fournitures de bureau
 *
 * `icone` stocke le NOM de l'icône Lucide (ex. "Droplet", "Truck", "Globe",
 * "CircleDot", "Paperclip"). Le frontend la résout dynamiquement :
 *
 *   TODO [front] : dans SecteursGrid.tsx, utiliser la map d'icônes Lucide
 *   (`import * as Icons from 'lucide-react'` + `Icons[icone as keyof typeof Icons]`)
 *   → attention au tree-shaking, préférer une map explicite des 5 icônes.
 *
 * TODO [seed] : prévoir un script de seed (prisma/seed.ts) qui crée les 5
 * secteurs + l'utilisateur super-admin initial.
 */
export const Secteurs: CollectionConfig = {
  slug: 'secteurs',
  labels: { singular: 'Secteur', plural: 'Secteurs' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'icone', 'couleur', 'estPrincipal', 'ordre'],
    group: 'Catalogue',
    description: "Les 5 secteurs d'activité du groupe. Le secteur principal porte la marque PETROVOLL.",
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
      label: 'Nom du secteur',
      admin: { description: 'Ex. « Transport & logistique ».' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug (URL)',
      admin: {
        position: 'sidebar',
        description: 'Ex. « transport-logistique ». URL : /secteurs/<slug>.',
      },
      hooks: {
        /**
         * TODO [slug] : même helper `garantirSlugUnique(slugify(nom), 'secteurs')`
         * que dans la collection Produits (lib/payload-helpers.ts à créer).
         */
        beforeValidate: [
          ({ data }) => (typeof data?.nom === 'string' ? (data.nom as string) : ''),
        ],
      },
    },
    {
      name: 'icone',
      type: 'text',
      label: 'Icône Lucide',
      defaultValue: 'Droplet',
      admin: {
        position: 'sidebar',
        description:
          'Nom exact de l’icône Lucide (PascalCase). Ex. Droplet, Truck, Globe, CircleDot, Paperclip.',
      },
      // TODO [validation] : valider que la valeur existe bien dans lucide-react
      // (validate: (value) => Object.keys(Icons).includes(String(value)))
    },
    {
      name: 'couleur',
      type: 'text',
      label: 'Couleur d’accent (hex)',
      defaultValue: '#D4420A',
      admin: {
        position: 'sidebar',
        description: 'Code hexadécimal utilisé pour l’accent du secteur. Ex. « #D4420A ».',
      },
      // TODO [validation] : validate avec une regex ^#([0-9A-Fa-f]{3}){1,2}$
    },
    {
      name: 'estPrincipal',
      type: 'checkbox',
      label: 'Secteur principal (marque PETROVOLL)',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Un seul secteur doit être principal : il porte la section produit phare de la Home.',
      },
      // TODO [validation] : hook pour empêcher plusieurs `estPrincipal === true`
    },
    {
      name: 'ordre',
      type: 'number',
      label: 'Ordre d’affichage',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Tri des cards sur la Home (0 = premier).' },
    },
    {
      name: 'accroche',
      type: 'text',
      label: 'Accroche courte',
      maxLength: 120,
      admin: { description: 'Phrase d’impact affichée sous le titre de la card secteur.' },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      editor: lexicalEditor(),
      admin: { description: 'Contenu de la page /secteurs/<slug> (présentation du métier).' },
    },
    {
      name: 'imageIllustration',
      type: 'upload',
      relationTo: 'media',
      label: 'Visuel d’illustration',
      admin: { description: 'Bandeau de la page secteur. Ratio 16:9 recommandé.' },
    },
  ],
  hooks: {
    // TODO [cache] : afterChange → revalider '/', '/secteurs/<slug>' et '/produits'
  },
  timestamps: true,
}

export default Secteurs