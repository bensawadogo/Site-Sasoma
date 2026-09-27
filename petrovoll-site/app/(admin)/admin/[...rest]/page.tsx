/**
 * ─────────────────────────────────────────────────────────────────────────────
 * /admin/[...rest] — Point de montage du panel Payload CMS v3
 * ────────────────────────────────────────────────────────────────────────────
 * ⚠️  ÉTAT ACTUEL : placeholder. Payload v3 exige Next.js 15.2+ et n'est donc
 *     pas encore monté (voir README.md → « Compatibilité Payload v3 »).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COMMENT MONTER PAYLOAD v3 (procédure exacte, à faire après passage Next 15) :
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1) Activer withPayload dans next.config (voir le TODO du fichier next.config.mjs)
 *
 * 2) Aligner la route sur la convention Payload : le dossier doit être nommé
 *    `[[...segments]]` (segment optionnel) et non `[...rest]`, afin que /admin
 *    (sans sous-chemin) fonctionne. Renommer :
 *
 *      app/(admin)/admin/[...rest]/            →  app/(admin)/admin/[[...segments]]/
 *
 * 3) Créer les 3 fichiers attendus par Payload :
 *
 *    ── app/(admin)/admin/[[...segments]]/page.tsx ──────────────────────────
 *      import config from '@payload-config'
 *      import { generatePageMetadata, RootPage } from '@payloadcms/next/views'
 *      import { importMap } from '../importMap'
 *
 *      type Args = {
 *        params: Promise<{ segments: string[] }>
 *        searchParams: Promise<{ [key: string]: string | string[] }>
 *      }
 *
 *      export const generateMetadata = ({ params, searchParams }: Args) =>
 *        generatePageMetadata({ config, params, searchParams })
 *
 *      const Page = ({ params, searchParams }: Args) =>
 *        RootPage({ config, params, searchParams, importMap })
 *
 *      export default Page
 *
 *    ── app/(admin)/admin/[[...segments]]/layout.tsx ───────────────────────
 *      import config from '@payload-config'
 *      import '@payloadcms/next/css'
 *      import { RootLayout } from '@payloadcms/next/layouts'
 *      import { importMap } from '../importMap'
 *
 *      const Layout = ({ children }) => (
 *        <RootLayout config={config} importMap={importMap}>{children}</RootLayout>
 *      )
 *      export default Layout
 *
 *    ── app/(admin)/admin/[[...segments]]/not-found.tsx ─────────────────────
 *      import config from '@payload-config'
 *      import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views'
 *      … (même signature que page.tsx, avec NotFoundPage)
 *
 * 4) Générer l'import map et les types :
 *      npm run payload:generate-importmap
 *      npm run payload:generate-types
 *
 * 5) Lancer les migrations de la base :
 *      npm run payload migrate        (en dev : npm run payload migrate:create)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  VÉRIFICATIONS DE SÉCURITÉ À NE PAS OUBLIER
 *   - [ ] PAYLOAD_SECRET défini et unique par environnement
 *   - [ ] `cors` / `csrf` limités au(x) domaine(s) de production
 *   - [ ] Accès /admin bloqué par le middleware pour les non-authentifiés
 *   - [ ] Sauvegardes PostgreSQL automatiques avant mise en production
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Panel non monté pour l'instant : jamais de cache sur une route d'admin.
export const dynamic = 'force-dynamic'

export default function AdminPayloadPage() {
  return (
    <div className="container flex min-h-dvh flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="font-display text-sm tracking-industrial text-brand-500">ADMINISTRATION</p>
      <h1 className="text-4xl text-white">Panel Payload CMS non monté</h1>
      <p className="max-w-2xl text-sm text-white/60">
        Le squelette est en place. Le panel s’activera après le passage à Next.js 15.2+
        (contrainte de compatibilité de Payload CMS v3) : voir les instructions
        détaillées en commentaire de ce fichier et la section « Compatibilité
        Payload v3 / Next.js » du README.
      </p>
      {/* TODO [admin] : supprimer ce placeholder après le montage de Payload */}
    </div>
  )
}