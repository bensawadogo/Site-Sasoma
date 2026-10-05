# Journal des crédits (§7 du brief)

Une ligne par génération, remplie **avant** l'appel (coût estimé) et **après** (coût réel, statut).

## Budget du hero

| Poste | Plafond | Consommé |
|---|---|---|
| Images E1 à E3 | 0 $ (HF), bascule Higgsfield ≤ 20 crédits | 0 $ (3 images HF gratuites) |
| Vidéos V1 et V2, 2 formats | ≤ 2 $ Replicate OU ≤ 120 crédits Higgsfield | 0 |
| Upscale | ≤ 0,50 $ | 0 |

## Générations

| date | élément | outil | modèle | paramètres | coût estimé | coût réel | FINAL/LABO/REJET | chemin |
|---|---|---|---|---|---|---|---|---|
| 2026-09-28 | E1-a | HF Space black-forest-labs/FLUX.1-schnell (API Gradio, anonyme, ZeroGPU) | FLUX.1-schnell (Apache-2.0) | prompt E1 du guide tel quel, 720×1280, 4 étapes, seed 1101 ; pas de champ négatif sur ce modèle | 0 $ | 0 $ | REJET : pseudo-texte gravé sur le cache | assets/ai/E1-a.webp (non commité) |
| 2026-09-28 | E1-b | HF Space black-forest-labs/FLUX.1-schnell (API Gradio, anonyme, ZeroGPU) | FLUX.1-schnell (Apache-2.0) | prompt E1 du guide tel quel, 720×1280, 4 étapes, seed 2202 ; pas de champ négatif sur ce modèle | 0 $ | 0 $ | REJET : pseudo-texte « PATELI » sur la poulie ; vue de dessus, pas de trois-quarts | assets/ai/E1-b.webp (non commité) |
| 2026-09-28 | E1-c | HF Space black-forest-labs/FLUX.1-schnell (API Gradio, anonyme, ZeroGPU) | FLUX.1-schnell (Apache-2.0) | prompt E1 du guide tel quel, 720×1280, 4 étapes, seed 3303 ; pas de champ négatif sur ce modèle | 0 $ | 0 $ | REJET : plaque « 234 » en bas à droite | assets/ai/E1-c.webp (non commité) |
| 2026-09-28 | E1-d | idem | idem | seed 4404 | 0 $ | 0 $ | BLOQUÉ : quota ZeroGPU anonyme épuisé | — |
| 2026-09-28 | E1-q1 | HF Space Qwen/Qwen-Image (API Gradio, anonyme) | Qwen-Image (Apache-2.0) | prompt E1 tel quel, 9:16, 50 étapes, prompt_enhance désactivé, seed 1101 | 0 $ | 0 $ | BLOQUÉ : quota ZeroGPU anonyme épuisé (MCP HF connecté, mais pas chargé dans la session en cours) | — |
| 2026-09-28 | E1-q2 | MCP hf-mcp-server (compte BenSawadogo), dynamic_space → mcp-tools/Qwen-Image | Qwen-Image (Apache-2.0) | prompt E1 tel quel + négatif du guide, 9:16, 50 étapes, seed 1101 | 0 $ | 0 $ | ÉCHEC : « ZeroGPU worker error: RuntimeError » (côté Space) | — |
| 2026-09-28 | E1-q3 | MCP hf-mcp-server (compte BenSawadogo), dynamic_space → mcp-tools/Qwen-Image | Qwen-Image (Apache-2.0) | prompt E1 tel quel + négatif du guide, 9:16, 16 étapes, seed 1101 | 0 $ | 0 $ | ÉCHEC : « ZeroGPU worker error: RuntimeError » (côté Space) | — |
| 2026-09-28 | E1-z1 | MCP hf-mcp-server (compte BenSawadogo), gr1_z_image_turbo_generate → mcp-tools/Z-Image-Turbo | Z-Image-Turbo (Apache-2.0) | prompt E1 tel quel (pas de champ négatif), 720×1280, seed 1101 | 0 $ | 0 $ | LABO : le plus propre ; minuscule emblème en relief sur le cache avant gauche | assets/ai/E1-z1.webp (non commité) |
| 2026-09-28 | E1-z2 | MCP hf-mcp-server (compte BenSawadogo), gr1_z_image_turbo_generate → mcp-tools/Z-Image-Turbo | Z-Image-Turbo (Apache-2.0) | prompt E1 tel quel (pas de champ négatif), 720×1280, seed 2202 | 0 $ | 0 $ | REJET : pseudo-texte gravé sur la culasse | assets/ai/E1-z2.webp (non commité) |
| 2026-09-28 | E1-z3 | MCP hf-mcp-server (compte BenSawadogo), gr1_z_image_turbo_generate → mcp-tools/Z-Image-Turbo | Z-Image-Turbo (Apache-2.0) | prompt E1 tel quel (pas de champ négatif), 720×1280, seed 3303 | 0 $ | 0 $ | REJET : plaque à pseudo-texte sur le cache | assets/ai/E1-z3.webp (non commité) |
| 2026-09-28 | E2-a | MCP hf-mcp-server (compte BenSawadogo), dynamic_space → mcp-tools/FLUX.1-Kontext-Dev | FLUX.1 Kontext [dev] (licence FLUX.1 [dev] Non-Commercial v1.1.1 : sorties utilisables commercialement, §2(d)) | prompt E2 tel quel, entrée E1, 768×1360, 20 étapes, guidance 2,5, seed 1101 | 0 $ | 0 $ | REJET : cache ouvert comme un couvercle de boîte, peu réaliste | assets/ai/E2-a.webp (non commité) |
| 2026-09-28 | E2-b | MCP hf-mcp-server (compte BenSawadogo), dynamic_space → mcp-tools/FLUX.1-Kontext-Dev | FLUX.1 Kontext [dev] (licence FLUX.1 [dev] Non-Commercial v1.1.1 : sorties utilisables commercialement, §2(d)) | prompt E2 tel quel, entrée E1, 768×1360, 20 étapes, guidance 2,5, seed 2202 | 0 $ | 0 $ | FINAL provisoire → E2.png : même bloc, ressorts et huile | assets/ai/E2.png (non commité) |
| 2026-09-28 | E3-a | MCP hf-mcp-server (compte BenSawadogo), dynamic_space → mcp-tools/FLUX.1-Kontext-Dev | FLUX.1 Kontext [dev] (licence FLUX.1 [dev] Non-Commercial v1.1.1 : sorties utilisables commercialement, §2(d)) | prompt E3 tel quel, entrée E1, 768×1360, 20 étapes, guidance 2,5, seed 1101 | 0 $ | 0 $ | REJET : moteur entièrement doré, pas une coupe | assets/ai/E3-a.webp (non commité) |
| 2026-09-28 | E3-b | MCP hf-mcp-server (compte BenSawadogo), dynamic_space → mcp-tools/FLUX.1-Kontext-Dev | FLUX.1 Kontext [dev] (licence FLUX.1 [dev] Non-Commercial v1.1.1 : sorties utilisables commercialement, §2(d)) | prompt E3 tel quel, entrée E1, 768×1360, 20 étapes, guidance 2,5, seed 2202 | 0 $ | 0 $ | REJET : autre moteur, doré | assets/ai/E3-b.webp (non commité) |
| 2026-09-28 | E3-c | MCP hf-mcp-server (compte BenSawadogo), dynamic_space → mcp-tools/FLUX.1-Kontext-Dev | FLUX.1 Kontext [dev] (licence FLUX.1 [dev] Non-Commercial v1.1.1 : sorties utilisables commercialement, §2(d)) | prompt E3 tel quel, entrée E1, 768×1360, 20 étapes, guidance 2,5, seed 3303 | 0 $ | 0 $ | FINAL provisoire → E3.png : bloc gris conservé, gouttes ; pas de vraie coupe (pistons non visibles) | assets/ai/E3.png (non commité) |
| 2026-09-28 | E3-d | MCP hf-mcp-server (compte BenSawadogo), dynamic_space → mcp-tools/FLUX.1-Kontext-Dev | FLUX.1 Kontext [dev] (licence FLUX.1 [dev] Non-Commercial v1.1.1 : sorties utilisables commercialement, §2(d)) | prompt E3 tel quel, entrée E1, 768×1360, 20 étapes, guidance 2,5, seed 4404 | 0 $ | 0 $ | BLOQUÉ : quota ZeroGPU du compte gratuit épuisé pour la journée | — |
| 2026-09-28 | E3-e | MCP hf-mcp-server (compte BenSawadogo), dynamic_space → mcp-tools/FLUX.1-Kontext-Dev | FLUX.1 Kontext [dev] (licence FLUX.1 [dev] Non-Commercial v1.1.1 : sorties utilisables commercialement, §2(d)) | prompt E3 tel quel, entrée E2-b, 768×1360, 20 étapes, guidance 2,5, seed 1101 | 0 $ | 0 $ | BLOQUÉ : quota ZeroGPU épuisé | — |
| 2026-09-28 | E1 | choix | — | E1-z1 → assets/ai/E1.png (720×1280) | — | — | FINAL (validé par Ben) | assets/ai/E1.png (non commité) |
| 2026-09-28 | V1-desktop-a | deAPI (compte de Ben, crédit offert) | LTX-2.5 22B Distilled | E1→E2 desktop 1344×768, 97 images 24 i/s, seed 1101, prompt V1 tel quel | 0,063 $ | 0,063 $ | REJET : moteur dédoublé pendant la transition | assets/ai/videos/V1-desktop-ltx25.mp4 (non commité) |
| 2026-09-28 | V1-desktop-b | deAPI (compte de Ben, crédit offert) | MiniMax H3 33B Turbo | idem, seed 1101 | 0,127 $ | 0,127 $ | REJET : très beau plongeon dans l’orifice, mais faux texte gravé sur le cache | assets/ai/videos/V1-desktop-h3.mp4 (non commité) |
| 2026-09-28 | V1-desktop-c | deAPI (compte de Ben, crédit offert) | MiniMax H3 33B Turbo | idem, seed 3303 | 0,127 $ | 0,127 $ | REJET : faux texte gravé, ne revient pas sur E2 | assets/ai/videos/V1-desktop-h3-3303.mp4 (non commité) |
| 2026-09-28 | V1-desktop-d | deAPI (compte de Ben, crédit offert) | MiniMax H3 33B Turbo | idem, seed 2202 | 0,127 $ | 0,127 $ | REJET : faux texte gravé | assets/ai/videos/V1-desktop-h3-2202.mp4 (non commité) |
| 2026-09-28 | V1-desktop-e | deAPI (compte de Ben, crédit offert) | LTX-2.5 22B Distilled | idem, seed 2202 | 0,063 $ | 0,063 $ | FINAL : le cache se soulève et révèle les cames huilées, aucun texte | assets/ai/videos/V1-desktop.mp4 (après agrandissement) (non commité) |
| 2026-09-28 | V2-desktop-a | deAPI (compte de Ben, crédit offert) | LTX-2.5 22B Distilled | E2→E3 desktop 1344×768, 97 images, seed 2202, prompt V2 tel quel | 0,063 $ | 0,063 $ | FINAL : rotation vers le moteur huilé | assets/ai/videos/V2-desktop.mp4 (après agrandissement) (non commité) |
| 2026-09-28 | V2-desktop-b | deAPI (compte de Ben, crédit offert) | LTX-2.5 22B Distilled | idem, seed 3303 | 0,063 $ | 0,063 $ | REJET : transition plus floue | assets/ai/videos/V2-desktop-ltx25-3303.mp4 (non commité) |
| 2026-09-28 | V1-mobile | deAPI (compte de Ben, crédit offert) | LTX-2.5 22B Distilled | E1→E2 mobile 768×1344, 97 images, seed 2202 | 0,063 $ | 0,063 $ | FINAL | assets/ai/videos/V1-mobile.mp4 (non commité) |
| 2026-09-28 | V2-mobile | deAPI (compte de Ben, crédit offert) | LTX-2.5 22B Distilled | E2→E3 mobile 768×1344, 97 images, seed 2202 | 0,063 $ | 0,063 $ | FINAL | assets/ai/videos/V2-mobile.mp4 (non commité) |
| 2026-09-28 | V1-desktop ×2 | deAPI (compte de Ben, crédit offert) | FlashVSR Tiny (agrandissement) | 1344×768 → 2688×1536 | 0,048 $ | 0,048 $ | FINAL | assets/ai/videos/V1-desktop.mp4 (non commité) |
| 2026-09-28 | V2-desktop ×2 | deAPI (compte de Ben, crédit offert) | FlashVSR Tiny (agrandissement) | 1344×768 → 2688×1536 | 0,048 $ | 0,048 $ | FINAL | assets/ai/videos/V2-desktop.mp4 (non commité) |
| 2026-09-28 | E1/E2/E3 → images clés | ops/scripts/images_cles.py | — | carré du moteur replacé en 1344×768 et 768×1344, bords fondus au noir | 0 $ | 0 $ | FINAL | assets/ai/cles/ (non commité) |

