# PROJECT_STATUS — hero Petrovöll (plan d'implémentation du 28/09/2026)

Source de vérité : la maquette client `petrovoll_hero_storyboard_scroll.html` (phases au scroll) et les décisions de Ben du 28/09 : **bidon = vraie photo animée en code**, **bidon à droite**, moteur au centre, IA vidéo **uniquement pour le moteur en coupe et l'huile**. Les vidéos du dossier client (`petrovoll-hero-reveal.mp4` : présentation de la gamme ; `creation de video.mp4` : tutoriel sans rapport) ne montrent pas le versement : le découpage vient de la maquette.

- Tableau des scènes : [01_analysis/scenes.json](01_analysis/scenes.json)
- Composition Lock : [01_analysis/composition_locks.json](01_analysis/composition_locks.json)
- Contrôle qualité automatique : `python ops/scripts/controle_plan.py PLAN.mp4 DEBUT.png FIN.png`

## Scènes

| Scène | Scroll | Fait par | État |
|---|---|---|---|
| S01 ouverture | 0 → 8 % | code + K1 | ✅ |
| S02 l'huile monte | 8 → 35 % | code | ✅ |
| S03 versement | 35 → 55 % | code (vraie photo, bidon à droite, filet en chute libre) + K1 | ✅ |
| S04a arbre à cames | 55 → 67,6 % | IA K1 → K2 (LTX-2.5, deAPI) + composition | ✅ provisoire, à refaire sur Vidu |
| S04b pistons | 67,6 → 79,8 % | coulée d'images clés K2 → K3 (secours, limite deAPI) | ⏳ à générer sur Vidu |
| S04c vilebrequin | 79,8 → 92 % | coulée d'images clés K3 → K4 (secours) | ⏳ à générer sur Vidu |
| S05 produits + bouton | 92 → 100 % | code (HTML) | ✅ |

## Contrôles (sortie brute)

| Plan | SSIM début | SSIM fin | Métal (composition) | Huile (mouvement) | Verdict |
|---|---|---|---|---|---|
| C1 brut (LTX-2.5) | 0,980 | 0,970 | écart 20,6/255 → 0/100 | 100/100 | REJET brut (le métal dérive de ton) |
| Séquence composée (C1 + secours) | 0,904 | 0,899 | écart 1,2/255 → 94/100 | 100/100 | ACCEPTÉ |
| V1 de la version 2 (référence) | 0,981 | 0,576 | écart 83,3/255 → 0/100 | 100/100 | REJET (caméra qui bouge) |

La composition sur K1 est ce qui rend un plan IA acceptable : elle reste obligatoire pour les plans Vidu.

## Prochaines étapes (phases du plan)

- **A** : MCP Vidu (`uvx vidu-mcp`, variables `VIDU_API_KEY` et `VIDU_API_HOST`) dès que la clé est dans `.env`. Crédits Vidu payants : devis avant chaque appel.
- **B–F** : S04a seule sur Vidu, en basse résolution, image de début K1 et de fin K2, caméra fixe ; contrôle ; régénération de S04a seule si rejet (S04a_v01, v02…).
- **G** : S04b et S04c, puis 1080p, composition, `npm run hero:video`.

Pas de S03 sur Vidu : le versement est fait avec la vraie photo (décision de Ben), aucune IA n'y touche.

## Fichiers

- Images clés et plans : `assets/ai/v3/` (non commités) ; vidéo composée : `assets/ai/videos/moteur-v3.mp4`
- Prompts : `assets/ai/v3/*.txt`, résumé dans `scenario/shots.md`
- Coûts : `ops/credits.md` (version 3 : 0,24 $)
