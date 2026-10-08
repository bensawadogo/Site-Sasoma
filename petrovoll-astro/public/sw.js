/* ═══════════════════════════════════════════════════════════════════════════
   sw.js — service worker SASOMA (sans dépendance)
   ═══════════════════════════════════════════════════════════════════════════
   Objectif : site utilisable avec une connexion faible ou coupée (3G, Afrique
   de l'Ouest) et moins de données consommées aux visites suivantes.

   • Pages HTML        : réseau d'abord (délai max), cache en secours, puis page
                         /hors-ligne.
   • CSS/JS/polices    : cache d'abord (noms hachés par Astro dans /_astro/).
   • Images            : cache d'abord, nombre d'entrées plafonné.
   • Séquences hero / bidon (centaines de petites images) : cache à la demande
                         seulement, dans un cache à part plafonné (jamais pré-cachées).
   • JAMAIS en cache   : /keystatic, /api, sw.js, requêtes non-GET, Range (vidéo).

   NOUVELLE VERSION : changer VERSION ci-dessous → les anciens caches sont
   supprimés à l'activation (voir docs/optimisation-reseau.md).
   ═══════════════════════════════════════════════════════════════════════════ */

const VERSION = 'v1'
const C_PAGES = `sasoma-pages-${VERSION}`
const C_STATIC = `sasoma-static-${VERSION}`
const C_IMAGES = `sasoma-images-${VERSION}`
const C_SEQ = `sasoma-sequences-${VERSION}`
const CACHES = [C_PAGES, C_STATIC, C_IMAGES, C_SEQ]

const PAGE_HORS_LIGNE = '/hors-ligne'
const INDEX_PAGES = '/__index-pages' // clé interne : titres des pages visitées
const MAX_PAGES = 40
const MAX_IMAGES = 120
const MAX_SEQ = 160 // hero (≈ 100 images) + bidon au scroll (≤ 48) sur un appareil « fort »
const MAX_STATIC = 200 // /_astro/ change de nom à chaque version : sans plafond, les anciens fichiers s'accumuleraient
const FRAICHEUR_MS = 24 * 3600 * 1000 // fichiers à nom fixe : revérifiés au plus une fois par jour
const DELAI_RESEAU_MS = 8000 // au-delà, on sert la copie en cache si elle existe

/* ── Installation : seulement la page hors ligne + ses CSS/polices (≈ 40 Ko) ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const pages = await caches.open(C_PAGES)
      const statique = await caches.open(C_STATIC)
      const rep = await fetch(PAGE_HORS_LIGNE, { cache: 'reload' })
      if (!rep.ok) throw new Error('hors-ligne indisponible')
      const html = await rep.clone().text()
      await pages.put(PAGE_HORS_LIGNE, rep)
      const liens = new Set()
      for (const m of html.matchAll(/(?:href|src)="(\/(?:_astro|fonts)\/[^"?#]+\.(?:css|js|woff2))"/g)) liens.add(m[1])
      await Promise.all(
        [...liens].map(async (u) => {
          try {
            const r = await fetch(u)
            if (r.ok) await statique.put(u, r)
          } catch {
            /* non bloquant */
          }
        }),
      )
      await self.skipWaiting()
    })(),
  )
})

/* ── Activation : suppression des anciens caches ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const noms = await caches.keys()
      await Promise.all(noms.filter((n) => n.startsWith('sasoma-') && !CACHES.includes(n)).map((n) => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting()
})

/* ── Utilitaires ── */
async function plafonner(nomCache, max) {
  const cache = await caches.open(nomCache)
  const cles = await cache.keys()
  // La page hors ligne et l'index des titres ne sont jamais éjectés.
  const evincables = cles.filter((c) => {
    const p = new URL(c.url).pathname
    return p !== PAGE_HORS_LIGNE && p !== INDEX_PAGES
  })
  const exces = evincables.length - max
  for (let i = 0; i < exces; i++) await cache.delete(evincables[i]) // les plus anciennes d'abord
}

function exclu(url, req) {
  if (url.origin !== self.location.origin) return true
  if (req.method !== 'GET') return true
  if (req.headers.has('range')) return true
  const p = url.pathname
  return (
    p.startsWith('/keystatic') ||
    p.startsWith('/api') ||
    p === '/sw.js' ||
    p.endsWith('.mp4') || // vidéos (fond du hero) : lecture par plages, laissée au navigateur
    p.startsWith('/_astro/keystatic') ||
    p.startsWith('/_server-islands')
  )
}

