# Plans du hero : prompts, négatifs, ratios, ancres

> **Version 3 en place sur `/apercu-hero`** (voir la fin de ce fichier) : moteur en coupe, image fixe K1 + éditions K2 à K4 + plans caméra fixe C1 à C3. Les plans E1 à E3 / V1 et V2 ci-dessous sont l'ancienne approche (le moteur se déformait entre images différentes).

Phase 2 du [brief](../BRIEF-MAITRE.md). **Rien n'a été généré.** Les valeurs techniques (temps, ancres, zones) viennent de [petrovoll-astro/src/hero.config.ts](../petrovoll-astro/src/hero.config.ts) : ce fichier fait foi en cas d'écart.

Produit qui verse : **STÄRK** (voiture). La fin présente STÄRK (voiture) et MÖTPRO 4T (moto). Le moteur est donc un **4 cylindres en ligne de voiture, essence**, générique et sans marque.

---

## Règles communes à toutes les images et vidéos IA

| Règle | Valeur |
|---|---|
| Fond | Noir pur |
| Lumière | Une lampe principale chaude (3200 K) à **gauche**, ombres profondes à droite |
| Interdit dans l'image | Texte, chiffres, logo, marque, étiquette, filigrane, **bidon ou récipient**, mains, personnes |
| Huile | Or brillant, `#f0cc30` → `#cc9c0c` (or du logo Petrovöll), visqueuse, coule **vers le bas** |
| Haut de l'image (0–12 %) | Vide : réservé à l'en-tête |
| Bas de l'image (70–100 %) | Sombre : les textes s'y posent |
| Mobile (9:16) | Filler entre x = 0,15 et 0,85 : sur un écran 360×800, on perd 10 % de chaque côté (marge de sécurité à 15 %) |

### Négatif image (commun)
```
text, letters, numbers, logo, brand name, emblem, watermark, signature, label, sticker, bottle, jerrycan, oil can, container, packaging, funnel, person, hands, garage, workshop, car body, wheels, cartoon, illustration, cgi plastic look, blurry, low detail, deformed metal, melted parts, extra cylinders, duplicated parts, asymmetrical engine, oil spill on the floor, rust, dirt
```
FLUX.1-schnell n'accepte pas de prompt négatif. Avec lui, seul le prompt positif compte.

### Formats natifs, puis mise à l'échelle
| Modèle | 9:16 | 16:9 |
|---|---|---|
| Qwen-Image / Qwen-Image-Edit | 928×1664 | 1664×928 |
| FLUX.1-schnell | 768×1344 | 1344×768 |

Cible finale : 1080×1920 / 1920×1080. Le palier full passe par un upscale (§4) ; le palier standard, en 540×960, n'en a pas besoin.

---

## E1 : moteur « sec », vue 3/4 de dessus, bouchon de remplissage ouvert

- **Outil** : niveau 1 = `hf-mcp-server` → Qwen-Image (FLUX.1-schnell en secours), **3 variantes** en 9:16, graines notées dans `ops/credits.md`.
- **Ancre filler** (tolérance ±3 %) :
  - 9:16 : x 0,50 ; y 0,50
  - 16:9 : x 0,60 ; y 0,46

### E1-916 (9:16)
```
Photorealistic commercial studio photograph of a clean modern inline four-cylinder gasoline car engine, three-quarter top view, isolated on a pure black background. The oil filler cap is removed: the round oil filler opening on top of the valve cover is open and clearly visible, placed exactly at the horizontal center of the frame, at the vertical middle. Single warm tungsten key light from the left, soft rim light, deep shadows on the right side. Brushed aluminium valve cover, dark cast iron block, black rubber hoses, precise machined details, dry clean metal with no oil. Composition: the engine fills the middle band of the frame, from 38% to 72% of the height; empty black space above the engine; the bottom quarter fades into darkness. No text, no logo, no labels. 85mm lens, f/8, ultra detailed, automotive advertising photography.
```

### E1-169 (16:9), à partir de la variante E1-916 retenue
Même prompt que E1-916, en remplaçant la phrase de composition par :
```
The oil filler opening is placed at 60% of the width and 46% of the height. The engine occupies the center-right of the frame; the left third is empty black space; the bottom quarter fades into darkness.
```
**Méthode** : on passe d'abord par Qwen-Image-Edit, avec E1-916 en entrée, pour garder le même moteur. On ne génère une nouvelle image que si la cohérence échoue (déclencheur B4).

---

## E2 : même moteur, vue plongeante, arbre à cames nappé d'huile dorée

- **Outil** : `hf-mcp-server` → Qwen-Image-Edit, avec **E1 retenue en entrée** (9:16, puis 16:9 depuis E1-169).
- **Remarque** : E2 montre l'**intérieur de la culasse**. La vidéo V1 y entre en plongeant par l'ouverture de remplissage : c'est ce qui rend la transition continue.
```
Keep exactly the same engine, same materials, same warm light from the left and the same pure black background. Change the view to a steep top-down view over the cylinder head with the valve cover removed, revealing the camshaft, cam lobes and valve springs. A thin glossy film of golden oil coats the camshaft and slowly runs down between the cam lobes. Keep the top 12% of the frame empty and the bottom quarter dark. No text, no logo, no bottle.
```

## E3 : même moteur, vue en coupe, pistons et vilebrequin dorés

- **Outil** : Qwen-Image-Edit, avec E2 en entrée (E1 en secours si la cohérence dérive).
```
Keep exactly the same engine, same materials, same warm light from the left and the same pure black background. Clean technical cutaway of the engine block: the side is cut open to reveal the four pistons, connecting rods and the crankshaft. A glossy film of golden oil coats the piston skirts, the cylinder walls and the crankshaft journals, with bright specular highlights; oil drips downward. Keep the top 12% of the frame empty and the bottom quarter dark. No text, no logo, no bottle.
```