**Total deAPI du 2026-09-28 : environ 0,86 $ sur les 5 $ offerts.** Licences : LTX-2 (Lightricks, licence communautaire LTX-2 : usage commercial gratuit sous 10 M$ de chiffre d'affaires annuel) ; deAPI indique des modèles à licence commerciale.
| 2026-09-28 | moteur v2 ×4 | deAPI | Z-Image-Turbo | prompt corrigé : vrai bloc 4 cylindres, orifice de remplissage ouvert SUR le cache culbuteurs (Ben : bidon mal placé), 1536², seeds 1101-4404 | 4 × 0,021 $ | 4 × 0,021 $ | FINAL : seed 1101 (orifice en haut, aucun texte) ; 2202 bouchon fermé, 3303/4404 poulies en forme de roues | assets/ai/v2/moteur-1101.png (non commité) |
| 2026-09-28 | V1 desktop v2 | deAPI | LTX-2.5 | UNE image de départ (plus de fondu entre images : plus de déformation), 1344×768, 121 images, seed 1101, travelling avant vers l’orifice | 0,066 $ | 0,066 $ | FINAL | assets/ai/v2/test-ltx-desktop.mp4 (non commité) |
| 2026-09-28 | V2 desktop v2 ×3 | deAPI | LTX-2.5 | départ = dernière image de V1, l’huile coule dans l’orifice, seeds 1101/2202/3303 | 3 × 0,066 $ | 3 × 0,066 $ | FINAL : 3303 (l’huile entre dans le grand orifice) ; 1101 mauvais trou, 2202 correct mais moins net | assets/ai/v2/test-huile-3303.mp4 (non commité) |
| 2026-09-28 | V1/V2 mobile ×4 | deAPI | LTX-2.5 | 768×1344 | 4 × 0,066 $ | 4 × 0,066 $ | REJET : bandes noires dures dans l’image portrait ; le mobile utilise un carré découpé dans les vidéos desktop | assets/ai/v2/v*-mobile*.mp4 (non commité) |
| 2026-09-28 | agrandissement ×2 | deAPI | FlashVSR Tiny | V1 et V2 desktop → 2688×1536 | 2 × 0,060 $ | 2 × 0,060 $ | FINAL | assets/ai/videos/V1-desktop.mp4, V2-desktop.mp4 (non commité) |

**Version 2 (vrai moteur rigide) : environ 0,73 $. Solde deAPI : environ 3,4 $.** Higgsfield (10 crédits gratuits) non utilisé : voir TODO.

## Version 3 : moteur en coupe au centre, bidon à gauche (2026-09-28)

Demande de Ben : bidon à gauche qui se penche et verse sur le moteur au centre, voir l'intérieur du moteur, l'huile qui descend sur les pièces, étiquettes des pièces. Recherches (sous-agents) : pipeline retenu = image fixe + éditions alignées + plans caméra fixe + composition sur l'image fixe (métal rigide par construction).

| date | élément | outil | modèle | paramètres | coût estimé | coût réel | statut | chemin |
|---|---|---|---|---|---|---|---|---|
| 2026-09-28 | moteur en coupe ×4 | deAPI | Z-Image-Turbo (Apache-2.0) | prompt-coupe.txt, 1344×768, 8 étapes, seeds 1101-4404 | 4 × 0,0095 $ | 4 × 0,0095 $ | REJET : lampes du studio visibles, goulot en entonnoir, cylindres vus de face | assets/ai/v3/coupe-*.png (non commité) |
| 2026-09-28 | moteur en coupe ×6 | deAPI | Z-Image-Turbo | prompt-coupe-2.txt (coupe longitudinale, fond noir), seeds 1101-6606 | 6 × 0,0095 $ | 6 × 0,0095 $ | FINAL : seed 2202 → K1 (arbre à cames, 4 pistons et bielles, vilebrequin, goulot en haut à gauche, aucun texte) | assets/ai/v3/K1.png (non commité) |
| 2026-09-28 | K4 huilé ×2 | deAPI | FLUX.2 Klein 4B / Qwen-Image-Edit Plus | edit-K4.txt, entrée K1 | 0,0066 $ + 0,0264 $ | idem | REJET : Klein = métal peint en or ; Qwen = moteur noyé, géométrie perdue | assets/ai/v3/K4-*.png (non commité) |
| 2026-09-28 | K4 huilé ×3 | deAPI | FLUX.2 Klein 4B | edit-K4b.txt (film d'huile translucide), 1344×768, 4 étapes, seeds 1101/2202/3303 | 3 × 0,0066 $ | idem | FINAL : 3303 → K4 (géométrie alignée sur K1) | assets/ai/v3/K4.png (non commité) |
| 2026-09-28 | K2, K3 ×4 | deAPI | FLUX.2 Klein 4B | edit-K2b.txt (cames seules), edit-K3b.txt (cames + pistons), seeds 3303/1101 | 4 × 0,0066 $ | idem | FINAL : seed 3303 → K2, K3 (même rendu d'huile que K4) | assets/ai/v3/K2.png, K3.png (non commité) |
| 2026-09-28 | C1 | deAPI | LTX-2.5 22B | K1 → K2, caméra fixe (clip-C1.txt), 1344×768, 121 images, seed 1101 | 0,066 $ | 0,0655 $ | FINAL : l'huile entre par le goulot et nappe l'arbre à cames, moteur immobile ; le filet ajouté par l'IA au-dessus du moteur est retiré à la composition | assets/ai/v3/C1-1101.mp4 (non commité) |
| 2026-09-28 | C2, C3 | deAPI | LTX-2.5 22B | K2 → K3, K3 → K4 | 2 × 0,066 $ | 0 $ | BLOQUÉ : limite du compte Basic, 15 requêtes par jour (retour 04:51 le 29/09) ; HF ZeroGPU anonyme aussi épuisé | — |
| 2026-09-28 | C2, C3 (secours) | ops/scripts/composer_huile.py | — | l'huile de K3 puis de K4 descend en 120 images (front irrégulier, coulures) | 0 $ | 0 $ | PROVISOIRE : à remplacer par les vrais plans LTX-2.5 dès le retour du quota | assets/ai/videos/moteur-v3.mp4 (non commité) |
| 2026-09-28 | composition | ops/scripts/composer_huile.py | — | K1 + huile de chaque image (pixels devenus dorés), fond ramené au noir pur | 0 $ | 0 $ | FINAL | assets/ai/videos/moteur-v3.mp4, moteur-v3-1080p.mp4 (non commité) |

**Version 3 : 0,24 $ (solde deAPI 3,18 $).** Agrandissement FlashVSR non fait (même limite journalière) : le desktop est agrandi par lanczos + netteté (1344 → 1920). Higgsfield non utilisé : plan gratuit avec filigrane et sans usage commercial (règles 7 et 8 du brief).

## Moteurs à comparer (2026-09-29)

| date | élément | outil | modèle | paramètres | coût estimé | coût réel | statut | chemin |
|---|---|---|---|---|---|---|---|---|
| 2026-09-29 | moteurs candidats (HF) | MCP hf-mcp-server | Qwen-Image-2512, Z-Image, FLUX.2-klein-4B, SD 3.5 Large | prompt-P.txt | 0 $ | 0 $ | BLOQUÉ : Spaces non exposés au MCP (404) ; mcp-tools/Qwen-Image en erreur 500 | — |
| 2026-09-29 | moteur B, C | deAPI | Z-Image-Turbo | prompt-P.txt, 1344×768, 8 étapes, seeds 2202 / 5505 | 2 × 0,0095 $ | idem | LABO : vues 3/4, coupe partielle (pistons peu visibles) | assets/ai/v4/zturbo-*.png (non commité) |
| 2026-09-29 | moteur D, E | deAPI | FLUX.2 klein 4B | prompt-P.txt, 4 étapes, seeds 2202 / 5505 | 2 × 0,0036 $ | idem | REJET : pas de coupe (bloc fermé) | assets/ai/v4/klein-*.png (non commité) |
| 2026-09-29 | moteur F | deAPI | FLUX.1 schnell | prompt-P.txt, 4 étapes, seed 2202 | 0,0026 $ | idem | REJET : 3 cylindres, pièces incohérentes | assets/ai/v4/schnell-2202.png (non commité) |

Planche : assets/ai/v4/planche-moteurs.jpg. **Total : 0,029 $.**

## Version 4 : huile réaliste, carter, pistons en mouvement (2026-10-01)

| date | élément | outil | modèle | paramètres | coût estimé | coût réel | statut | chemin |
|---|---|---|---|---|---|---|---|---|
| 2026-10-01 | moteur v4 | ops/scripts/animer_moteur.py | — (calcul, aucune IA) | K1.png ; film d'huile, coulures, gouttes, nappe du carter, pistons/bielles en bielle-manivelle ; 361 images | 0 $ | 0 $ | FINAL (à valider par Ben) | assets/ai/videos/moteur-v3.mp4 (non commité ; l'ancienne : moteur-v3-avant-v4.mp4) |
| 2026-10-02 | plaque propre K1 (sans pistons ni bielles) | simple-lama-inpainting (local, CPU) | LaMa big-lama (Apache-2.0) | masque pistons + bielles + têtes de bielle, 1344×768 | 0 $ | 0 $ (80 s CPU) | FINAL : cylindres et carter vides, nets ; cloisons entre cylindres effacées (recouvertes par les pistons) | assets/ai/v5/K1-propre.png |
| 2026-10-02 | plaque propre : arbre à cames retiré | simple-lama-inpainting (local, CPU) | LaMa big-lama (Apache-2.0) | bande x 466-955, y 146-228 de K1-propre | 0 $ | 0 $ | LABO | assets/ai/v5/K1-propre-cames.png |
| 2026-10-02 | plaque propre : poulie avant retirée (recentrée sur l'axe du vilebrequin) | simple-lama-inpainting (local, CPU) | LaMa big-lama (Apache-2.0) | x 334-380, y 440-592 de K1-propre-cames | 0 $ | 0 $ | LABO | assets/ai/v5/K1-propre-poulie.png |
| 2026-10-02 | vilebrequin, arbre à cames, soupapes (3D) | Blender 5.2 (local, Cycles CPU) | — (modélisation par script, aucune IA) | ops/blender/vilebrequin.py, distribution.py ; 36 angles chacun | 0 $ | 0 $ | FINAL (à valider par Ben) | assets/ai/v5/vilebrequin, distribution → public/hero-video/pieces/atlas.webp |
| 2026-10-02 | plaque propre : flasque arrière retirée (recentrée sur l'axe du vilebrequin) | simple-lama-inpainting (local, CPU) | LaMa big-lama (Apache-2.0) | x 972-1016, y 458-602 de K1-propre-poulie | 0 $ | 0 $ | LABO | assets/ai/v5/K1-propre-volant.png |
| 2026-10-02 | huile v5 (temps réel + atlas huilé) | ops/scripts/huile_v5.py + moteur-vivant.ts (calcul, aucune IA) | — | film d'huile, coulures, perles, nappe, gouttes, front par pièce | 0 $ | 0 $ | FINAL (à valider par Ben) | public/hero-video/pieces/atlas-huile.webp |
| 2026-10-02 | garage plein écran (champ double, pénombre + éclairé) | Blender 5.2 (local, Cycles CPU) | — (scène par script, ressources CC0 Poly Haven) | ops/blender/decor.py CHAMP = 2, 48 échantillons, 75 % | 0 $ | 0 $ | FINAL (à valider par Ben) | assets/ai/decor/rendu/champ-*.png → public/hero-video/*/decor-*.webp |
| 2026-10-02 | masque du moteur pour le site | ops/scripts/masque_site.py (calcul, aucune IA) | — | détourage rembg sans le noir de la poulie et du volant effacés | 0 $ | 0 $ | FINAL | assets/ai/v5/masque-moteur-site.png → public/hero-video/*/masque.webp |

## Photos des produits sans photo fabricant (2026-10-04)

Gemini (clé « Gemini API Key 3 ») : quota image gratuit = 0 (HTTP 429, limit 0) sur gemini-2.5-flash-image, 3.1-flash-image, 3.1-flash-lite-image ; Gemini 2.5 Flash sert seulement au contrôle (lecture de l'étiquette, gratuit). Groq (clé « Console Grok Api Key ») : texte seulement, aucun modèle image.

| date | élément | outil | modèle | paramètres | coût estimé | coût réel | statut | chemin |
|---|---|---|---|---|---|---|---|---|
| 2026-10-04 | TURBINE (2 essais) | ops/scripts/photos_ia.py | deAPI QwenImageEdit_Plus_NF4 | entrée HYDKÖN 768 px, 30 étapes, seed 1101 | 2 × 0,0264 $ | 0,0528 $ | FINAL (2e essai) | ops/captures/photos-ia/turbine-oil.png |
| 2026-10-04 | HYDKÖN + capuchon | photos_ia.py | QwenImageEdit_Plus_NF4 | idem | 0,0264 $ | 0,0264 $ | FINAL | hydkon-hydraulic.png |
| 2026-10-04 | LUB-TEC, SCHNEIDÖL, Engine Flush | photos_ia.py | QwenImageEdit_Plus_NF4 | idem | 3 × 0,0264 $ | 0,0792 $ | REJET : nom écorché (« GRCB », « SCHIEIDÖL ») ou inchangé | — |
| 2026-10-04 | Carb & Choke Cleaner | photos_ia.py | QwenImageEdit_Plus_NF4 | entrée Oil Treatment | 0,0264 $ | 0,0264 $ | FINAL (petits rubans repris de l'Oil Treatment) | carburetor-choke-cleaner.png |
| 2026-10-04 | SCÖM (coupure réseau), TRANSFORMER (arrêté en cours) | photos_ia.py | QwenImageEdit_Plus_NF4 | idem | ≤ 2 × 0,0264 $ | inconnu | ABANDON | — |
| 2026-10-04 | 8 huiles industrielles | ops/scripts/etiquette_bidon.py | — (calcul, aucune IA) | bidon TURBINE validé, textes réécrits | 0 $ | 0 $ | FINAL | ops/captures/photos-ia/*.png |
| 2026-10-04 | Engine Flush | ops/scripts/etiquette_flacon.py | — (calcul, aucune IA) | flacon Fuel Injector Cleaner, titre + rubans réécrits | 0 $ | 0 $ | FINAL | engine-flush.png |

**Total : ≈ 0,18 à 0,24 $.** Toutes ces photos sont marquées « Photo non contractuelle » (correspondance `ia` dans photos-produits.json).
