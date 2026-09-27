# Petrovöll Burkina — Plan de préparation (v2)

Statut : **phase recherche**. Aucune génération d'image ou de vidéo tant que ce plan n'est pas validé.
Contrainte : **pas de carte graphique** → le calcul lourd (images, vidéos IA) se fait dans le cloud ; tout le reste tourne sur le PC (CPU).

> **Changements par rapport à la v1**
> - Le site existe déjà en **Astro** (admin client, catalogue, optimisation mobile) : on ne repart pas sur Vite.
> - Séquence 360° ramenée à **24 images** et pilotée **au doigt** (le scroll saccade sur les téléphones d'entrée de gamme).
> - Outils installés **directement sous Windows** (winget) : WSL2 n'est pas nécessaire.
> - `cwebp` / `avifenc` retirés : **sharp**, déjà présent dans le projet, fait la conversion WebP/AVIF.
> - Nom de marque avec tréma partout : **Petrovöll** (le site affiche encore « PETROVOLL »).

---

## 0. État actuel du projet (déjà fait)

| Élément | État |
|---|---|
| Site Astro 5 + Tailwind v4, hébergement prévu Cloudflare Pages | ✅ construit |
| Admin client `/keystatic` (téléphone, en français) : produits, prix FCFA, photos, pages, coordonnées, WhatsApp | ✅ testé en local — mise en ligne via Keystatic Cloud à faire |
| Bidon 3D (scan Meshy) avec 3 niveaux : image seule / 3D lite (smartphone) / 3D complète (ordinateur) | ✅ en place — **à remplacer par la séquence photo 360°** (§2) |
| Formulaire de contact (Web3Forms) + boutons WhatsApp / Appeler | ✅ codé — clé Web3Forms à créer |

### ❓ Question bloquante : l'activité réelle du client
Le site décrit aujourd'hui une entreprise **multi-secteurs** (lubrifiants, transport, import-export, pneus, fournitures de bureau). Ce plan décrit un **distributeur de lubrifiants Petrovöll uniquement**.
- Si **distributeur seul** → les « secteurs » de l'admin deviennent des **catégories de produits** (moteur essence, diesel, moto, graisses…) ; transport, pneus et fournitures sont retirés.
- Si **multi-secteurs** → la structure actuelle reste.

→ **En attente** : infos de la société + logo (Ben).

---

## 1. Ce qu'on sait de la marque (sources publiques, À VÉRIFIER)

Ces informations viennent du site officiel et de ses métadonnées. Elles n'ont pas encore été vérifiées. **Rien ne sera publié sans validation du représentant.**

| Élément | Info trouvée |
|---|---|
| Nom officiel | Petrovöll GmbH |
| Création | 1999, Bochum (Allemagne) |
| Groupe | Filiale du groupe Haliburg |
| Adresse affichée | Schnabelstraße 1, 45134 Essen, Allemagne — info@petrovoll.com |
| Certifications annoncées | ISO 9001:2015, ISO 14001:2015, ISO 18001:2007 |
| Marchés export | Moyen-Orient, Afrique, Amérique du Sud, Asie-Pacifique, CEI |
| Positionnement | Lubrifiants haute performance : automobile, industriel, marine |
| Réseaux | Instagram @petrovoll, Facebook PetrovollGmbH, LinkedIn, X @petrovoll |

### Les 11 catégories du catalogue officiel
1. Huiles moteur essence
2. Huiles moteur diesel
3. Huiles moto (2T / 4T)
4. Huiles marines
5. Huiles industrielles (hydraulique, turbine, circulation, transfert thermique, transformateur, réfrigération, coupe…)
6. Fluides de transmission automatique (ATF)
7. Huiles de boîte manuelle / engrenages
8. Liquides de frein (DOT 3, DOT 4, DOT 5.1)
9. Liquides de refroidissement & antigel
10. Graisses (EP0 à EP3, lithium complexe, calcium…)
11. Additifs & entretien auto

**Gammes repérées (à confirmer)** : STÄRK · VÖLEX · VÖNO · VIRÖ-TEC · D-TEC · CNG-TEC · MÖTPRO · MARINEÖL · HYDKÖN · LUB-TEC GRÖB · SCÖM · SCHNEIDÖL · TRANS-TEC · DEXÖ ATF · MAX-GRÖB · KÜHLER · GLÄT

**Pages produits du site officiel** : elles sont générées en JavaScript. La liste complète (viscosités, normes API/ACEA, conditionnements) s'extrait avec **Playwright** (§4). Le fichier `catalogue.json` obtenu est **à usage interne uniquement** : les photos et les textes officiels ne sont publiés qu'avec l'autorisation écrite de la marque.

### Checklist à envoyer au représentant Burkina
- [ ] **Autorisation écrite** d'utiliser le logo et la marque Petrovöll (+ charte graphique si elle existe)
- [ ] Activité exacte de la société locale : Petrovöll seul ou multi-secteurs ?
- [ ] Nom exact de la société locale, RCCM, IFU, adresse, téléphone, WhatsApp, horaires
- [ ] Logo de la société locale (fichier original : SVG, PDF ou PNG haute définition)
- [ ] Liste des produits **réellement vendus au Burkina** (souvent 10 à 20 références)
- [ ] Fiches techniques (TDS) en PDF de chaque produit : **aucune caractéristique ne sera inventée**
- [ ] Prix publics en FCFA, ou « sur demande »
- [ ] Points de vente et revendeurs (pour une carte)
- [ ] 1 bidon physique de chaque produit phare pour la séance photo (§2)
- [ ] Clientèle prioritaire : motos (très important au Burkina), taxis et véhicules légers, poids lourds, mines et industrie ?
- [ ] Qui modifiera le site au quotidien (nom + e-mail, pour l'invitation à l'admin) ?

---

## 2. Règle n°1 : le bidon n'est JAMAIS généré par l'IA

Les modèles IA déforment les étiquettes, les logos et le texte : lettres inventées, tréma perdu. Le bidon 3D actuel en est la preuve. C'est un scan IA (Meshy), avec **l'étiquette recopiée en miroir au dos** et des **taches rouges** sur le plastique.

### Stratégie

| Élément du site | Méthode | Coût |
|---|---|---|
| Rotation 360° du bidon | **Vraies photos** au téléphone sur plateau tournant | 0 FCFA |
| Détourage | rembg en local (CPU) | 0 |
| Décors (moteur en coupe, piston, huile dorée en macro, route du Sahel, moto, camion, usine) | Vidéo ou image IA **sans aucun produit ni texte** | Gratuit, puis payant |
| Scène « bidon dans le décor » | Composition dans le code : décor IA + vrai bidon détouré par-dessus | 0 |

### Séquence 360° adaptée au mobile 3G

| Niveau (déjà détecté par le site) | Ce qui est chargé | Poids estimé |
|---|---|---|
| Image seule (économie de données, 2G, ≤ 1 Go de RAM) | 1 photo, avec le bouton « Voir en 360° » | ~30 Ko |
| Smartphone | 24 images de 480 px en WebP | ~360 Ko |
| Ordinateur | 36 images de 800 px en WebP/AVIF | ~1,2 Mo |

- Rotation **au doigt** (glisser horizontal) et lente rotation automatique. Pas de rotation liée au défilement.
- Chargement progressif, **du plus grossier au plus fin** : images 0°, 180°, 90°, 270°, puis les intermédiaires. La rotation fonctionne donc avant la fin du téléchargement.
- Une fois ces photos en place, **three.js et les modèles 3D sont supprimés** : environ 450 Ko de moins sur mobile.

### Guide de prise de vue (téléphone)
1. Plateau tournant (manuel ou à piles, ~5 000 FCFA) avec un repère tous les **15°** (24 photos) ou **10°** (36 photos).
2. Téléphone sur **trépied**, à hauteur de l'étiquette, sans le toucher entre les photos (retardateur ou télécommande Bluetooth).
3. **Fond uni** clair, lumière douce et diffuse : près d'une fenêtre sans soleil direct, ou 2 lampes avec un drap blanc devant.
4. **Exposition, mise au point et balance des blancs verrouillées.** Appui long sur l'écran (AE/AF lock), ou mode Pro.
5. Bidon **propre**, sans poussière ni trace de doigt, étiquette bien droite, bouchon identique sur toutes les vues.
6. Photos en pleine résolution, sans filtre ni mode portrait.

---

## 3. Architecture (sans carte graphique)

```
Claude Code (PC Windows, CPU)
 ├─ Playwright MCP ........ extraction catalogue, tests mobiles     (déjà installé)
 ├─ Chrome DevTools MCP ... tests perf (CPU ×6, Slow 4G)
 ├─ Hugging Face MCP ...... GRATUIT : images (FLUX…) via Spaces ZeroGPU
 ├─ Replicate MCP ......... PAYANT à l'usage : vidéo, upscale
 └─ Outils locaux ......... ffmpeg, rembg, exiftool, sharp (déjà dans le projet)

Hors MCP (gratuit, manuel) : notebooks Kaggle / Colab → vidéos Wan 2.2 first-last-frame
Site : Astro (existant) → Cloudflare Pages
```

---

## 4. Connexions MCP (dans cet ordre)

⚠️ **Jetons** : tape toi-même les commandes qui contiennent un jeton, dans ton terminal. Ne les colle jamais dans une conversation avec l'IA. Ils sont enregistrés en clair dans `~/.claude.json` : crée-les avec les **droits minimum**, et fixe une **limite de dépense** sur les services payants.

### 4.1 Playwright — déjà installé
Il est en attente d'approbation : lance `claude` et accepte-le au démarrage.

### 4.2 Chrome DevTools — performance (gratuit)
```bash
claude mcp add --scope user chrome-devtools -- npx -y chrome-devtools-mcp@latest
```

### 4.3 Hugging Face — images gratuites
Jeton en **lecture seule** : huggingface.co/settings/tokens
```bash
claude mcp add --scope user --transport http hf-mcp-server https://huggingface.co/mcp --header "Authorization: Bearer TON_HF_TOKEN"
```
Limite : quota ZeroGPU gratuit. Si ça bloque, attendre ou dupliquer le Space.

### 4.4 Replicate — vidéo payante à l'usage (quand le client paie)
Version distante recommandée : ajouter l'URL indiquée sur mcp.replicate.com, puis `/mcp` pour s'authentifier. **Fixer une limite de dépense** sur le compte avant.

### 4.5 Options (plus tard, seulement si nécessaire)
- **fal** (serveur communautaire qui manipule ta clé API) : **lire le code source avant**, avec une limite de dépense.
- **Higgsfield** : `claude mcp add --transport http --scope user higgsfield https://mcp.higgsfield.ai/mcp`
- **Skill scroll-cinematic-claude** (projet tiers) : lire comme référence, **ne pas l'installer sans relecture**.

### Vérification
```bash
claude mcp list
```
Puis dans Claude Code : `/mcp` → tous les serveurs doivent être « connected ».

---

## 5. Dépendances locales (Windows, CPU)

| Outil | Rôle | Installation |
|---|---|---|
| Node.js ≥ 20 | Claude Code, MCP, site | ✅ déjà installé (v24) |
| sharp | Redimensionnement + WebP/AVIF | ✅ déjà dans le projet |
| ffmpeg | Vidéo → images, encodage, métadonnées | `winget install Gyan.FFmpeg` |
| exiftool | Lire/écrire les métadonnées | `winget install OliverBetz.ExifTool` |
| Python 3.12 | Pour rembg (le Python 3.14 installé n'est peut-être pas encore supporté par onnxruntime) | `winget install Python.Python.3.12` |
| rembg | Détourage des bidons (CPU) | `py -3.12 -m venv .venv-rembg` puis `.venv-rembg\Scripts\pip install "rembg[cpu,cli]"` |

---

## 6. Ressources externes (références, à relire avant usage)

| Projet | Usage | Lien |
|---|---|---|
| hf-mcp-server | MCP officiel Hugging Face | github.com/huggingface/hf-mcp-server |
| mcp-hfspace | Appeler un Space précis | github.com/evalstate/mcp-hfspace |
| Replicate MCP | MCP officiel Replicate | mcp.replicate.com |
| Wan2GP-on-Colab | Wan 2.2 sur Colab gratuit (T4 → 5B, 480p) | github.com/Square-Zero-Labs/Wan2GP-on-Colab |
| Isi-dev Colab Notebooks | Wan 2.2 First-Last-Frame, LTX-2 | github.com/Isi-dev/Google-Colab_Notebooks |
| wan2.2-google-colab | Tous les modes Wan 2.2 | github.com/theelderemo/wan2.2-google-colab |
| Workflows ComfyUI Wan 2.2 | First-last-frame (Apache 2.0, usage commercial OK) | docs.comfy.org/tutorials/video/wan/wan2_2 |
| scroll-cinematic-claude | Référence de séquence d'images (non installé) | github.com/zubair-trabzada/scroll-cinematic-claude |

---

## 7. Métadonnées des images et vidéos

**On fait** : écrire nos propres métadonnées sur les visuels finaux (titre, auteur = ton studio, copyright client, description, mots-clés) avec exiftool ou ffmpeg.

**On ne fait pas** : retirer des filigranes ou des marquages de provenance IA. On utilise des sources **sans filigrane dès le départ** (Wan 2.2 open source, Replicate, vraies photos).

---

## 8. Budget estimé

| Poste | Gratuit | Payant à l'usage |
|---|---|---|
| Photos 360° des bidons | Téléphone + plateau tournant (~5 000 FCFA) | — |
| Images de décor | HF ZeroGPU | ~0,02–0,05 $/image |
| Vidéos de décor (6 × 5 s) | Kaggle/Colab Wan 2.2 | ~1–3 $ au total |
| Hébergement + admin | Cloudflare Pages + Keystatic Cloud (3 utilisateurs) + Web3Forms | Domaine ~10–15 $/an |

→ Faire payer au client au minimum le domaine et les générations premium.

---

## 9. Ordre de travail

1. ⏳ **Ben** : infos de la société + logo → trancher l'activité (§0)
2. Envoyer la checklist (§1) au représentant
3. Installer les MCP (§4) et les dépendances (§5) → preuve avec `claude mcp list`
4. Playwright : extraire le catalogue de petrovoll.com dans `catalogue.json` (usage interne)
5. Croiser avec la liste Burkina du représentant → produits retenus → saisis dans l'admin
6. Identité visuelle : logo, couleurs, polices, tréma « Petrovöll » partout
7. Séance photo 360° des bidons phares (§2)
8. Scénario des scènes (textes FR, ordre) — **validation avant toute génération**
9. Génération des décors, puis intégration dans le site Astro (séquence 360° à la place du bidon 3D)
10. Mise en ligne : Cloudflare Pages + Keystatic Cloud + Web3Forms + domaine
