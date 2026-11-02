/**
 * middleware.ts — en-têtes des réponses rendues par le Worker (admin, API).
 *
 * public/_headers ne s'applique qu'aux fichiers statiques de Cloudflare Pages :
 * l'admin /keystatic et /api passent par le Worker et ne le reçoivent pas.
 * On leur interdit ici l'indexation (en plus du Disallow de robots.txt, qui
 * n'empêche pas une URL connue d'apparaître dans Google).
 *
 * Admin en ligne : seulement avec Keystatic Cloud (PUBLIC_KEYSTATIC_PROJECT), qui
 * demande la connexion du client et enregistre sur GitHub. Sans lui, Keystatic est en
 * mode « fichiers locaux » : en ligne, la page s'ouvrait sans mot de passe, vide, et ne
 * pouvait rien enregistrer. Elle est donc fermée (404) ; en local (npm run dev), rien ne change.
 */
import { defineMiddleware } from 'astro:middleware'

const ZONES_PRIVEES = ['/keystatic', '/api/']
const ZONES_ADMIN = ['/keystatic', '/api/keystatic']
const ADMIN_EN_LIGNE = !!import.meta.env.PUBLIC_KEYSTATIC_PROJECT

const PAGE_FERMEE = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Administration</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#00244a;color:#fff;text-align:center;padding:24px">
<div><p style="font-size:20px;font-weight:600;margin:0 0 12px">Administration du site</p><p style="margin:0 0 24px;opacity:.8">Cet espace n’est pas encore ouvert.</p><a href="/" style="color:#f59e42">Retour au site</a></div></body></html>`

const dansZone = (chemin: string, zones: string[]) => zones.some((zone) => chemin === zone || chemin.startsWith(zone.endsWith('/') ? zone : `${zone}/`))

export const onRequest = defineMiddleware(async (contexte, suite) => {
  const chemin = contexte.url.pathname
  if (!contexte.isPrerendered && import.meta.env.PROD && !ADMIN_EN_LIGNE && dansZone(chemin, ZONES_ADMIN)) {
    return new Response(PAGE_FERMEE, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
    })
  }
  const reponse = await suite()
  if (contexte.isPrerendered || !dansZone(chemin, ZONES_PRIVEES)) {
    return reponse
  }
  // Copie : certaines réponses (redirections, fetch) ont des en-têtes figés.
  const copie = new Response(reponse.body, reponse)
  copie.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return copie
})
