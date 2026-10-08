/**
 * fond-route.ts — vidéo de fond du hero (route, nuages en boucle ; FOND_ROUTE dans hero-video.config.ts).
 *  - niveau « faible » : rien n'est téléchargé, l'affiche (image fixe) reste ;
 *  - ordinateur : 1080p pour un appareil « fort » sur grand écran, sinon 720p ; téléphone :
 *    version verticale 720×1280 (550 Ko) ; rien en 2G/3G ni en économie de données ; la vidéo n'est demandée qu'après le chargement de la page ;
 *  - lecture en pause hors de l'écran ou onglet caché (une vidéo invisible ne doit rien coûter).
 */
import { FOND_ROUTE } from '@/hero-video.config'
import { lireNiveau } from '@/lib/capacite-appareil'

export function demarrerFondRoute(video: HTMLVideoElement) {
  if (video.dataset.branche !== undefined) return
  video.dataset.branche = ''
  const niveau = lireNiveau()
  if (niveau === 'faible') return
  // Connexion lente ou économie de données : l'affiche suffit, la vidéo n'est pas téléchargée.
  const reseau = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  if (reseau?.saveData || /(^|-)(2g|3g)$/.test(reseau?.effectiveType ?? '')) return

  const pxReels = window.innerWidth * Math.min(window.devicePixelRatio || 1, 3)
  let nom = 'route-tel'
  if (video.dataset.format === 'desktop') {
    // 08/10 : plus de 4K (12,8 Mo, trop lourd ressenti « lent ») : 1080p au plus.
    nom = niveau === 'fort' && pxReels >= 1600 ? 'route-1080' : 'route-720'
  }
  const source = `${FOND_ROUTE.dossier}/${nom}.mp4?v=${FOND_ROUTE.version}`

  // Avec IntersectionObserver, on attend son premier verdict : le hero de l'autre format
  // (masqué en CSS) ne doit ni lire ni télécharger sa vidéo.
  let visible = !('IntersectionObserver' in window)
  // La vidéo ne passe qu'après la page (images du moteur, bidon) : l'affiche la remplace d'ici là.
  let pageChargee = document.readyState === 'complete'
  const maj = () => {
    if (visible && !document.hidden && pageChargee) {
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
  if (!pageChargee)
    addEventListener(
      'load',
      () =>
        setTimeout(() => {
          pageChargee = true
          maj()
        }, 800),
      { once: true },
    )
  maj()
}
