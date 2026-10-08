# Adaptation du site à la puissance de l'appareil

Date : 06/10/2026. Objectif : téléphones Android d'entrée de gamme (1-3 Go de RAM, 4 cœurs lents), 3G faible ou coupée.
Le niveau « fort » (ordinateur) garde exactement le rendu et le comportement d'avant.

## 1. Le niveau : `faible | moyen | fort`

Calculé par `src/lib/capacite-appareil.ts` (fonction `niveauAppareil`), posé avant le premier rendu par un
script inline du `<head>` de `BaseLayout.astro` sur `<html data-appareil="…">`.

| Niveau | Condition |
|---|---|
| faible | économiseur de données, réseau 2g/slow-2g, RAM ≤ 2 Go, ≤ 2 cœurs, ou réseau 3g avec RAM ≤ 4 Go |
| moyen | réseau 3g ou RAM ≤ 4 Go (le nombre de cœurs ne classe plus « moyen », voir relecture) |
| fort | tout le reste, y compris quand une valeur est inconnue (Safari, Firefox) |

« Mouvement réduit » (`prefers-reduced-motion`) : fait passer moyen → faible, mais seulement si l'appareil a déjà un
signal de faiblesse. Il ne dégrade jamais un appareil puissant : le PC du propriétaire (animations Windows coupées)
reste « fort ». Les exemptions existantes (`.defile-continu`, bidon au scroll) sont inchangées.

Le script inline est du JavaScript ES5 sans dépendance (constante `SCRIPT_APPAREIL`). Les tests
(`capacite-appareil.test.ts`) vérifient qu'il donne le même résultat que la fonction TypeScript sur 320 combinaisons.

## 2. Ce qui était lourd (mesures)

| Élément | Poids / coût | Boucle |
|---|---|---|
| Hero ordinateur, séquence | 100 fichiers, 5,1 Mo (`public/hero-video/desktop`) | rAF à chaque scroll + filet d'huile |
| Hero mobile, séquence | 76 fichiers, 2,7 Mo (`public/hero-video/mobile`) | idem |
| Moteur vivant (pièces mobiles) | atlas 0,45 Mo + atlas huile 0,6 Mo + fluide 0,66 Mo = 1,7 Mo, décodés en bitmaps | rAF en continu, moteur qui tourne tant que le hero est visible |
| Bidon au scroll (`ProduitScroll`) | 48 images × 2 tailles : `grand` 2,1 Mo, `petit` 1,2 Mo ; les 48 étaient téléchargées et décodées | rAF à chaque scroll sur toute la page |
| Bandes marques / certifications | 2 bandes, doublées (2 copies) | animation CSS infinie 45-50 s |
| `BidonScene` (3D Three.js, repli de `ProduitPhare`) | three.js + modèle GLB 1 à 1,5 Mo | rAF (déjà pausé hors écran) |
| `HeroScroll` (SVG, ancien hero) | non utilisé sur l'accueil | — |

Existait déjà : paliers du hero `lite / partiel / sequence` (forçables par paramètre), pause de la boucle du moteur
hors écran et onglet caché, et pause de la 3D hors écran.

## 3. Ce qui a changé (fichier par fichier)

- `src/lib/capacite-appareil.ts` (nouveau) : calcul du niveau, forçage `?appareil=`, `lireNiveau()`, `SCRIPT_APPAREIL`.
- `src/lib/capacite-appareil.test.ts` (nouveau) : 11 tests (règles, forçage, équivalence du script inline).
- `src/layouts/BaseLayout.astro` : un `import` et un script inline `set:html={SCRIPT_APPAREIL}` dans le `<head>` (rien d'autre).
- `src/scripts/hero-video/noyau.ts` (hero) :
  - faible → palier `lite` (2 images au lieu de 76/100, soit environ 60-100 Ko) ET moteur figé : l'affiche fixe
    reste à l'écran, plus aucune boucle `requestAnimationFrame` du moteur ;
  - moyen → palier `partiel` (une image sur deux, 3 échantillons, pas de fluide simulé) ;
  - fort → inchangé ;
  - le rendu du filet d'huile en boucle ne continue plus hors écran ni onglet caché, et repart au retour de l'onglet.
- `src/scripts/hero-video/moteur-vivant.ts` : paramètre `inerte` : aucun téléchargement de l'atlas (1,7 Mo évités).
- `src/components/home/ProduitScroll.astro` :
  - faible → aucune des 48 images téléchargée, aucun écouteur de scroll : la disposition statique (bidon de face
    + 3 cartes l'une sous l'autre) s'affiche ;
  - moyen → une image sur deux, toujours en taille « petit » (≈ 0,6 Mo au lieu de 2,1 Mo) ;
  - fort → inchangé ;
  - tous niveaux : plus de dessin quand la section est à plus d'un écran du viewport (IntersectionObserver).
- `src/components/3d/BidonScene.astro` : faible → image seulement (bouton « Voir en 3D » disponible), moyen → 3D allégée.
- `src/scripts/defile-bandes.ts` (nouveau, importé par `BandeMarques` et `BandeCertifications` à la place de deux
  scripts identiques) : bouton pause + pause automatique hors écran / onglet caché (classe `.hors-ecran`).
- `src/styles/global.css` (règles ajoutées en fin de fichier) : `.hors-ecran` pausé à tous les niveaux ; faible :
  bandes sans animation, une seule copie, rail glissable au doigt, bouton pause masqué.
- Images : `BandeMarques` et `SecteursGrid` avaient déjà `loading="lazy"` ; le bidon fixe aussi (`decoding="async"`).

## 4. Comment tester chaque niveau

Ajouter `?appareil=faible`, `?appareil=moyen` ou `?appareil=fort` à l'adresse (ex. `http://localhost:4321/?appareil=faible`).
Ou, dans la console avant un rechargement : l'attribut est posé par le `<head>`, donc utiliser le paramètre.
Vérifier l'attribut : `document.documentElement.dataset.appareil`.

À contrôler :
- **faible** : onglet Réseau = environ 2 images du hero seulement, pas d'`atlas*.webp`, pas de `/bidon-studio/` hors l'image
  fixe ; le moteur est immobile ; le bidon est un visuel fixe suivi des 3 cartes ; les bandes ne défilent pas mais se
  font glisser au doigt ; onglet Performance : plus de rAF en continu.
- **moyen** : hero en palier `partiel` (`data-palier="partiel"` sur le hero), moteur animé ; bidon : 24 images « petit » chargées.
- **fort** : identique à avant (`data-palier="sequence"` sur ordinateur).
- Pause : sortir du hero / de la section (ou changer d'onglet) arrête la boucle ; les bandes passent en
  `animation-play-state: paused` quand elles sont hors écran (classe `.hors-ecran` sur `.defile`).

## 5. Points d'attention

- Relecture 06/10 : la règle « ≤ 4 cœurs → moyen » a été retirée (un PC de bureau à 4 cœurs garde tout). Seuil
  « ≤ 2 cœurs → faible » conservé.
- Chromium arrondit `deviceMemory` (un téléphone de 3 Go annonce souvent 2 : il tombe en « faible »).
- Le hero conserve ses forçages existants (`HERO.parametreForcage`), qui priment sur le niveau.