const cacheable = (rep) => rep && rep.status === 200 && rep.type === 'basic' && !rep.redirected

/**
 * Réseau avec délai : au bout de `ms`, on passe la main (`null`) SEULEMENT si une copie existe
 * à servir. Sans copie (première visite d'une page en 3G très lente), on attend le réseau
 * jusqu'au bout plutôt que d'afficher « hors ligne » alors que la page arrive.
 */
function reseauAvecDelai(req, ms, aUneCopie) {
  return new Promise((resolve, reject) => {
    let fini = false
    const t = setTimeout(() => {
      if (!fini && aUneCopie) reject(new Error('delai'))
    }, ms)
    fetch(req).then(
      (r) => {
        fini = true
        clearTimeout(t)
        resolve(r)
      },
      (e) => {
        fini = true
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

async function noterPage(pages, chemin, rep) {
  try {
    const html = (await rep.clone().text()).slice(0, 4000)
    const m = html.match(/<title>([^<]*)<\/title>/i)
    const index = await pages.match(INDEX_PAGES)
    const donnees = index ? await index.json() : {}
    donnees[chemin] = (m ? m[1] : chemin).replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'")
    await pages.put(INDEX_PAGES, new Response(JSON.stringify(donnees), { headers: { 'Content-Type': 'application/json' } }))
  } catch {
    /* l'index est un confort, pas une nécessité */
  }
}

/* ── Pages : réseau d'abord, cache en secours ── */
async function gererPage(req, url) {
  const pages = await caches.open(C_PAGES)
  const cle = url.pathname // sans paramètres : /contact?x=1 et /contact partagent la copie
  const existante = await pages.match(cle)
  try {
    const rep = await reseauAvecDelai(req, DELAI_RESEAU_MS, !!existante)
    if (cacheable(rep) && (rep.headers.get('content-type') || '').includes('text/html')) {
      await pages.put(cle, rep.clone())
      await noterPage(pages, cle, rep)
      await plafonner(C_PAGES, MAX_PAGES)
    }
    return rep
  } catch {
    if (existante) return existante
    const horsLigne = await pages.match(PAGE_HORS_LIGNE)
    return horsLigne || new Response('Hors ligne', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }
}

/* ── Fichiers : cache d'abord ──
   Les fichiers de /_astro/ ont un nom haché : la copie ne périme jamais. Les autres (images,
   polices, décodeurs…) gardent leur nom quand on les remplace :
   une copie de plus de 24 h est revérifiée en arrière-plan par requête conditionnelle (la version
   fraîche sert à la visite suivante), pour ne jamais rester bloqué sur une vieille image. */
async function cacheDabord(req, nomCache, max) {
  const cache = await caches.open(nomCache)
  const trouve = await cache.match(req)
  if (trouve) {
    const u = new URL(req.url)
    // Hachés (/_astro/) ou versionnés (?v=…, séquences du hero et du bidon) : la copie ne périme jamais.
    if (!u.pathname.startsWith('/_astro/') && !u.search) {
      const date = Date.parse(trouve.headers.get('date') || '')
      if (!date || Date.now() - date > FRAICHEUR_MS) {
        // `no-cache` : requête conditionnelle (ETag) → 304 de quelques octets si rien n'a changé.
        fetch(req.url, { cache: 'no-cache' })
          .then((r) => (cacheable(r) ? cache.put(req, r) : undefined))
          .catch(() => {})
      }
    }
    return trouve
  }
  const rep = await fetch(req)
  if (cacheable(rep)) {
    await cache.put(req, rep.clone())
    if (max) plafonner(nomCache, max)
  }
  return rep
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (exclu(url, req)) return // le navigateur gère normalement

  if (req.mode === 'navigate') {
    event.respondWith(gererPage(req, url))
    return
  }

  const p = url.pathname
  if (p.startsWith('/hero-video/') || p.startsWith('/bidon-studio/')) {
    event.respondWith(cacheDabord(req, C_SEQ, MAX_SEQ).catch(() => Response.error()))
  } else if (/\.(?:css|js|woff2?)$/.test(p)) {
    event.respondWith(cacheDabord(req, C_STATIC, MAX_STATIC).catch(() => Response.error()))
  } else if (/\.(?:png|jpe?g|webp|avif|gif|svg|ico)$/.test(p)) {
    event.respondWith(cacheDabord(req, C_IMAGES, MAX_IMAGES).catch(() => Response.error()))
  }
  // sinon (JSON, wasm, glb, draco…) : comportement normal du navigateur
})
