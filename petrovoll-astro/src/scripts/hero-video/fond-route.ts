/**
 * fond-route.ts — vidéo de fond du hero (route, nuages en boucle ; FOND_ROUTE dans hero-video.config.ts).
 *  - niveau « faible » : rien n'est téléchargé, l'affiche (image fixe) reste ;
 *  - ordinateur : 4K pour un appareil « fort » sur grand écran (≥ seuil4k px réels), sinon 1080p,
 *    720p pour un appareil « moyen » sur petit écran ; téléphone : version verticale 1080×1920 ;
 *  - lecture en pause hors de l'écran ou onglet caché (une vidéo invisible ne doit rien coûter).
 */
import { FOND_ROUTE } from '@/hero-video.config'
import { lireNiveau } from '@/lib/capacite-appareil'

export function demarrerFondRoute(video: HTMLVideoElement) {
  if (video.dataset.branche !== undefined) return
  video.dataset.branche = ''
  const niveau = lireNiveau()
  if (niveau === 'faible') return

  const pxReels = window.innerWidth * Math.min(window.devicePixelRatio || 1, 3)
  let nom = 'route-tel'
  if (video.dataset.format === 'desktop') {
    if (niveau === 'fort' && pxReels >= FOND_ROUTE.seuil4k) nom = 'route-4k'
    else if (niveau === 'moyen' && pxReels < 1600) nom = 'route-720'
    else nom = 'route-1080'
  }
  const source = `${FOND_ROUTE.dossier}/${nom}.mp4?v=${FOND_ROUTE.version}`

  // Avec IntersectionObserver, on attend son premier verdict : le hero de l'autre format
  // (masqué en CSS) ne doit ni lire ni télécharger sa vidéo.
  let visible = !('IntersectionObserver' in window)
  const maj = () => {
    if (visible && !document.hidden) {
      if (!video.src) video.src = source
      video.play().catch(() => {})
    } else video.pause()
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      maj()
    }).observe(video)
  }
  document.addEventListener('visibilitychange', maj)
  // Fondu d'entrée quand la vidéo peut jouer : l'affiche (même image) ne « saute » pas.
  video.addEventListener('playing', () => video.classList.add('pret'), { once: true })
  maj()
}
