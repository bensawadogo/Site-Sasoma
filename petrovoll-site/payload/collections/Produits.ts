import { lexicalEditor } from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Collection : produits
 * ────────────────────────────────────────────────────────────────────────────
 * Cœur du site : huiles moteur / lubrifiants (PETROVOLL), pneus, fournitures de
 * bureau… Le champ `estProduitPhare` pilote la mise en avant sur la Home.
 *
 * TODO [catalogue] :
 *  - [ ] Activer les versions/drafts :  versions: { drafts: true }
 *        (nécessaire pour la prévisualisation éditoriale avant publication)
 *  - [ ] Hook afterChange → revalidation ISR du site public (/api/revalidate)
 *  - [ ] Ajouter `conditionnement` (bidon 1 L / 5 L / 20 L / fût 208 L) en select
 *  - [ ] Ajouter `prixConseille` (number, non public) réservé au super-admin
 *  - [ ] Champ `ficheTechnique` (upload PDF) si le client fournit les TDS
 */
export const Produits: CollectionConfig = {
  slug: 'produits',
  labels: {
    singular: 'Produit',
    plural: 'Produits',
  },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'marque', 'secteur', 'disponible', 'estProduitPhare'],
    group: 'Catalogue',
    description:
      "Catalogue commercial : un produit appartient toujours à un secteur. Cocher « produit phare » pour la mise en vedette sur la page d'accueil.",
    // TODO [admin] : preview: (doc) => `/produits/${doc.slug}` (live preview)
  },

  access: {
    // Lecture publique (site vitrine B2B/B2C)
    read: () => true,
    // Écriture réservée aux utilisateurs authentifiés du panel admin
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    // Suppression réservée au super-admin
    // TODO [roles] : extraire en helper `estSuperAdmin(user)` (lib/auth.ts)
    // ⚠️  le cast ci-dessous disparaîtra quand `types/payload-types.ts` sera
    //     généré (npm run payload:generate-types) : `user.role` sera typé.
    delete: ({ req: { user } }) =>
      (user as { role?: string } | null | undefined)?.role === 'super-admin',
  },

  fields: [
    /* ── Identité commerciale ─────────────────────────────────────────────── */
    {
      name: 'nom',
      type: 'text',
      required: true,
      label: 'Nom du produit',
      admin: {
        description: 'Ex. « Huile moteur PETROVOLL 15W-40 — bidon 5 L »',
      },
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
        description: 'Généré automatiquement depuis le nom. URL : /produits/<slug>',
      },
      hooks: {
        /**
         * TODO [slug] : génération automatique + garantie d'unicité.
         *
         *   hooks: {
         *     beforeValidate: [async ({ data, operation, value }) => {
         *       if (operation === 'update' && typeof value === 'string' && value) return value
         *       const base = slugify(String(data?.nom ?? ''))
         *       return garantirSlugUnique(base, 'produits')   // suffixe -2, -3…
         *     }],
         *   }
         *
         * Helpers à implémenter : slugify() dans lib/utils.ts et
         * garantirSlugUnique() dans lib/payload-helpers.ts (à créer).
         */
        beforeValidate: [
          ({ data }) => {
            const nom = typeof data?.nom === 'string' ? (data.nom as string) : ''
            // Placeholder volontaire : le slug « brut » est renvoyé tel quel.
            return nom
          },
        ],
      },
    },
    {
      name: 'marque',
      type: 'text',
      label: 'Marque',
      defaultValue: 'PETROVOLL',
      admin: {
        position: 'sidebar',
        description: 'Ex. « PETROVOLL » (marque principale du groupe).',
      },
    },
    {
      name: 'references',
      type: 'text',
      label: 'Référence commerciale',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Référence interne / fournisseur. Ex. « PTV-15W40-5L ».',
      },
    },

    /* ── Classement ───────────────────────────────────────────────────────── */
    {
      name: 'secteur',
      type: 'relationship',
      relationTo: 'secteurs',
      required: true,
      label: 'Secteur d’activité',
      admin: {
        position: 'sidebar',
        description: 'Détermine la section du catalogue et la page /secteurs/<slug>.',
      },
    },
    {
      name: 'categorie',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Catégorie',
      admin: {
        position: 'sidebar',
        // TODO [filtres] : n'afficher que les catégories du secteur choisi
        // (filterOptions basé sur l'id du secteur sélectionné).
      },
    },

    /* ── Mise en avant & disponibilité ────────────────────────────────────── */
    {
      name: 'estProduitPhare',
      type: 'checkbox',
      label: 'Produit phare (mis en vedette sur la Home)',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          "Si coché, le produit apparaît dans la section « produit phare » de la page d'accueil, en grand format (bloc visuellement plus imposant que la grille standard).",
      },
    },
    {
      name: 'disponible',
      type: 'checkbox',
      label: 'Disponible',
      defaultValue: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Décocher pour afficher le badge « hors stock » sans retirer la fiche.',
      },
    },
    {
      name: 'dateAjout',
      type: 'date',
      label: 'Date d’ajout',
      index: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Automatique à la création, modifiable.',
        // TODO [date] : defaultValue: () => new Date() + hook beforeValidate
        // qui force la date à la création si le champ est vide.
      },
    },
    {
      name: 'ordre',
      type: 'number',
      label: 'Ordre d’affichage',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Tri manuel dans la grille produits (0 = en premier).',
      },
    },

    /* ─ Contenu éditorial ───────────────────────────────────────────────── */
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      editor: lexicalEditor(),
      admin: {
        description:
          'Description longue affichée sur la fiche produit (rendue avec la classe `prose`).',
      },
      // TODO [validation] : exiger un minimum de 150 caractères (SEO + qualité B2B)
    },
    {
      name: 'extrait',
      type: 'textarea',
      label: 'Extrait court',
      maxLength: 180,
      admin: {
        description: 'Utilisé sur les cartes produit et comme meta description par défaut.',
      },
    },

    /* ── Galerie images (5 visuels maximum) ──────────────────────────────── */
    {
      name: 'images',
      type: 'array',
      label: 'Galerie images',
      // Contrainte métier : 5 visuels maximum par produit
      maxRows: 5,
      minRows: 0,
      labels: { singular: 'Image', plural: 'Images' },
      admin: {
        description: 'Le premier visuel sert de vignette. Ratios recommandés : 4:3 et 1:1.',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Fichier',
        },
        {
          name: 'legende',
          type: 'text',
          label: 'Légende',
          admin: { description: 'Facultatif. Améliore l’accessibilité et le SEO.' },
        },
      ],
      // TODO [media] : hook beforeChange → upload Cloudinary + renseignement du
      // `publicId` de Media (ou brancher @payloadcms/plugin-cloud-storage).
    },
  ],

  /* ── Hooks de collection ─────────────────────────────────────────────────── */
  hooks: {
    /**
     * TODO [cache] : revalidation ISR à la publication.
     *
     *   afterChange: [async ({ doc, previousDoc }) => {
     *     if (process.env.NEXT_PUBLIC_SERVER_URL && doc?.slug) {
     *       await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/revalidate`, {
     *         method: 'POST',
     *         headers: { 'x-revalidate-secret': process.env.REVALIDATE_SECRET ?? '' },
     *         body: JSON.stringify({
     *           tags: ['produits', `produit:${doc.slug}`],
     *           paths: ['/', '/produits', `/produits/${doc.slug}`],
     *         }),
     *       })
     *     }
     *     return doc
     *   }],
     *
     * TODO [audit] : afterChange / afterDelete → journaliser l'auteur (LogAudit).
     * TODO [stock] : beforeChange → si `disponible === false`, vider un éventuel
     *                cache de mise en avant Home pour éviter un produit hors stock
     *                en section phare.
     */
  },

  timestamps: true,
}

export default Produits