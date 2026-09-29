/**
 * desktop.ts — hero vidéo pour ordinateur (≥ 900 px) : séquence 1920×1080, moteur en
 * coupe à droite, bidon à gauche qui verse, étiquettes à gauche. Réglages : HERO_DESKTOP.
 */
import { HERO_DESKTOP, RUPTURE_DESKTOP } from '@/hero-video.config'
import { lancerHeroVideo } from '@/scripts/hero-video/noyau'

export function demarrerHeroDesktop(racine: HTMLElement): void {
  const requete = matchMedia(`(min-width: ${RUPTURE_DESKTOP}px)`)
  const lancer = () => {
    if (!requete.matches || racine.dataset.pret !== undefined) return
    lancerHeroVideo(racine, HERO_DESKTOP)
  }
  lancer()
  requete.addEventListener('change', lancer)
}
