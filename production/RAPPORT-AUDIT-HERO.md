# Audit du hero par le navigateur MCP, comparé à la Méthode V2 (29/09/2026)

Navigateur : serveur MCP Playwright, en 390×844 et en 1440×900, à 5 et 4 positions de scroll.

| Page | Adresse | Ce que c'est |
|---|---|---|
| A | `http://127.0.0.1:4321/` | Accueil du site Astro, avec l'ancien hero dessiné (SVG) |
| B | `http://127.0.0.1:4321/apercu-hero` | Aperçu v3 (images IA, bidon réel animé en code) |
| C | `http://127.0.0.1:8080/?debug` | `index.html` de la Méthode V2 (code fourni, copié tel quel) |

Captures : `ops/captures/mcp-navigateur/audit-{m,d}-{A,B,C}-*.png` et les planches `planche-audit-*.jpg`.

## Mesures brutes

| Page | Erreurs console | Requêtes en échec |
|---|---|---|
| A | 0 | 0 sur 15 |
| B | 0 | 0 sur 89 (72 images mobiles, toutes en 200) |
| C | 5 | `public/seq/A/m/1080/manifest.json` 404<br>`public/seq/B/m/1080/manifest.json` 404<br>`public/poster-start-m.webp` 404<br>`public/poster-end-m.webp` 404<br>`favicon.ico` 404 |

Le badge de débogage de la page C affiche `full m A:0 B:0` : aucune image n'est chargée. On ne voit que les textes.

## Défauts, du plus grave au moins grave

### Bloquants : la Méthode V2 ne peut pas s'afficher

| # | Défaut | Preuve | Qui corrige |
|---|---|---|---|
| 1 | Le hero V2 est vide : fond noir et texte de remplacement de l'image cassée en haut à gauche. Il n'y a ni bidon, ni moteur, ni huile. | 4 fichiers en 404 ; `assets/film/` n'existe pas | **Ben** filme A-m et A-d ; ensuite **moi** : messages 2 et 4 |
| 2 | La séquence B (intérieur du moteur) n'existe pas. | `assets/ai/B-m.mp4` et `B-d.mp4` absents | Moi pour E3 (message 3), puis **Ben** sur Kaggle (notebook prêt : `ops/kaggle/wan22_flf2v_kaggle.ipynb`) |
| 3 | `cwebp` n'est pas installé : `scripts/build-frames.sh` s'arrêterait au message 4. | `cwebp: command not found` (ffmpeg, lui, sait déjà écrire du WebP) | Moi, avec l'accord de Ben : installer libwebp |
| 4 | Des textes provisoires sont visibles : « [PRODUIT PHARE] » et le lien `wa.me/226XXXXXXXX`. Le numéro WhatsApp est aussi vide dans l'admin. | Capture C à p = 0,95 ; `parametresSite/index.yaml` : `whatsapp: ''` | Moi, au message 5, dès que Ben donne le nom du produit et le numéro |

### Écarts au plan sur le site actuel

| # | Défaut | Plan V2 | Constaté |
|---|---|---|---|
| 5 | L'accueil (A) montre encore l'ancien hero dessiné. | Vraie vidéo, bidon à gauche, moteur à droite | Bidon en haut au centre, moteur dessiné, versement vertical |
| 6 | Dans l'aperçu v3 (B), le bidon est du mauvais côté. | Bidon dans le tiers gauche | Bidon à droite (demande précédente, remplacée par la V2) |
| 7 | Dans l'aperçu v3 (B), le moteur est mal placé. | Moteur dans les deux tiers droits (ordinateur) ou dans la moitié droite en bas (téléphone) | Moteur au centre ; sur téléphone, il est coupé au bord gauche |
| 8 | `index.html` est une page isolée. | Le hero doit être celui du site | Pas d'en-tête ni de menu, pas les autres sections du site, pas de balise canonique, favicon en 404. Le vrai site (Astro) n'utilise pas ce hero. |

L'aperçu v3 correspond au « plan de secours » du §3 de la V2 (photo réelle du bidon, moteur, filet en code). Il ne resservira que si le tournage est impossible, et il faudra d'abord remettre le bidon à gauche.

### Défauts dans le code fourni (`hero.html`)

La Méthode V2 m'interdit de modifier autre chose que `CFG`. Je ne corrige donc ces points qu'avec l'accord de Ben.

| # | Défaut | Conséquence | Gravité |
|---|---|---|---|
| 9 | Si le garde-fou passe en palier lite pendant le scroll, l'affiche de départ (`#p0`) reste masquée, car elle a été mise à l'opacité 0 au premier dessin. | Écran noir jusqu'à 55 % sur les téléphones lents, c'est-à-dire précisément ceux que le palier lite doit protéger | **Élevée** |
| 10 | Le recadrage « cover » coupe les côtés de la vidéo sur les téléphones allongés (19,5:9) : environ 9 % de chaque côté pour une vidéo 9:16. | Un bidon filmé trop près du bord gauche sera coupé | **Élevée pour le tournage** : garder le bidon et le goulot à plus de 15 % du bord |
| 11 | L'orientation (m ou d) n'est choisie qu'au chargement. | Une tablette ou un téléphone tourné garde la mauvaise séquence | Moyenne |
| 12 | `build-frames.sh` prend des images à intervalle fixe depuis le début de la vidéo. La dernière image de la séquence A n'est donc pas forcément la vraie dernière image, qui est le point de départ de B. | Petit saut possible au raccord de 55 % | Faible : à vérifier à l'œil au message 4 |
| 13 | Tant que les affiches manquent, le texte de remplacement de l'image cassée s'affiche. | Disparaît dès que les affiches existent | Faible |
| 14 | Une boucle d'animation `tick()` tourne en permanence, même page immobile. | Un peu de batterie consommée sur mobile | Faible |
| 15 | Aucun favicon. | 404 dans la console | Faible |

## Ce qui est conforme

- Pages A et B : 0 erreur, 0 fichier manquant ; chaque format ne charge que ses propres images.
- Page C : les textes changent aux bons seuils (0, 15, 35, 55 et 92 %) ; le bouton apparaît à 92 % ; la syntaxe du code est valide ; `index.html` est identique à `hero.html`.

## Décisions à prendre (Ben)

1. Tourner A-m et A-d (défaut n° 1), en gardant le bidon à plus de 15 % du bord (n° 10).
2. Autoriser ou non : l'installation de cwebp (n° 3), la correction du défaut n° 9, puis des n° 11 à 15.
3. Donner le nom du produit phare et le numéro WhatsApp (n° 4).
4. Choisir où vivra le hero V2 (n° 8) : remplacer le hero de l'accueil Astro par ce code (je l'y intègre sans changer la chorégraphie), ou garder `index.html` comme page à part.
