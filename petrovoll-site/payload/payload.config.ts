import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Produits } from './collections/Produits'
import { Secteurs } from './collections/Secteurs'
import { Users } from './collections/Users'

/**
 * ═════════════════════════════════════════════════════════════════════════════
 *  payload.config.ts — Panel admin headless PETROVOLL
 * ═════════════════════════════════════════════════════════════════════════════
 *  Ce fichier est résolu via l'alias TypeScript `@payload-config`
 *  (voir tsconfig.json) : c'est le chemin attendu par la CLI `payload` et par
 *  `withPayload()` dans la config Next.
 *
 *  ⚠️  PRÉREQUIS : Payload CMS v3 exige Next.js 15.2+ (peerDependency stricte).
 *      Le squelette est généré en Next.js 14 → l'admin n'est PAS monté tant que
 *      la migration Next 15 n'est pas faite (voir README.md).
 *      Ce fichier reste néanmoins valide et sert de source de vérité aux
 *      collections : il peut être consommé par la CLI Payload et par les
 *      scripts de génération de types.
 *
 *  TODO [payload] :
 *   - [ ] Passer à Next.js 15.2+ puis activer `withPayload` dans next.config
 *   - [ ] `npm run payload:generate-importmap` après chaque ajout de composant
 *   - [ ] `npm run payload:generate-types` → génère types/payload-types.ts
 *   - [ ] Brancher @payloadcms/plugin-cloud-storage sur la collection Media
 *   - [ ] Ajouter les versions/drafts (versions: { drafts: true }) sur Produits
 *         et Secteurs pour la prévisualisation éditoriale
 *   - [ ] Ajouter la localisation (fr primaire ; en si ouverture anglophone)
 */

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // ── Panel d'administration ────────────────────────────────────────────────
  admin: {
    // Collection utilisée pour l'authentification du panel
    user: Users.slug,
    meta: {
      titleSuffix: '— Administration PETROVOLL',
      description: 'Gestion du catalogue produits, secteurs et médias',
      // TODO [branding] : fournir les favicons + le logo admin (noir/rouge)
    },
    // TODO [i18n] : `localization` de l'admin (fr par défaut) à configurer
    //              via la clé `i18n` une fois le support multi-langue décidé.
    components: {
      // TODO [branding] : injecter un Graphics/Logo/Badge custom dans l'admin
      // graphics: { Logo: '/payload/components/Logo#Logo' }
    },
  },

  // ── Base de données ───────────────────────────────────────────────────────
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI ?? '',
    },
    // TODO [db] : si Prisma cohabite, isoler les tables Payload :
    // schemaName: 'payload',
  }),

  // ── Éditeur richText (description produits / secteurs) ────────────────────
  editor: lexicalEditor(),

  // ── Collections ───────────────────────────────────────────────────────────
  collections: [Users, Media, Secteurs, Categories, Produits],

  // ── Secrets & URLs ────────────────────────────────────────────────────────
  secret: process.env.PAYLOAD_SECRET ?? '',
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL ?? process.env.NEXT_PUBLIC_SERVER_URL,

  // ── CORS / CSRF ───────────────────────────────────────────────────────────
  cors: [process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'],
  csrf: [process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'],

  // ── Uploads ───────────────────────────────────────────────────────────────
  // sharp = génération des tailles dérivées (payload resize côté serveur)
  sharp,

  // ── Import map des composants admin ───────────────────────────────────────
  // NOTE : sur Payload < 3.20 ce chemin se configure via `admin.importMap`.
  importMap: {
    baseDir: path.resolve(dirname),
  },

  // ── Types TypeScript générés ──────────────────────────────────────────────
  typescript: {
    outputFile: path.resolve(dirname, '../types/payload-types.ts'),
  },

  // ── GraphQL (désactivé tant que le frontend consomme la Local API) ─────────
  // graphQL: { disable: true },

  // ── Plugins ───────────────────────────────────────────────────────────────
  plugins: [
    // TODO [plugins] : activer dans cet ordre une fois les comptes créés
    // cloudStorage({ collections: { media: { adapter: cloudinaryAdapter(...) } } }),
    // seoPlugin({ collections: ['produits', 'secteurs'], uploadsCollection: 'media' }),
    // searchPlugin({ collections: ['produits'], defaultPriorities: {...} }),
  ],

  // ── Hooks globaux ─────────────────────────────────────────────────────────
  // TODO [hooks] : revalidation ISR du site public après publication d'un
  // document → appeler /api/revalidate (REVALIDATE_SECRET) pour éviter
  // d'attendre l'expiration du cache.
  // TODO [hooks] : journalisation des actions éditeur (LogAudit).
})