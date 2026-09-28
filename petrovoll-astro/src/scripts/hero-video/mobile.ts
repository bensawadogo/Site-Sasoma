/**
 * mobile.ts — hero vidéo pour téléphone (< 900 px) : séquence 880×614, bidon en haut
 * à gauche qui verse, pastilles sur les pièces, textes en bas. Réglages : HERO_MOBILE
 * (hero-video.config.ts).
 */
import { HERO_MOBILE, RUPTURE_DESKTOP } from '@/hero-video.config'
import { lancerHeroVideo } from '@/scripts/hero-video/noyau'

export function demarrerHeroMobile(racine: HTMLElement): void {
  const requete = matchMedia(`(max-width: ${RUPTURE_DESKTOP - 1}px)`)
  const lancer = () => {
    if (!requete.matches || racine.dataset.pret !== undefined) return
    lancerHeroVideo(racine, HERO_MOBILE)
  }
  lancer()
  // Rotation / redimensionnement : on ne lance le hero mobile que s'il devient visible.
  requete.addEventListener('change', lancer)
}
