import { urlSite } from '@/lib/contenu'

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  /robots.txt — généré dynamiquement (Astro endpoint, statique au build)
 * ════════════════════════════════════════════════════════════════════════════
 *  STRATÉGIE 2026 (contenu volontairement COMPLET, pas de TODO) :
 *
 *  ✅ AUTORISER les « bots de RECHERCHE IA » : ils crawffent pour répondre à
 *     des requêtes utilisateurs et CITENT la source → ils génèrent du trafic
 *     qualifié. Les bloquer = disparaître des réponses génératives.
 *
 *  ⛔ INTERDIRE les « crawlers d'ENTRAÎNEMENT » : ils aspirent le contenu pour
 *     entraîner des modèles sans citer ni renvoyer de trafic.
 *
 *  ⚠️  Règles techniques respectées :
 *   - robots.txt s'évalue par GROUPES : un bot suit UNIQUEMENT le groupe le
 *     plus spécifique qui le concerne. Les directives `Disallow` des zones
 *     privées (/keystatic, /api/) sont donc RÉPÉTÉES dans chaque groupe —
 *     sinon un bot autorisé pourrait indexer l'admin.
 *   - Un `User-agent` suivi d'un groupe vide équivaut à tout autoriser.
 *
 *  TODO [seo] :
 *   - [ ] Vérifier après mise en ligne : <domaine>/robots.txt
 *   - [ ] Contrôler le rendu côté crawlers IA (Search Console + logs CDN)
 *   - [ ] Revoir la liste des bots tous les 6 mois (écosystème très mouvant)
 */

// Rend la route statique même si `output: 'server'` (cf. astro.config.mjs)
export const prerender = true

/** Chemins privés/techniques : jamais indexables, pour AUCUN robot. */
// ⚠️ Ne pas bloquer /_astro/ : Google doit pouvoir charger CSS, JS et images
// optimisées pour évaluer le rendu réel des pages.
const ZONES_PRIVEES = ['/keystatic', '/api/']

/** Bots de recherche IA + moteurs classiques → crawl autorisé. */
const BOTS_AUTORISES = [
  // ── Recherche IA (génèrent des visites et des citations) ────────────────
  'OAI-SearchBot', // OpenAI — index de recherche ChatGPT
  'ChatGPT-User', // OpenAI — navigation à la demande de l'utilisateur
  'Claude-SearchBot', // Anthropic — index de recherche Claude
  'Claude-User', // Anthropic — navigation à la demande
  'PerplexityBot', // Perplexity
  'YouBot', // You.com
  'Applebot', // Apple — recherche Siri / Spotlight
  'MistralAI-Index', // Mistral
  // ── Moteurs de recherche classiques (acquisition principale) ───────────
  'Googlebot',
  'Bingbot',
  'DuckDuckBot',
]

/** Crawlers d'entraînement : accès entièrement refusé. */
const BOTS_ENTRAINEMENT = [
  'GPTBot', // OpenAI — entraînement
  'ClaudeBot', // Anthropic — entraînement
  'anthropic-ai', // Anthropic — variante historique
  'Google-Extended', // Google — usage dans les produits génératifs/Gemini
  'CCBot', // Common Crawl — base de données d'entraînement ouverte
  'Meta-ExternalAgent', // Meta — entraînement & produits
  'Bytespider', // ByteDance — scraping massif
  'Amazonbot', // Amazon — index/AI
  'cohere-ai', // Cohere — entraînement
  'Diffbot', // extraction de données à grande échelle
  'Applebot-Extended', // Apple — usage des pages pour l'entraînement de ses modèles
]

/**
 * @param {{ site?: URL }} contexte — `site` provient de astro.config.mjs.
 */
export async function GET({ site }) {
  const base = urlSite(site).toString().replace(/\/+$/, '')

  /** Construit un groupe robots.txt conforme (User-agent + règles). */
  const groupe = (bots, regles) =>
    [
      ...bots.map((bot) => `User-agent: ${bot}`),
      ...regles,
    ].join('\n')

  const bloquerTout = groupe(BOTS_ENTRAINEMENT, ['Disallow: /'])

  const autoriserPublic = groupe(BOTS_AUTORISES, [
    'Allow: /',
    // Répété volontairement dans CHAQUE groupe (cf. règle de spécificité)
    ...ZONES_PRIVEES.map((zone) => `Disallow: ${zone}`),
  ])

  // Groupe par défaut : tout autoriser sauf les zones privées
  const defaut = groupe(
    ['*'],
    ['Allow: /', ...ZONES_PRIVEES.map((zone) => `Disallow: ${zone}`)],
  )

  const contenu = `# ═══════════════════════════════════════════════════════════════════
#  robots.txt — SASOMA
#  Recherche IA autorisée · entraînement IA refusé
#  Généré automatiquement (src/pages/robots.txt.js) — ne pas éditer à la main
# ═══════════════════════════════════════════════════════════════════════

# ── 1. Autoriser les bots de RECHERCHE IA (ils citent la source) ─────────
${autoriserPublic}

# ── 2. Refuser les crawlers d'ENTRAÎNEMENT (protection du contenu) ───────
${bloquerTout}

# ── 3. Règle par défaut (moteurs classiques, autres agents) ──────────────
${defaut}

# ── 4. Localisation des ressources ──────────────────────────────────────
Sitemap: ${base}/sitemap.xml
# Guide destiné aux LLM (nouveau standard 2026)
# LLMs-Txt: ${base}/llms.txt
`

  return new Response(contenu, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Cache long côté CDN : le fichier ne change qu'au déploiement
    },
  })
}
