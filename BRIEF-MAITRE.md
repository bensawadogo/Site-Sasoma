# BRIEF MAÎTRE — Hero Petrovöll (à copier dans Claude Code)

Enregistre ce fichier à la racine du projet sous le nom `BRIEF-MAITRE.md`, puis dis à Claude Code :
« Lis BRIEF-MAITRE.md en entier, résume-moi ta compréhension en 10 lignes, puis attends mon GO pour la phase 0. »

---

## 0. RÔLE ET MISSION

Tu es à la fois :
- directeur artistique ;
- ingénieur front-end spécialisé en performance mobile ;
- chef d'orchestre des outils d'IA générative, connectés par MCP.

Mission : construire le HERO du site du représentant Burkina de la marque de lubrifiants Petrovöll (Allemagne, depuis 1999).
Au scroll :
1. l'huile monte dans le bidon ;
2. le bidon se penche et verse l'huile sur un moteur ;
3. l'huile lubrifie une à une les pièces du moteur : arbre à cames, puis pistons, puis vilebrequin.

Tu choisis l'outil d'IA le plus adapté à chaque élément. Tu changes d'outil selon les règles de la section 5, et tu n'improvises jamais.

---

## 1. RÈGLES ABSOLUES (non négociables)

1. **Mobile d'abord.** 90 % des visiteurs sont sur mobile, dont beaucoup d'Android bas de gamme (2–3 Go de RAM, 3G/4G). Tout se conçoit, se génère, se valide et se mesure d'abord en 9:16 à 360×800. Le desktop vient après.
2. **Aucune génération sans mon GO explicite.** Chaque phase se termine par un STOP.
3. **Le bidon n'est jamais généré par IA.** Il vient uniquement de photos réelles (`assets/photos/`).
4. **Aucune image ou vidéo IA ne contient de texte, de logo ou de bidon.**
5. **Aucune donnée produit inventée.** Seules les fiches techniques de `assets/tds/` font foi.
6. **Preuve brute obligatoire.** Chaque affirmation s'appuie sur une sortie terminal, un fichier, une capture ou un chiffre mesuré. Jamais de « ✅ terminé » sans preuve.
7. **Pas de filigrane dans les assets finaux.** Tu ne retires jamais un filigrane ni un marquage de provenance IA. Un asset filigrané reste au labo.
8. **Droits commerciaux vérifiés.** Un asset final ne peut venir que d'une source qui autorise l'usage commercial : licence open source commerciale, ou plan payant qui l'autorise.
9. **Budget tracé.** Chaque génération est inscrite dans `ops/credits.md` avant et après.
10. **Aucune automatisation des sites web grand public** (Kling app, Hailuo web, Flow…). Ces outils sont utilisés MANUELLEMENT par moi. Toi, tu prépares les fiches et tu importes les résultats.

---

## 2. OUTILS DISPONIBLES

### 2.1 Connectés par MCP (tu les appelles toi-même)

