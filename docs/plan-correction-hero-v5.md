# Plan de correction du hero (v5), 01/10/2026

Analyse : rendu vérifié au navigateur MCP, puis relu par deux sous-agents (mécanique, fluides).
Planches : `ops/captures/analyse-v4/`.

## Diagnostic

**Mécanique : le moteur 2D ne peut pas paraître vrai.**
- La course des pistons est de 20 px (environ 100 px dans un vrai moteur) : on voit une vibration, pas un cycle.
- Le vilebrequin, les contrepoids, l'arbre à cames et les soupapes sont immobiles. Seules les têtes de bielle glissent.
- Les bielles sont presque verticales (2° d'obliquité au lieu d'environ 17°).
- Découpes rectangulaires et fond reconstruit flou (taches derrière les pièces).
- Ces pièces sont cachées dans la photo : impossible de les faire tourner à partir d'une image fixe.

**Huile : on lit un voile rayé, pas un liquide.**
- Les coulures sont un rideau vertical uniforme qui ignore les pièces : elles passent sur les vides et les arêtes.
- L'huile ne s'accumule pas aux rebords, il n'y a pas de vraies gouttes (réfraction).
- Les fronts sont rectangulaires, et la vitesse est la même partout.
- **Le trajet est faux.** L'huile versée descend par gravité jusqu'au carter, avec le moteur à l'arrêt (c'est une vidange). Elle ne remonte vers les paliers puis les cames que lorsque le moteur tourne, sous la pression de la pompe.
- Le moteur ne doit donc démarrer qu'après le remplissage du carter. Dans la v4, l'huile nappe les cylindres avant le démarrage.

**Mise en page : moteur rogné sur les écrans presque carrés.**
- Fenêtre de 600 à 900 px de large, peu haute (tablette, téléphone en paysage) : les cames et le carter sont coupés.
- Les étiquettes flottent alors dans le noir.

## Options

| | A. Vraie 3D dans Blender (recommandé) | B. 2D corrigée (sans outil externe) |
|---|---|---|
| Moteur | Il tourne vraiment : vilebrequin, bielles, pistons, cames à demi-vitesse, soupapes | Il reste à l'arrêt, ce qui est cohérent avec une vidange |
| Huile | Fluide simulé (Mantaflow), matière ambre transparente | Écoulement guidé par la forme des pièces, gouttes aux arêtes, carter qui se remplit en premier |
| Réalisme | Niveau publicité | Acceptable de loin |
| Coût | 0 $ (Blender gratuit, modèle CC0 ou CC-BY) | 0 $ |
| Délai | Plusieurs sessions, et les rendus prennent des heures | Une session |
| Prérequis de Ben | Installer Blender et Blender MCP, télécharger un modèle | Aucun |

## Plan A (étapes, chacune avec un GO)

1. **Ben** : installer Blender 4.x (https://www.blender.org/download/) et Blender MCP (https://github.com/ahujasid/blender-mcp). Puis lancer `claude mcp add blender uvx blender-mcp`.
2. **Ben** : télécharger un moteur 4 cylindres en ligne avec une licence d'usage commercial, CC0 ou CC-BY (CC-BY : crédit à ajouter aux mentions légales). Recherche Sketchfab : https://sketchfab.com/search?q=inline+4+engine&type=models&features=downloadable, filtre de licence « CC0 » ou « CC Attribution ».
3. **Claude** (par Blender MCP) :
   - coupe longitudinale ;
   - matériaux et lumière calés sur K1 ;
   - cinématique bielle-manivelle réelle : course pleine, ordre 1-3-4-2, cames à demi-vitesse.
4. **Claude** : huile en Mantaflow avec un trajet réel :
   - versement → retour par la culasse → carter qui se remplit, moteur à l'arrêt ;
   - démarrage → pression → paliers du vilebrequin → bielles → cames → projections sur les cylindres.
5. **Décision de Ben** : l'ordre des étiquettes devient vilebrequin → pistons → cames (`HERO.textes.t3`).
6. Rendu : 361 images, environ 1344×768. Puis découpage avec `npm run hero:video` (pipeline inchangé), et mesures (`ops/perf/outil/`).

## Dans tous les cas (sans attendre)

- Corriger le cadrage des écrans presque carrés : le moteur entier doit rester visible, quitte à le réduire.
- Garder les gains de performance de la v4 : décodage hors du fil principal, paliers, 3D du bidon sur demande.

## Avancement (02/10)

- Moteur du site (K1) gardé. Pistons, bielles, cames, soupapes et vilebrequin retirés de la photo (LaMa, local).
- Le navigateur dessine en temps réel les pièces mobiles (`src/scripts/hero-video/moteur-vivant.ts`, atlas `public/hero-video/pieces/` produit par `ops/scripts/pieces_mobiles.py`) :
  - vilebrequin et arbre à cames en 3D (Blender) ;
  - pistons et bielles (bielle-manivelle, ordre 1-3-4-2) ;
  - soupapes et ressorts comprimés par la levée des cames ;
  - chaîne de distribution dans une fenêtre, poulie qui tourne ;
  - démarreur puis ralenti à 7 tr/s, avec flou de mouvement.
- Ajouté ensuite : chaîne d'axe à axe derrière le carter de distribution (brin de retour, patin), volant moteur, lueur de combustion bornée à la chambre.
- Note du sous-agent mécanicien : 3, puis 6, 7,5, 8, 8,5, 9, 9,5 et **10/10**.
- Étiquettes dans l'ordre du vrai circuit : vilebrequin → pistons → arbre à cames.

## Huile (02/10)

- Circuit réel :
  - versement, moteur arrêté : le filet entre par le goulot, une chute dans la culasse, puis l'huile redescend derrière la chaîne jusqu'au carter ;
  - la nappe se remplit, avec une surface ondulée, un reflet des pièces et un ménisque ;
  - démarrage, puis pompe : les paliers et les têtes de bielle sont huilés, le vilebrequin projette des gouttes qui retombent en rides dans la nappe ;
  - ensuite les cylindres et les pistons : film inégal, coulures, gouttes pendantes qui grossissent puis tombent ;
  - enfin les cames et les ressorts, avec des reflets nets.
- Pièces huilées : atlas `public/hero-video/pieces/atlas-huile.webp` (`ops/scripts/huile_v5.py`). L'huile se révèle sur chaque pièce par un front qui monte depuis le bas, avec un décalage propre à chaque pièce.
- Parois fixes : huilées dans la séquence d'images (`moteur_v5.py --fond`, `huile_v5.tau_fond`).
- Note du sous-agent spécialiste des fluides : 5,5, puis 6,5, 7,5, 8 et **8,5/10**. Selon lui, c'est le plafond du 2D en temps réel.
- Pour viser 9,5 à 10 : rendre le versement et la nappe en vrai fluide (Blender Mantaflow, gratuit), puis les poser en séquences avec transparence sur la photo.
