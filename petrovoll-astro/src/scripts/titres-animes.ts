/**
 * titres-animes.ts — déclenche l'apparition des titres `TitreAnime` (une seule fois par titre).
 * L'animation elle-même est en CSS (voir components/ui/TitreAnime.astro) : ce script ne fait
 * qu'ajouter la classe `est-visible` quand le titre entre à l'écran.
 */
const titres = document.querySelectorAll<HTMLElement>('[data-titre-anime]')

if (titres.length > 0) {
  if (!('IntersectionObserver' in window)) {
    titres.forEach((t) => t.classList.add('est-visible'))
  } else {
    const observer = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          if (!entree.isIntersecting) continue
          entree.target.classList.add('est-visible')
          observer.unobserve(entree.target)
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
    )
    titres.forEach((t) => observer.observe(t))
  }
}
