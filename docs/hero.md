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

## Hero vidéo (aperçu `/apercu-hero`)

Version 3 : bidon réel à droite, moteur en coupe à gauche (images retournées : son goulot est côté bidon). Avec la photo du bidon (goulot en haut à gauche), c'est le seul sens où le goulot passe devant : l'huile arrive au bec vers 60° et l'étiquette reste lisible ; à gauche du moteur, le bidon devait presque se retourner. Le versement est une petite simulation, fonction pure du scroll (`lib/versement.ts`, testé) : levée par la poignée, goulot tenu au-dessus de l'orifice, débit lié à l'angle et au remplissage, filet en chute libre, coupure, sortie vers le haut.

| Scroll | À l'écran |
|---|---|
| t1 | Bidon debout, l'huile monte dedans |
| t2 | Le bouchon saute ; le bidon se penche au-dessus du goulot du moteur, la surface de l'huile reste horizontale ; le filet tombe en chute libre dans le goulot (anneau et gouttelettes à l'arrivée) |
| t3 | La séquence montre l'huile qui descend dans le moteur : cames (plan C1), pistons (C2), vilebrequin (C3). Le filet se tarit, le bidon se redresse. Chaque pièce reçoit son étiquette quand l'huile l'atteint (textes `HERO.textes.t3`) |
| fin | Produits et bouton |

Deux heros séparés, un par format ; un seul est affiché (media query à 900 px) et lui seul lance son script et charge ses images.

| | Mobile (< 900 px) | Desktop (≥ 900 px) |
|---|---|---|
| Composant | `components/hero/video/HeroMobile.astro` | `components/hero/video/HeroDesktop.astro` |
| Script | `scripts/hero-video/mobile.ts` | `scripts/hero-video/desktop.ts` |
| Réglages | `HERO_MOBILE` (`hero-video.config.ts`) | `HERO_DESKTOP` |
| Séquence | 72 images 880×614 (2,2 Mo) | 120 images 1920×1080 (8,4 Mo) |
| Étiquettes | pastilles sur les pièces, texte en bas | titre et texte à gauche du moteur, reliés par un trait |

Communs : `noyau.ts` (textes, bidon, filet, étiquettes, séquence), `BidonHero.astro`, `HeroTextes.astro`, `HeroReperes.astro`, `lib/sequence-images.ts` et `lib/versement.ts` (testés). Points du moteur (goulot, pièces) et plans : `MOTEUR` et `PLANS_T3` dans `hero-video.config.ts`. Paliers : lite (économie de données, 2G/3G, ≤ 2 Go) deux images en fondu ; partiel (débit < 1,5 Mb/s ou ≤ 3 Go) une image sur deux ; sequence : toutes (forçage `?tier=lite|partiel|sequence`). Images téléchargées en Blob et décodées hors du fil principal. Mesures : `ops/perf/` (Lighthouse avant/après, `outil/scroll.mjs`, `outil/captures.mjs`).

**Refaire les vidéos** (journal : `ops/credits.md`, clé `DEAPI_API_KEY` dans `.env`, jamais commitée) :
1. Image fixe du moteur en coupe : `python ops/scripts/deapi.py image ZImageTurbo_INT8 1344 768 GRAINE assets/ai/v3/prompt-coupe-2.txt K1.png 8`.
2. Éditions alignées (même graine pour les trois) : `deapi.py editer Flux_2_Klein_4B_BF16 K1.png 3303 edit-K2b.txt K2.png 4 1344 768`, idem K3 et K4.
3. Plans caméra fixe : `deapi.py video Ltx2_5_22B_Dist_INT8 1344 768 121 24 1101 K1.png K2.png clip-C1.txt C1.mp4`, puis K2 → K3 (C2) et K3 → K4 (C3).
4. Animation (v4, remplace la composition des vidéos IA) : `python ops/scripts/animer_moteur.py assets/ai/v3/K1.png assets/ai/videos/moteur-v3.mp4` (≈ 25 min) : film d'huile (absorption, reflets, coulures), gouttes, nappe au fond du carter, pistons et bielles en bielle-manivelle. Planche de contrôle sans tout calculer : `animer_moteur.py K1.png --apercu 60,200,360 planche.png`. Ancienne composition : `ops/scripts/composer_huile.py`.
5. `npm run hero:video`. Si le moteur change, repérer à nouveau `MOTEUR` (goulot, pièces, bord droit).

**Mettre en ligne** : dans `src/pages/index.astro`, remplacer `HeroScroll` par `HeroVideo`.

## Aperçu du moteur en images IA (`?moteur=ia`)

Ajoute `?moteur=ia` à l'adresse (par exemple `/?moteur=ia`) : le dessin SVG est remplacé par les images IA E1 → E3, dans le même carré. Le script fait un fondu vers E2 puis E3, avec une poussée de caméra vers l'orifice suivie d'un recul, et le filet d'huile vise l'orifice de E1. Réglages : `moteurIA` dans `hero.config.ts`. Sans ce paramètre, aucune image IA n'est téléchargée.

Pour changer les images : remplace `assets/ai/E1.png`, `E2.png` et `E3.png` (720×1280, origine notée dans `ops/credits.md`), puis lance `npm run hero:moteur-ia`. Le script découpe un carré centré sur le moteur.

## Plus tard : une vraie vidéo du moteur

Le scénario de génération par IA (images E1 à E3, vidéos V1 et V2) reste décrit dans [scenario/shots.md](../scenario/shots.md), et son budget dans `ops/credits.md`. Le chargeur de séquences d'images a été retiré avec la décision D3, mais on peut le retrouver dans l'historique Git (commit `22ed5d0`, `scripts/build-frames.mjs`) si l'on branche un jour les outils du brief.
