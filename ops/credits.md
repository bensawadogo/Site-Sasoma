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
