# Hero au scroll : fonctionnement et marche à suivre pour un autre produit

Phase 9 du [brief](../BRIEF-MAITRE.md). Les décisions qui ont conduit à cette version sont dans [TODO.md](../TODO.md) (D1 à D5).

## Ce que voit le visiteur

| Scroll | Temps | À l'écran |
|---|---|---|
| 0 → 8 % | Ouverture | Titre, bidon debout, moteur « sec » |
| 8 → 35 % | T1 | L'huile dorée monte dans le bidon, masquée par sa silhouette |
| 35 → 55 % | T2 | Le bouchon saute, le bidon bascule de 115°, le filet coule dans l'orifice du moteur |
| 55 → 92 % | T3 | Le moteur s'ouvre et tourne. La caméra passe des cames aux pistons, puis au vilebrequin, pendant que l'huile les nappe un par un. |
| 92 → 100 % | Fin | Cartes voiture et moto, bouton WhatsApp |

Remonter la page rembobine tout.

## Les fichiers

| Fichier | Rôle |
|---|---|
| `petrovoll-astro/src/hero.config.ts` | **Tous les réglages** : temps, zones de l'écran, cadrages du moteur, textes, produits, message WhatsApp. Volontairement hors de l'admin. |
| `petrovoll-astro/src/components/hero/HeroScroll.astro` | Structure HTML et CSS de la scène |
| `petrovoll-astro/src/scripts/hero-scroll.ts` | L'animation : un écouteur de scroll, rendu dans requestAnimationFrame, uniquement `transform` et `opacity` |
| `petrovoll-astro/src/lib/hero-timeline.ts` | Les calculs (fondus, rotation, cadrages, choix du palier), testés |
| `petrovoll-astro/src/components/hero/MoteurSVG.astro` + `src/scripts/moteur-svg.ts` | Le moteur vectoriel et sa cinématique (bielle-manivelle, cames à demi-vitesse), testés |
| `petrovoll-astro/scripts/build-bidon-hero.mjs` | Prépare la photo du bidon : corps, bouchon, vignette, géométrie |
| `assets/photos/SELECTION.md` | Journal de sélection des photos (origine, taille, verdict) |

## Refaire le hero pour un autre produit

1. **La photo.** Il faut une vraie photo du bidon, de face, détourée (PNG transparent), la plus grande possible (au moins 1500 px de haut pour les écrans d'ordinateur). Aucune image générée par IA : vérifie son origine et note-la dans `assets/photos/SELECTION.md`.
2. **Le découpage.** Remplace `assets/photos/stark/P1.png`, puis lance `npm run hero:bidon` dans `petrovoll-astro`. Le script repère le bouchon à sa couleur rouge. Pour un bouchon d'une autre couleur, adapte `rougeBouchon()` dans le script. Il mesure le goulot et le pivot, puis écrit `src/assets/hero/bidon/geometrie.json`, que la config lit toute seule.
3. **La config.** Dans `hero.config.ts`, change `produitVerse`, `produitsFin` (identifiants de `research/catalogue.json`) et les textes. Aucune donnée technique (viscosité, normes) sans la fiche technique du produit (règle 5 du brief).
4. **L'écran de fin.** Mets les visuels des produits dans `src/assets/hero/` et liste-les dans `VIGNETTES`, en haut de `HeroScroll.astro`.
5. **La vérification.** `npm test`, `npx astro check`, `npm run build`, puis des captures en 360×800, 390×844 et 1440×900 aux progressions 0 / 0,2 / 0,45 / 0,7 / 1 (et entre 0,5 et 0,6 pour le filet). On ne livre rien sans avoir regardé les captures.

## Paliers de performance

Le hero pèse le même poids partout : quelques dizaines de Ko d'images du bidon, et le moteur en SVG. Les paliers ne règlent que le coût du rendu :

| Palier | Quand | Effet |
|---|---|---|
| lite | Économie de données, 2G/3G, ≤ 2 Go de RAM, mouvement réduit | Canvas du filet en définition 1, reflet fixe. En mouvement réduit : pas de bascule ni de rotation, seulement des fondus. |
| standard | Téléphones par défaut | Définition 1,5, reflet animé |
| full | ≥ 6 Go en 4G, ou ordinateur | Définition 2 |

- **Garde-fou** : si l'intervalle moyen entre deux images dépasse 24 ms pendant 2 s (moins de 42 images/s), le hero descend d'un palier. Un téléphone en économie d'énergie bridé à 30 Hz descend donc aussi, sans gravité.
- **Forcer un palier** : `?tier=lite`, `?tier=standard` ou `?tier=full` dans l'adresse (le garde-fou est alors désactivé).

## Plus tard : une vraie vidéo du moteur

Le scénario de génération par IA (images E1 à E3, vidéos V1 et V2) reste décrit dans [scenario/shots.md](../scenario/shots.md), et son budget dans `ops/credits.md`. Le chargeur de séquences d'images a été retiré avec la décision D3, mais on peut le retrouver dans l'historique Git (commit `22ed5d0`, `scripts/build-frames.mjs`) si l'on branche un jour les outils du brief.
