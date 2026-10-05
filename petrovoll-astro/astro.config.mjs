// @ts-check
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'astro/config'

import cloudflare from '@astrojs/cloudflare'
import vercel from '@astrojs/vercel'
import markdoc from '@astrojs/markdoc'
import react from '@astrojs/react'
import keystatic from '@keystatic/astro'
import tailwindcss from '@tailwindcss/vite'

/* ═══════════════════════════════════════════════════════════════════════════
   astro.config.mjs — SASOMA
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️  3 CORRECTIONS PAR RAPPORT À LA SPEC INITIALE (voir README § « Écarts »)

   1. `output: 'hybrid'` N'EXISTE PLUS en Astro 5 (supprimé en v5.0).
      Équivalent moderne utilisé ici :
        • output: 'server' + `export const prerender = true` dans chaque page
          publique  →  « SSG par défaut + SSR uniquement pour /keystatic »,
          exactement l'intention d'origine (les pages prérendues restent des
          fichiers statiques servis par le CDN Cloudflare).
        • Alternative « tout statique » : output: 'static' (l'admin Keystatic
          n'est alors utilisable qu'en dev — voir README).

   2. `@astrojs/tailwind` est DÉPRÉCIÉ et incompatible avec Tailwind v4.
      L'intégration officielle Tailwind v4 est le plugin Vite
      `@tailwindcss/vite` (ci-dessous) + un `@import "tailwindcss"` en CSS.

   3. Tailwind v4 est CSS-first : les tokens vivent dans `src/styles/global.css`
      via `@theme`. `tailwind.config.mjs` n'est plus lu automatiquement.

   ⚠️  VERSION — Astro 5 est épinglé conformément à la stack demandée. En
      septembre 2026, la branche stable est Astro 7.x (`astro@latest`).
      Après un bump majeur, resynchroniser les intégrations avec :
        npx astro add react markdoc cloudflare
      (cette commande installe toujours les versions compatibles avec l'Astro
      réellement installé : c'est la référence en cas de conflit de peer deps).
   ═══════════════════════════════════════════════════════════════════════════ */

export default defineConfig({
  /* ── URL publique (canonical, sitemap, og:url, llms.txt) ─────────────────
     TODO [seo] : remplacer par le domaine de production définitif. */
  site: 'https://sasoma.example',

  /* ── Rendu ───────────────────────────────────────────────────────────────
     'server' + prerender=true par page = équivalent Astro 5 du « hybrid »
     d'Astro 4. Voir l'explication en tête de fichier. */
  output: 'server',

  /* ── Adaptateur Cloudflare (CDN edge) ────────────────────────────────────
     TODO [infra] : activer `platformProxy` si vous voulez tester en local les
     bindings Cloudflare (KV, Images, Variables) :
       adapter: cloudflare({ platformProxy: { enabled: true } })
     Prérequis Cloudflare Workers pour Keystatic (APIs Node) :
       compatibility_flags = ["nodejs_compat"]   → voir wrangler.toml */
  // imageService 'compile' : les photos du client sont redimensionnées et
  // converties en WebP par sharp AU BUILD (Cloudflare n'a pas sharp à
  // l'exécution). Toutes les pages publiques étant prérendues, c'est suffisant.
  // Aperçu sur Vercel (variable VERCEL posée par leur build) : même site, adaptateur Vercel.
  adapter: process.env.VERCEL ? vercel() : cloudflare({ imageService: 'compile' }),

  /* ── Intégrations ────────────────────────────────────────────────────────
     react()    → islands React (filtre produits) uniquement
     markdoc()  → rendu des .mdoc écrits par Keystatic (contenu riche)
     keystatic()→ admin /keystatic + routes API
     NOTE : pas de @astrojs/sitemap ici — le sitemap est généré par
     src/pages/sitemap.xml.js (source unique, évite les doublons d'URL). */
  integrations: [react(), markdoc(), keystatic()],

  /* ── Tailwind CSS v4 (plugin Vite officiel) ──────────────────────────── */
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // Alias `@` → `src/` AUSSI côté Vite/bundler (les `<script>` clients et
      // les imports d'assets ne lisent pas toujours le `paths` du tsconfig).
      // TODO [perf] : analyser le bundle avec `vite-bundle-visualizer` avant
      // tout ajout de librairie client (contrainte 3G/4G).
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  },

  /* ── Build / HTML ────────────────────────────────────────────────────── */
  build: {
    // Inline les petits CSS dans le HTML : un aller-retour réseau en moins
    // sur mobile (objectif LCP < 2,5 s).
    inlineStylesheets: 'auto',
    // contact.html plutôt que contact/index.html : Cloudflare sert /contact
    // sans redirection, ce qui colle aux canoniques et au sitemap (sans « / »).
    format: 'file',
  },
  trailingSlash: 'never',
  // Compresse le HTML produit (gain de quelques Ko par page)
  compressHTML: true,

  /* ── Pas de prefetch : aucun lien ne le demandait, et précharger les liens
     visibles coûterait des données en 3G. ─────────────────────────────── */

  /* ── Images ────────────────────────────────────────────────────────────
     Le service par défaut (sharp) optimise les images AU BUILD : idéal pour
     des pages prérendues (WebP/AVIF + dimensions auto, donc zéro CLS).
     TODO [images] : si vous servez des images transformées à la volée (SSR),
     brancher le service Cloudflare Images :
       image: { service: { entrypoint: 'astro/assets/services/cloudflare' } } */

  /* ── En-têtes de sécurité ──────────────────────────────────────────────
     TODO [securite] : poser les en-têtes au niveau du CDN / middleware Astro
     (X-Content-Type-Options, Referrer-Policy, puis CSP stricte une fois les
     domaines tiers connus : Cloudinary, analytics).
     NOTE : `server.headers` n'existe pas dans la config Astro 5 ; utiliser
     `src/middleware.ts` (export `onRequest`) ou les règles Cloudflare Pages. */
})