/**
 * @type {import('next').NextConfig}
 *
 * ═════════════════════════════════════════════════════════════════════════════
 *  next.config.mjs — PETROVOLL
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * ⚠️  POURQUOI .mjs ET NON .ts ?
 *     La stack demandée fige Next.js 14 (voir package.json).
 *     Le chargement d'un fichier typé `next.config.ts` n'existe QU'À PARTIR
 *     DE NEXT.JS 15. Sur Next 14, `next dev` refuse de démarrer si le fichier
 *     s'appelle next.config.ts.
 *
 *     → Quand vous passerez à Next.js 15.2+ (obligatoire pour activer Payload
 *       CMS v3, cf. README), renommez simplement ce fichier en
 *       `next.config.ts` et convertissez-le :
 *          · supprimez le bloc `module.exports` et utilisez `export default`
 *          · ajoutez devant l'objet : import type { NextConfig } from 'next'
 *          · remplacez `experimental.serverComponentsExternalPackages`
 *            par `serverExternalPackages` (top-level, API Next 15)
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Sortie autonome : indispensable pour l'image Docker (Dockerfile) et PM2/VPS.
  // Génère `.next/standalone/server.js` qui embarque ses dépendances minimales.
  output: 'standalone',

  // Masque l'en-tête X-Powered-By (durcissement en production).
  poweredByHeader: false,
  compress: true,

  images: {
    // Cloudinary = CDN officiel des visuels produits (bidons PETROVOLL, pneus…)
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // TODO [images] : ajouter le domaine du CDN définitif si différent
    ],
    // AVIF en priorité (meilleure compression), WebP en repli.
    formats: ['image/avif', 'image/webp'],
    // TODO [images] : valider les tailles réellement utilisées par la grille
    // produits et la fiche produit pour éviter les re-générations inutiles.
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [64, 96, 128, 200, 256, 384, 420],
  },

  // ── Sécurité (en-têtes appliqués à toutes les routes) ─────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // TODO [securite] : ajouter une Content-Security-Policy stricte
          // (attention : la scène Three.js + Cloudinary + le panel Payload
          // nécessitent d'autoriser blob:, data: et res.cloudinary.com).
        ],
      },
      {
        // Les modèles 3D du bidon PETROVOLL ne changent jamais : cache long.
        source: '/models/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },

  // ── Redirections ─────────────────────────────────────────────────────────
  async redirects() {
    return [
      // TODO [routing] : décider du point d'entrée admin.
      // Payload v3 sert son panel sur /admin ; NextAuth utilise /admin/login.
      // Exemple à activer une fois le panel câblé :
      // { source: '/dashboard', destination: '/admin', permanent: false },
    ]
  },

  // ── Options expérimentales (API Next 14) ─────────────────────────────────
  experimental: {
    // Paquets Node natifs / non transpilables à exclure du bundling Server
    // Components. Obligatoire pour Payload, sharp et bcryptjs.
    serverComponentsExternalPackages: [
      'payload',
      '@payloadcms/db-postgres',
      '@payloadcms/richtext-lexical',
      'sharp',
      'cloudinary',
      'bcryptjs',
    ],
    // TODO [perf] : activer `optimizePackageImports: ['lucide-react']` si le
    // bundle client dépasse les seuils de performance (marché mobile 3G/4G).
  },

  // ── Intégration Payload CMS v3 ───────────────────────────────────────────
  // TODO [payload] : À ACTIVER UNIQUEMENT APRÈS PASSAGE À NEXT.JS 15.2+
  //
  //   import { withPayload } from '@payloadcms/next/withPayload'
  //   export default withPayload(nextConfig, { devBundleServerPackages: false })
  //
  // `withPayload` injecte l'admin Payload monté dans app/(admin)/admin/[...rest]
  // et configure l'importMap. Sur Next 14 l'appel échoue (API interne Next 15).
  //
  // ── Chargement du .glb du bidon ──────────────────────────────────────────
  // Aucun loader webpack n'est nécessaire : le fichier est servi statiquement
  // depuis /public/models/petrovoll-bidon.glb puis récupéré au runtime par
  // `useGLTF` (drei) côté client. Prévoir un fallback 2D si WebGL absent.
}

export default nextConfig