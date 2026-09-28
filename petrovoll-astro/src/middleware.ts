/**
 * middleware.ts — en-têtes des réponses rendues par le Worker (admin, API).
 *
 * public/_headers ne s'applique qu'aux fichiers statiques de Cloudflare Pages :
 * l'admin /keystatic et /api passent par le Worker et ne le reçoivent pas.
 * On leur interdit ici l'indexation (en plus du Disallow de robots.txt, qui
 * n'empêche pas une URL connue d'apparaître dans Google).
 */
import { defineMiddleware } from 'astro:middleware'

const ZONES_PRIVEES = ['/keystatic', '/api/']

export const onRequest = defineMiddleware(async (contexte, suite) => {
  const reponse = await suite()
  if (contexte.isPrerendered || !ZONES_PRIVEES.some((zone) => contexte.url.pathname.startsWith(zone))) {
    return reponse
  }
  // Copie : certaines réponses (redirections, fetch) ont des en-têtes figés.
  const copie = new Response(reponse.body, reponse)
  copie.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return copie
})