| Serveur MCP | Rôle | Coût | Usage commercial |
|---|---|---|---|
| `playwright` | Recherche marque, téléchargement photos officielles, captures mobiles | Gratuit | — |
| `chrome-devtools` | Mesures de performance avec throttling | Gratuit | — |
| `hf-mcp-server` | Images via Spaces ZeroGPU : Qwen-Image, FLUX.1-schnell, Qwen-Image-Edit | Gratuit (quota) | Oui si Apache 2.0 — vérifie chaque Space |
| `replicate` | Vidéo first-last-frame (Wan 2.2 FLF, Wan 2.7, Vidu), upscale Real-ESRGAN | Paiement à l'usage | Selon la licence de chaque modèle |
| `higgsfield` | Agrégateur : Kling 3.0, Seedance 2.0, Veo 3.1, Wan, Hailuo, Nano Banana Pro, FLUX.2… Images de début et de fin, presets caméra | Crédits (plan payant requis ; plan gratuit = 1 génération, pas d'usage commercial) | Oui avec un plan payant |

Rappels Higgsfield :
- Via MCP, **toute génération coûte des crédits**. Le mode « Unlimited » ne fonctionne que sur le site web.
- Repères de coût (à revérifier dans l'outil avant usage) :
  - Kling 3.0 en 720p : environ 7 crédits / 5 s
  - Seedance 2.0 en 720p : environ 22 crédits / 5 s
  - Veo 3.1 en 720p : environ 29 crédits / 4 s
  - Nano Banana Pro : environ 2 crédits / image
- Forces selon Higgsfield :
  - Seedance → réalisme
  - Kling → mouvement et caméra
  - Veo → atmosphère et qualité premium
  - DoP → mouvements de caméra

### 2.2 Hors MCP (utilisés manuellement par moi)

| Outil | Usage | Statut des sorties |
|---|---|---|
| Kaggle / Colab + Wan 2.2 FLF | Rendu final gratuit | FINAL possible (Apache 2.0, pas de filigrane) |
| Kling app (crédits du jour) | Labo mouvement de caméra | LABO uniquement (filigrane / droits) |
| Hailuo web | Labo physique des liquides | LABO uniquement |
| Google Flow (Veo 3.1 Lite) | Labo qualité premium | LABO, sauf droits confirmés |
| Vidu web | Labo transition début → fin | LABO, sauf plan payant |
| Seedance (Dreamina/CapCut) | Labo ou final | FINAL seulement si 1080p sans filigrane ET droits commerciaux confirmés sur mon compte |

### 2.3 Outils locaux (CPU)
ffmpeg, cwebp, avifenc, exiftool, rembg, Node ≥ 20, Vite.

---

## 3. INVENTAIRE COMPLET DES ÉLÉMENTS

| ID | Élément | Type | Formats (ordre de priorité) | Contraintes |
|---|---|---|---|---|
| P1 | Bidon de face avec bouchon | Photo réelle | Détouré PNG → WebP/AVIF | Fond noir, projecteur chaud à gauche |
| P2 | Bidon sans bouchon, même cadrage que P1 | Photo réelle | idem | Aligné au pixel sur P1 |
| P3 | Bouchon seul | Photo réelle | idem | — |
| P4 | Bande de niveau (si elle existe) | Photo réelle | idem | Définit l'effet du temps 1 |
| LOGO | Logo officiel + palette | Téléchargé | SVG/PNG + `palette.json` | Autorisation du représentant |
| E1 | Moteur « sec », 3/4 dessus, bouchon de remplissage ouvert | Image IA | **9:16 (1080×1920)** puis 16:9 | Pas de texte ni de logo, projecteur chaud à gauche, fond noir |
| E2 | Même moteur, vue plongeante, arbre à cames nappé d'huile dorée | Image IA **éditée depuis E1** | 9:16 puis 16:9 | Même moteur, même lumière |
| E3 | Même moteur, vue en coupe, pistons et vilebrequin dorés | Image IA éditée depuis E1/E2 | 9:16 puis 16:9 | idem |
| V1-M / V1-D | E1 → E2, plongée lente, 5 s | Vidéo first-last-frame | **V1-M (9:16) d'abord**, puis V1-D (16:9) | Caméra continue, sans coupe |
| V2-M / V2-D | E2 → E3, recul lent vers la coupe, 5 s | Vidéo first-last-frame | V2-M d'abord | idem |
| SEQ | Séquences d'images | Dérivées de V1/V2 | lite : 0 / standard : 540×960, 48 images / full : 1080×1920, 96–120 images | Poids limités (section 8) |
| POSTERS | Images fixes de chaque temps | Dérivées de E1/E3 + bidon | AVIF + WebP | Palier lite < 500 Ko au total |
| FILET | Filet d'huile | **Code (canvas)** | — | De l'ancre `spout` à l'ancre `filler` |

---

## 4. ROUTAGE : QUEL OUTIL POUR QUEL ÉLÉMENT (dans l'ordre)

Tu essaies toujours le niveau 1. Tu passes au suivant seulement si une règle de bascule de la section 5 se déclenche.

### E1 — Image moteur de base
1. `hf-mcp-server` → Qwen-Image ou FLUX.1-schnell (gratuit, Apache 2.0) — 3 variantes 9:16
2. `higgsfield` → Nano Banana Pro (environ 2 crédits par image)
3. `higgsfield` → FLUX.2 Pro
4. `replicate` → Qwen-Image

### E2, E3 — Éditions cohérentes
1. `hf-mcp-server` → Qwen-Image-Edit (entrée = E1 retenue)
2. `higgsfield` → Nano Banana Pro en mode édition (très bonne cohérence)
3. `replicate` → Qwen-Image-Edit

### V1, V2 — Vidéos first-last-frame (mobile 9:16 d'abord)
0. **LABO (manuel, gratuit)** : Kling app ou Hailuo pour valider le prompt de mouvement. Je te donne ensuite le meilleur prompt.
1. **Kaggle Wan 2.2 FLF** (gratuit, manuel) : tu prépares le dossier `kaggle/`, je lance le rendu.
2. `replicate` → `lucataco/wan-2.2-first-last-frame` (quelques centimes)
3. `higgsfield` → Kling 3.0 avec images de début et de fin (environ 7 crédits / 5 s) : mouvement de caméra
4. `higgsfield` → Seedance 2.0 avec début et fin (environ 22 crédits / 5 s) : réalisme de l'huile et du métal
5. `higgsfield` → Veo 3.1 avec dernière image (environ 29 crédits / 4 s) : dernier recours premium

### Upscale (palier full uniquement, si la source fait moins de 1080p)
1. `replicate` → Real-ESRGAN
2. Upscale intégré à Higgsfield

---

## 5. RÈGLES DE BASCULE (quand changer d'outil)

Passe au niveau suivant du routage si UNE de ces conditions est vraie :

| Code | Déclencheur | Preuve à me montrer |
|---|---|---|
| B1 | Quota ou crédits épuisés, file d'attente > 15 min, Space en erreur ou « sleeping » après 2 essais | Message d'erreur brut |
| B2 | Le modèle n'a **pas de paramètre d'image de fin** dans son schéma (vidéo) | Extrait du schéma |
| B3 | Échec au contrôle qualité automatique (section 6) | Sortie brute ffprobe / ssim |
| B4 | Échec au contrôle visuel après **2 itérations de prompt** sur le même outil | Planche des images clés |
| B5 | Coût estimé > budget restant de la phase (section 7) | Calcul |
| B6 | Licence ou conditions qui n'autorisent pas l'usage commercial | Lien vers la licence |
| B7 | Filigrane détecté sur la sortie | Capture |
| B8 | Mouvement parasite : la vidéo semble statique, alors qu'un mouvement était demandé (SSIM image 1 / image du milieu > 0,97) | Valeurs SSIM |

Procédure de bascule :
1. Écris dans `ops/switch-log.md` : date, élément, outil quitté, code B1–B8, preuve, outil suivant.
2. Garde exactement le même prompt, la même image de début, la même image de fin et le même ratio.
3. Adapte uniquement la syntaxe des paramètres au nouvel outil. Liste les noms de paramètres utilisés.
4. Si le nouvel outil est payant ou consomme des crédits : **STOP, devis, attends mon GO.**
5. Si tous les niveaux échouent : STOP, avec un rapport des 3 meilleures tentatives côte à côte.

---

## 6. CONTRÔLE QUALITÉ (après chaque génération)

### 6.1 Automatique (sortie brute obligatoire)
```bash
# Dimensions, durée, fps
ffprobe -v error -show_entries stream=width,height,r_frame_rate:format=duration -of compact <fichier>

# Fidélité de l'image de début : image 1 de la vidéo vs image de départ (SSIM attendu ≥ 0,80)
ffmpeg -i <video> -i <image_debut> -lavfi "[0:v]select=eq(n\,0),scale=720:1280[a];[1:v]scale=720:1280[b];[a][b]ssim" -f null - 2>&1 | grep SSIM

# Fidélité de l'image de fin : dernière image vs image de fin (SSIM attendu ≥ 0,75)
ffmpeg -sseof -0.1 -i <video> -frames:v 1 last.png
ffmpeg -i last.png -i <image_fin> -lavfi "[0:v]scale=720:1280[a];[1:v]scale=720:1280[b];[a][b]ssim" -f null - 2>&1 | grep SSIM

# Planche de contrôle : 8 images clés
ffmpeg -i <video> -vf "fps=8/5,scale=270:-1,tile=4x2" -frames:v 1 planche.png
```

### 6.2 Visuel (checklist à remplir pour chaque asset)
- [ ] Même moteur dans E1, E2 et E3 (formes, couleurs, nombre de cylindres)
- [ ] Lumière chaude venant de la gauche, fond noir
- [ ] Aucun texte, logo, bidon ni filigrane
- [ ] Bouchon de remplissage à la position de l'ancre `filler` (±3 % de l'image)
- [ ] Mouvement lent et continu, pas de saut, pas de déformation du métal
- [ ] Huile dorée brillante, qui coule vers le bas (physique crédible)
- [ ] **Mobile** : zone du haut (0–12 %) libre pour le header, zone du bas (70–100 %) assez sombre pour les textes

---

## 7. BUDGET ET JOURNAL DES CRÉDITS

Fichier `ops/credits.md`, une ligne par génération :
`date | élément | outil | modèle | paramètres | coût estimé | coût réel | FINAL/LABO/REJET | chemin`

Budget par défaut du hero (modifiable par moi) :

| Poste | Plafond |
|---|---|
| Images E1–E3 | 0 $ (HF) ; bascule Higgsfield ≤ 20 crédits |
| Vidéos V1/V2 × 2 formats | ≤ 2 $ Replicate OU ≤ 120 crédits Higgsfield |
| Upscale | ≤ 0,50 $ |

Avant chaque appel payant : affiche le coût estimé et le budget restant, puis STOP.

---

## 8. SPÉCIFICATIONS DU SITE (mobile d'abord)

### Scène
- Hero en `position: sticky`, hauteur **250 svh sur mobile**, 300 svh sur desktop.
- Timeline, en progression 0 → 1 :

| Plage | Temps | Ce qui se passe |
|---|---|---|
| 0,00–0,08 | Ouverture | — |
| 0,08–0,35 | T1 | L'huile monte (bande de niveau ou effet rayon X) |
| 0,35–0,55 | T2 | Le bouchon saute, le bidon pivote de 115°, le filet coule |
| 0,55–0,92 | T3 | Séquence V1 + V2 : arbre à cames → pistons → vilebrequin |
| 0,92–1,00 | Fin | Produit + CTA |

- Mobile : bidon en haut, versement **vertical**, textes en bas.
  Desktop : bidon à gauche, versement en diagonale.
- Au scroll inverse, tout se rembobine proprement.

### Code
- Vite + JavaScript vanilla. JS < 30 Ko gzip, CSS < 15 Ko gzip, une seule police variable auto-hébergée.
- Un seul listener de scroll passif, rendu dans requestAnimationFrame.
  Les animations ne touchent que opacity et transform.
- Séquence sur canvas :
  - seules ±12 images sont décodées (createImageBitmap), les autres sont libérées avec close() ;
  - chargement de 1 image sur 4 d'abord, puis on remplit les trous ;
  - on ne charge que lorsque le hero approche.
- DPR plafonné : 1 (lite), 1,5 (standard), 2 (full).
- Filet d'huile sur canvas : de l'ancre `spout` à l'ancre `filler`, dégradé or, reflet qui défile.
- Textes en vrai HTML. Configuration unique dans `src/hero.config.js` (ancres mobile/desktop, temps, textes FR, CTA WhatsApp).

### Paliers
| Palier | Condition | Contenu |
|---|---|---|
| lite | saveData, 2g/3g, deviceMemory ≤ 2, reduced-motion | Posters + CSS/SVG, aucune séquence, < 500 Ko |
| standard | cas par défaut sur mobile | 540×960, 48 images WebP q55 |
| full | deviceMemory ≥ 6, 4g/wifi | 1080×1920 mobile / 1920×1080 desktop, 96–120 images, AVIF |

- Garde-fou : si le temps moyen par image dépasse 24 ms pendant 2 s, descendre d'un palier.
- Forçage possible via `?tier=`.

### Budgets de performance (mesurés, sortie brute)
- **lite** (CPU 6x + Slow 4G, 360×800) : transfert initial < 400 Ko, LCP < 2,5 s, CLS < 0,05
- **standard** (CPU 4x + Fast 4G) : ≥ 30 fps au scroll, heap < 150 Mo
- **full** (desktop) : 60 fps

---

## 9. PHASES (STOP à la fin de chacune)

| Phase | Contenu | Livrable / preuve |
|---|---|---|
| 0 | Vérifier MCP + outils locaux | `claude mcp list` + versions (sortie brute) + liste des outils exposés par chaque serveur |
| 1 | Recherche marque via Playwright : catalogue, logo, palette, photos officielles | `research/catalogue.json`, `research/palette.json`, `research/photos/index.json` + tableau « utilisable hero / référence » |
| 2 | Script en données : `hero.config.js` + `scenario/shots.md` (prompts EN, négatifs, ratios, ancres) | Fichiers + résumé. **Aucune génération.** |
| 3 | Prototype avec des placeholders (SVG pour le bidon, dégradés ffmpeg pour les séquences) | Captures Playwright **360×800 d'abord**, puis 390×844 et 1440×900, aux progressions 0 / 0,2 / 0,45 / 0,7 / 1 + poids réseau par palier |
| 4 | Photos P1–P4 : détourage rembg, alignement, export | Avant/après + ancres `spout` et `bottlePivot` mesurées |
| 5 | E1 (9:16) → mon choix → E1 (16:9) → E2 → E3, selon le routage §4 | Planche + checklist §6.2 + `ops/credits.md` |
| 6 | Labo (manuel) → V1-M, V2-M → contrôle §6 → V1-D, V2-D | Sorties SSIM/ffprobe + planches + `switch-log.md` si bascule |
| 7 | `build-frames.sh` : paliers + manifest + posters + métadonnées exiftool (Title, Artist = mon studio, Copyright = client) | Poids par palier (sortie brute) |
| 8 | Intégration des vrais assets + audit Chrome DevTools + Lighthouse mobile (JSON) | LCP / CLS / TBT / poids avant → après |
| 9 | README : comment refaire un hero pour un autre produit | Fichier |

Commit Git à la fin de chaque phase.

---

## 10. FICHE LABO (modèle à me remplir pour chaque test manuel)

```text
ÉLÉMENT : V1-M
OUTIL LABO : Kling app / Hailuo / Flow / Vidu
IMAGE DÉBUT : assets/ai/E1-916.png   IMAGE FIN : assets/ai/E2-916.png
PROMPT : <copié depuis shots.md#V1>
RÉGLAGES : durée 5 s, ratio 9:16, mouvement de caméra lent
CE QUE JE DOIS REGARDER : continuité du métal, écoulement de l'huile vers le bas, pas de coupe
RÉSULTAT (à remplir par Ben) : OK / pas OK + remarques
```

Quand je te renvoie la fiche, tu mets à jour `shots.md` avec le prompt gagnant avant le rendu final.
