/**
 * defile-bandes.ts — bandes défilantes (BandeMarques, BandeCertifications) :
 *  - bouton pause (WCAG 2.2.2), branché une seule fois même si plusieurs bandes l'importent ;
 *  - défilement CSS mis en pause hors de l'écran ou onglet caché (classe `.hors-ecran`,
 *    règle dans global.css) : une animation invisible ne doit rien coûter.
 *  Niveau « faible » : le défilement est supprimé en CSS ([data-appareil='faible'] dans global.css).
 */
document.querySelectorAll<HTMLButtonElement>('[data-pause-defile]:not([data-branche])').forEach((b) => {
  b.dataset.branche = ''
  b.addEventListener('click', () => {
    const pause = b.getAttribute('aria-pressed') !== 'true'
    b.setAttribute('aria-pressed', String(pause))
    b.closest('section')?.classList.toggle('en-pause', pause)
    b.querySelector('.sr-only')!.textContent = pause ? 'Relancer le défilement' : 'Mettre en pause le défilement'
  })
})

document.querySelectorAll<HTMLElement>('.defile:not([data-observe])').forEach((defile) => {
  defile.dataset.observe = ''
  let visible = true
  const majPause = () => defile.classList.toggle('hors-ecran', !visible || document.hidden)
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      majPause()
    }).observe(defile)
  }
  document.addEventListener('visibilitychange', majPause)
})
