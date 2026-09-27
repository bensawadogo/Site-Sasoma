import path from 'path'
import { fileURLToPath } from 'url'

import type { CollectionConfig } from 'payload'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Collection : media
 * ────────────────────────────────────────────────────────────────────────────
 * Bibliothèque de médias centralisée (images produits, visuels secteurs,
 * vidéos d'usine, fiches techniques PDF).
 *
 * Deux modes de stockage cohabitent dans le projet :
 *   • DEV  → disque local dans public/media (staticDir ci-dessous)
 *   • PROD → Cloudinary via @payloadcms/plugin-cloud-storage (CDN + optimisation)
 *
 * TODO [media] :
 *  - [ ] Brancher l'adaptateur Cloudinary en production et désactiver le disque
 *  - [ ] Ajouter la génération d'AVIF/WebP (Payload s'appuie sur `sharp`)
 *  - [ ] Limiter la taille d'upload (ex. 8 Mo) et valider les dimensions
 *  - [ ] Servir les images via next/image (`remotePatterns` déjà configuré
 *        pour res.cloudinary.com dans next.config.mjs)
 *  - [ ] Prévoir la suppression du fichier distant (Cloudinary destroy) sur delete
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Média', plural: 'Médias' },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
    group: 'Médias',
    description: 'Images et documents utilisés par le catalogue et les pages du site.',
  },
  access: {
    // Lecture publique : nécessaire pour next/image et les OG images
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) =>
      (user as { role?: string } | null | undefined)?.role === 'super-admin',
  },
  upload: {
    // Dossier de stockage local (dev). En production : Cloudinary.
    staticDir: path.resolve(dirname, '../../public/media'),
    // Formats acceptés : images, vidéos courtes, PDF (fiches techniques)
    mimeTypes: ['image/*', 'video/mp4', 'application/pdf'],
    // Recadrage / point focal activés dans l'admin
    focalPoint: true,
    // Dérivées générées automatiquement à l'upload
    imageSizes: [
      { name: 'vignette', width: 200, height: 200, position: 'centre' }, // cartes/listes
      { name: 'carte', width: 600, height: 450, position: 'centre' }, // ProduitCard (4:3)
      { name: 'carre', width: 800, height: 800, position: 'centre' }, // galerie 1:1
      { name: 'fiche', width: 1200, position: 'centre' }, // fiche produit
      { name: 'hero', width: 1920, position: 'centre' }, // hero / bandeaux
      { name: 'og', width: 1200, height: 630, position: 'centre' }, // Open Graph
    ],
    // TODO [media] : `formatOptions: { format: 'webp' }` si on veut forcer WebP
    // côté stockage Payload (sinon Cloudinary s'en charge).
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Texte alternatif',
      admin: {
        description:
          'Obligatoire : accessibilité + SEO. Ex. « Bidon PETROVOLL 15W-40, 5 litres ».',
      },
    },
    {
      name: 'legende',
      type: 'text',
      label: 'Légende',
      admin: { description: 'Affichée sous le visuel sur les pages éditoriales.' },
    },
    {
      name: 'credit',
      type: 'text',
      label: 'Crédit / source',
      admin: { description: 'Photographe ou fournisseur du visuel (droits d’image).' },
    },
    {
      name: 'categorieMedia',
      type: 'select',
      label: 'Usage principal',
      defaultValue: 'produit',
      options: [
        { label: 'Produit', value: 'produit' },
        { label: 'Secteur', value: 'secteur' },
        { label: 'Transport / flotte', value: 'flotte' },
        { label: 'Corporate / équipe', value: 'corporate' },
        { label: 'Document (PDF)', value: 'document' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Facilite le filtrage de la bibliothèque de médias.',
      },
    },
    {
      // Champ d'index Cloudinary — rempli par l'adaptateur de stockage.
      name: 'publicId',
      type: 'text',
      label: 'Identifiant Cloudinary',
      unique: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Renseigné automatiquement lors de l’upload vers Cloudinary.',
      },
    },
  ],
  hooks: {
    // TODO [media] : afterDelete → cloudinary.uploader.destroy(doc.publicId)
    // TODO [media] : beforeChange → générer `alt` par défaut depuis le nom de fichier
    //                si le champ est vide (jamais vide pour l'accessibilité).
  },
  timestamps: true,
}

export default Media