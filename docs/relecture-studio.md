# Relecture « studio » (typographie + transitions) — 07/10

## Conflits entre les deux chantiers
- Deux systèmes d'apparition distincts, sans collision : `.reveal` / `is-visible` (scroll-reveal.js, cartes et chiffres) et `.titre-anime` / `est-visible` (titres-animes.ts, mots). Aucun élément ne porte les deux, sauf un cas corrigé ci-dessous.
- Corrigé : `SecteursGrid.astro` — le conteneur du titre portait `.reveal` en plus du `TitreAnime` (fondu du bloc + montée des mots qui se cumulent, le fondu masquait le début de la montée). `.reveal` retiré du conteneur du titre ; les cartes gardent le leur.
- `.raccord` : aucun z-index, `pointer-events:none`, `aria-hidden` ; ne masque aucun contenu. `.grain` appliqué à BandeCertifications et ProduitScroll (sections sombres, pointer-events:none).
- Sélecteurs globaux : `.btn-primary` (reflet, overflow:hidden) touche toutes les pages ; vérifié sur /produits et /contact, rien de cassé. Pas de collision de noms avec le hero.
- Mouvement réduit / appareil faible : titres et images sans masque (règles sous `prefers-reduced-motion: no-preference` et `:not([data-appareil='faible'])`).

## Test réel (build propre, dist servi sur 5056, Playwright)
Accueil en 1440x900 et 390x844, mouvement `no-preference` et `reduce`, et `?appareil=faible` ; défilement par écran, 1 s d'attente. Plus /produits et /contact en ordinateur et téléphone.
Résultat : 0 titre/contenu resté invisible, 0 erreur console, 0 débordement horizontal, aucun titre coupé (téléphone compris). `npm run test` : 83 tests OK ; `npm run build` OK ; dist-studio supprimé.

## Restant (décision de design)
- Mot en accent (« partenaire », « exigences ») en Inter italique fin à 0,82 em : un peu plus léger et plus petit que le Bebas voisin, surtout sur téléphone ; à valider à l'œil.
- Sur téléphone, un blanc assez haut entre la carte « devis » et le pied de page (raccord marine-clair puis padding).

## Captures
`ops/captures/relecture-studio/` : planche-tel-no.png, planche-tel-red.png, planche-tel-faible.png, planche-pc-no.png, detail-A.png, detail-B.png, et les écrans bruts pc-/tel-*.png ; script test.py.