---

## V1 : E1 → E2 (plongée dans le moteur, 5 s)

| Paramètre | Valeur |
|---|---|
| Image de début / de fin | `assets/ai/E1-916.png` → `assets/ai/E2-916.png` (V1-D : les versions 169) |
| Durée, cadence | 5 s ; 24 i/s, ou la cadence native du modèle |
| Ratio | 9:16 pour V1-M, puis 16:9 pour V1-D |
| Ordre des outils | Labo manuel (Kling / Hailuo) → Kaggle Wan 2.2 FLF → Replicate `lucataco/wan-2.2-first-last-frame` → Higgsfield (Kling 3.0, puis Seedance 2.0, puis Veo 3.1) |

```
One slow continuous camera move with no cuts: the camera glides forward and tilts down from the three-quarter view, dives smoothly through the open oil filler opening and arrives in a top-down view inside the cylinder head, where golden oil flows down onto the camshaft and runs between the cam lobes. Rigid metal, no morphing, no warping. Viscous glossy oil moving downward with gravity. Warm key light from the left, pure black background. No text, no logo, no bottle.
```

## V2 : E2 → E3 (recul vers la vue en coupe, 5 s)

Mêmes paramètres que V1, avec les images `E2-916` → `E3-916`.
```
One slow continuous camera move with no cuts: the camera pulls back and descends along the side of the engine while the view opens into a clean cutaway revealing the four pistons, connecting rods and the crankshaft, all coated in glossy golden oil that runs down the cylinder walls. Rigid metal, no morphing, no warping, no flicker. Warm key light from the left, pure black background. No text, no logo, no bottle.
```

### Négatif vidéo (commun)
```
cut, scene change, jump, morphing metal, warping, melting, flicker, camera shake, fast motion, oil flowing upward, splashes everywhere, text, logo, watermark, bottle, container, hands, person
```

### Contrôle (§6)
- ffprobe ;
- SSIM image de début ≥ 0,80 ;
- SSIM image de fin ≥ 0,75 ;
- SSIM image 1 / image du milieu ≤ 0,97, pour écarter une vidéo statique (déclencheur B8) ;
- planche de 8 images.

---

## Éléments faits en code (pas d'IA)

| Élément | Comment |
|---|---|
| Montée de l'huile (T1) | Bande de niveau P4 si elle existe ; sinon effet rayons X : masque doré qui monte dans la silhouette du bidon |
| Bouchon (T2) | P3 : petit saut vers le haut, puis sortie du cadre |
| Bascule du bidon | 115° autour de `bottlePivot`, mesuré en phase 4 |
| Filet d'huile | Canvas, du `spout` (après rotation) au `filler` ; dégradé or `#f0cc30` → `#cc9c0c`, reflet `#fff4c2` qui défile. Vertical sur mobile, en diagonale sur desktop. |
| Textes et CTA | HTML ; textes FR dans `hero.config.ts` ; numéro WhatsApp tiré de l'admin |

## Photos réelles à fournir (phase 4)

| ID | Prise de vue |
|---|---|
| P1 | STÄRK de face avec son bouchon ; fond noir, lampe chaude à gauche, téléphone sur trépied |
| P2 | **Même cadrage exactement**, sans le bouchon (le trépied ne bouge pas) |
| P3 | Le bouchon seul, même lumière |
| P4 | La bande de niveau à contre-jour, si le bidon en a une |
| Fin | MÖTPRO 4T de face, même lumière (écran de fin) |

---

## Fiche labo V1-M (à remplir par Ben)
```text
ÉLÉMENT : V1-M
OUTIL LABO : Kling app / Hailuo / Flow / Vidu
IMAGE DÉBUT : assets/ai/E1-916.png   IMAGE FIN : assets/ai/E2-916.png
PROMPT : voir « V1 » ci-dessus
RÉGLAGES : durée 5 s, ratio 9:16, mouvement de caméra lent
CE QUE JE DOIS REGARDER : le métal reste rigide ; l'huile coule vers le bas ; on entre bien par l'ouverture de remplissage ; pas de coupe
RÉSULTAT : OK / pas OK + remarques
```

---

## Version 3 : moteur en coupe, caméra fixe (prompts utilisés)

Principe : **une seule géométrie**. K1 est l'image fixe ; K2, K3, K4 en sont des éditions alignées (seule l'huile change) ; chaque plan vidéo va d'une image clé à la suivante, caméra fixe ; la composition recolle le métal de K1 et ne garde de la vidéo que l'huile. Fichiers : `assets/ai/v3/`.

| Fichier | Contenu |
|---|---|
| `prompt-coupe-2.txt` | K1 : 4 cylindres vu de côté, paroi coupée sur la longueur (arbre à cames, 4 pistons et bielles, vilebrequin), goulot ouvert en haut à gauche, fond noir, lampe chaude à gauche |
| `edit-K2b.txt` | K2 : film d'huile translucide sur l'arbre à cames seulement |
| `edit-K3b.txt` | K3 : cames + parois des cylindres, pistons et bielles |
| `edit-K4b.txt` | K4 : tout, jusqu'au vilebrequin et au carter |
| `clip-C1.txt`, `clip-C2.txt`, `clip-C3.txt` | Plans : « Static locked-off tripod shot… Only the oil moves; every metal part stays rigid… » |

Leçons : ne pas demander « display model » ni « diagram » (faux texte) ; Klein garde la géométrie, Qwen-Image-Edit (NF4) l'a perdue ; demander un film « thin, clear, translucent » sinon le métal devient doré.
