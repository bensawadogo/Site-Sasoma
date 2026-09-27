/**
 * scroll-reveal.js — revelation au scroll (SANS dependance, ~1 Ko).
 * Charge en `defer` depuis BaseLayout. Progressive enhancement :
 * sans JS, `.reveal` reste visible (l'etat masque exige .js-reveal-ready).
 *
 * TODO [perf] : ajouter `data-reveal-delay` (stagger) si besoin d'effet cascade.
 */
(function () {
  var cibles = document.querySelectorAll('.reveal');
  if (!cibles.length) return;
  // NOTE : `js-reveal-ready` est posé par le script inline critique de
  // BaseLayout.astro (premier rendu) — on ne le repose pas ici.
  if (!('IntersectionObserver' in window)) {
    cibles.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  cibles.forEach(function (el) { io.observe(el); });
})();
