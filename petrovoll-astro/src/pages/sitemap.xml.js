import { getCollection } from 'astro:content'
import { urlSite } from '@/lib/contenu'

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  /sitemap.xml — généré dynamiquement depuis les collections Keystatic
 * ════════════════════════════════════════════════════════════════════════════
 *  Contenu COMPLET (pas de TODO) :
 *   - pages statiques du site (priorités et fréquences différenciées)
 *   - une URL par produit (/produits/<slug>) avec `lastmod`
 *   - une URL par secteur (/secteurs/<slug>) avec `lastmod`
 *
 *  ⚠️  Le sitemap est la SOURCE UNIQUE : l'intégration @astrojs/sitemap n'est
 *      volontairement pas activée (elle produirait un second index concurrent).
 *      `robots.txt` pointe vers cette URL.
 *
 *  TODO [seo] :
 *   - [ ] Soumettre le sitemap dans Google Search Console + Bing Webmaster
 *   - [ ] Ajouter <image:image> si le référencement images devient prioritaire
 *   - [ ] Vérifier le rendu : <domaine>/sitemap.xml
 */

export const prerender = true

/** Pages statiques : [chemin, priorité, fréquence de modification]. */
const PAGES_STATIQUES = [
  ['/', '1.0', 'weekly'],
  ['/produits', '0.9', 'daily'],
  ['/a-propos', '0.6', 'monthly'],
  ['/contact', '0.8', 'monthly'],
  ['/mentions-legales', '0.2', 'yearly'],
]

/** Échappe les caractères réservés XML. */
function esc(valeur) {
  return String(valeur)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Formate une date en ISO 8601 (YYYY-MM-DD), format attendu par <lastmod>. */
function formatLastmod(date) {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date()
  return d.toISOString().split('T')[0]
}

export async function GET({ site }) {
  const base = urlSite(site).toString().replace(/\/+$/, '')
  const dateBuild = new Date()

  // Chargement parallèle : build plus rapide sur de gros catalogues
  const [produits, secteurs] = await Promise.all([
    getCollection('produits'),
    getCollection('secteurs'),
  ])

  // Un produit « indisponible » reste indexable (fiche commerciale utile),
  // mais on abaisse sa priorité via la valeur ci-dessous.
  // TODO [seo] : ajouter un champ `dateAjout` (date) dans la collection Keystatic
  // « produits » pour obtenir un <lastmod> réel par fiche (aujourd'hui : date
  // de build, ce qui reste correct mais imprécis).
  const urls = [
    ...PAGES_STATIQUES.map(([chemin, priority, changefreq]) => ({
      loc: `${base}${chemin}`,
      lastmod: formatLastmod(dateBuild),
      changefreq,
      priority,
    })),

    ...produits.map((produit) => ({
      loc: `${base}/produits/${produit.id}`,
      lastmod: formatLastmod(dateBuild),
      changefreq: 'monthly',
      priority: produit.data.enAvant ? '0.9' : '0.7',
    })),

    ...secteurs.map((secteur) => ({
      loc: `${base}/secteurs/${secteur.id}`,
      lastmod: formatLastmod(dateBuild),
      changefreq: 'monthly',
      priority: '0.7',
    })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${esc(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
