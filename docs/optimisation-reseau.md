# Optimisation réseau et mode hors ligne (06/10/2026)

Public visé : Afrique de l'Ouest, 3G faible/coupée, data chère.
Sauvegarde avant intervention : `ops/sauvegarde-avant-optim-2026-10-06.tar`. Originaux des fichiers `public/` recompressés : `ops/originaux-public/`.

## 1. Mesures

### dist/ (65 Mo → 68 Mo mesuré, voir explication)
| Dossier | Ko | Remarque |
|---|---|---|
| `dist/_astro/` | 52 250 | 852 webp (26 Mo), 413 avif (12,5 Mo), 59 jpeg (4,9 Mo), 9 js (3,5 Mo), 2 glb (2,6 Mo) |
| `dist/hero-video/` | 9 525 | séquences d'images du hero (chargées à la demande) |
| `dist/bidon-studio/` | 3 272 | séquence du bidon au scroll |
| `dist/produits/` | 1 292 | pages produits |
| `dist/_worker.js/` | 1 015 | code serveur (jamais envoyé au visiteur) |

**Le poids de dist/ n'est pas le poids transféré.** Un visiteur ne télécharge qu'une petite partie : chaque photo existe en plusieurs largeurs et formats (avif + webp + jpeg de repli) et le navigateur n'en prend qu'un. dist/ a grossi de 65 à 68 Mo entre deux builds du même jour à cause du travail en cours du propriétaire (nouvelles images générées), pas de mes changements (qui ajoutent ~25 Ko).

### 20 plus gros fichiers de dist/ et origine
| Octets | Fichier | Servi au visiteur ? |
|---|---|---|
| 2 788 849 | `_astro/keystatic-page.*.js` | Non (admin `/keystatic` seulement) |
| 1 589 680 | `_astro/bidon.*.glb` | Oui, seulement si la 3D du bidon est chargée (appareil assez puissant) |
| 1 045 012 | `_astro/bidon-lite.*.glb` | Idem, version allégée |
| 719 410 | `draco/draco_decoder.js` | Idem, décodeur 3D (à la demande) |
| 597 394 → 526 202 | `hero-video/pieces/atlas-huile.webp` | Oui, moteur du hero (à la demande) |
| 576 426 → 529 666 | `hero-video/pieces/fluide-carter.webp` | Idem |
| 575 231 | `_astro/bidon-3d.*.js` | Seulement avec la 3D du bidon |
| 454 550 → 379 248 | `hero-video/pieces/atlas.webp` | Idem |
| 412 257 | `_worker.js/.../keystatic/...mjs` | Non (serveur) |
| 290 914 | `produits.html` | Oui, page catalogue (≈ 30 Ko compressée par Cloudflare) |
| 285 747 | `draco/draco_decoder.wasm` | Seulement avec la 3D |
| 255 302 | `_worker.js/chunks/astro/server_*.mjs` | Non (serveur) |
| 257 107 / 217 568 / 174 265 | `_astro/{distribution,lubrifiants,pneumatiques}.*.jpg` | **Non** : originaux déposés par Astro, aucune page ne les référence (seules les versions webp/avif redimensionnées sont utilisées). Ils alourdissent dist/ mais pas le visiteur |
| 215 882 → 81 450 | `images/og-default.png` | Seulement par les réseaux sociaux (aperçu de partage) |
| ~180 000 ×3 | `_astro/filtre-scania-*.webp` | Oui, page produit concernée (plusieurs largeurs, une seule est chargée) |
| 142 296 | `_astro/index.*.js` | Selon la page (îlot React du filtre catalogue) |

### Page d'accueil (poids transféré, mesuré sur dist/index.html)
| Élément | Avant | Après |
|---|---|---|
| HTML (gzip) | 13,4 Ko | 13,4 Ko (+0,2 Ko : lien manifest + script d'enregistrement) |
| CSS (gzip) | 12,7 Ko | 12,9 Ko |
| JS de page (gzip) | 0,4 Ko (+ scripts des héros chargés à part) | 2,4 Ko (script d'appareil de l'autre agent compris) |
| Polices | 60,6 Ko (Inter 47 Ko + Bebas 13 Ko) | inchangé |
| Icône apple-touch (chaque page) | 17,8 Ko | 7,4 Ko |
| Images du premier écran (affiche hero, logo) | ~35 Ko | inchangé |

Total « premier écran » ≈ 150 Ko avant et après ; les gains de cette passe se trouvent surtout **aux visites suivantes** (service worker : plus rien à retélécharger pour CSS/JS/polices/images déjà vues, pages lisibles sans réseau). Les images sous le premier écran (secteurs : ~350 Ko au total) sont en `loading="lazy"`.

### public/ (14 Mo → 13,4 Mo)
| Fichier | Avant | Après | Méthode |
|---|---|---|---|
| `hero-video/pieces/atlas.webp` | 454 550 | 379 248 | WebP qualité 82, alpha 100 (écart moyen 0,4/255, invisible) |
| `hero-video/pieces/atlas-huile.webp` | 597 394 | 526 202 | idem (0,6/255) |
| `hero-video/pieces/fluide-carter.webp` | 576 426 | 529 666 | idem (0,6/255) |
| `images/og-default.png` | 215 882 | 81 450 | PNG sans perte (recompression) |
| `icon-512.png` | 93 608 | 35 817 | PNG sans perte |
| `icon-192.png` | 20 011 | 8 365 | PNG sans perte |
| `apple-touch-icon.png` | 18 199 | 7 584 | PNG sans perte |

Noms et chemins inchangés. Les séquences `hero-video/desktop|mobile` et `bidon-studio` (déjà en WebP 50-60 Ko par image) n'ont pas été retouchées : leur contenu est le travail en cours de l'autre agent / du propriétaire, et le gain restant est faible.

## 2. Changements fichier par fichier
- `public/sw.js` (nouveau) : service worker sans dépendance.
  - Pages HTML : réseau d'abord (délai max 8 s, utile en 3G très lente), copie en cache en secours, sinon page `/hors-ligne`. 40 pages maximum conservées.
  - CSS/JS/polices : cache d'abord. Images : cache d'abord, 120 entrées max. Séquences `hero-video/` et `bidon-studio/` : cache à la demande uniquement, cache séparé de 90 entrées max, jamais pré-cachées.
  - Installation : pré-cache seulement `/hors-ligne` et ses CSS/polices (≈ 70 Ko).
  - Jamais en cache : `/keystatic`, `/api`, `sw.js`, requêtes non-GET, requêtes `Range`, autres domaines, bundle admin `_astro/keystatic*`. GLB/wasm/décodeur Draco : laissés au navigateur (cache HTTP).
  - Garde un petit index (`/__index-pages`) des titres des pages visitées, pour la page hors ligne.
- `src/components/layout/ServiceWorker.astro` (nouveau) : `<link rel="manifest">` + enregistrement différé (après `load`, en inactivité), uniquement en production et en HTTPS (ou localhost).
- `src/layouts/BaseLayout.astro` : 2 lignes ajoutées seulement (import + `<ServiceWorker />` sous l'icône apple-touch). Les lignes de l'autre agent (script d'appareil) sont intactes.
- `src/pages/hors-ligne.astro` (nouveau) : page sobre en français, bouton Réessayer, liste des pages déjà visitées (lue dans le cache, sans réseau). `noindex`, prérendue (`dist/hors-ligne.html`).
- `public/manifest.webmanifest` (nouveau) : nom SASOMA — Petrovöll, `standalone`, icônes 192/512 existantes.
- `public/_headers` : ajout `sw.js` sans cache ; manifest 1 jour ; icônes/favicon 30 jours. `/_astro/*` (immutable 1 an), `/fonts`, `/images`, `/hero-video` étaient déjà corrects. HTML : Cloudflare Pages envoie déjà `max-age=0, must-revalidate` (revalidation légère par ETag) : rien à ajouter. `Service-Worker-Allowed` inutile : sw.js est à la racine.
- `public/` : recompressions ci-dessus.

## 3. Vérifications faites / non faites
- Images : toutes les photos passent déjà par `astro:assets` (`Picture`/`Image` : avif+webp, srcset, width/height, `lazy` hors premier écran, `fetchpriority="high"` + `eager` pour l'image prioritaire). Rien à corriger.
- Polices : déjà `font-display: swap`, sous-ensemble latin (unicode-range), un seul fichier variable pour Inter, deux préchargements (Inter + Bebas, tous deux utilisés au premier écran). Rien à changer.
- JS client : un seul îlot React (filtre du catalogue, `index.*.js` 142 Ko, page produits) ; pas d'hydratation inutile trouvée dans mes dossiers. Le gros du JS (bidon 3D 575 Ko + décodeur Draco) n'est chargé que sur appareil capable ; c'est du ressort de l'autre agent. **À signaler** : le filtre catalogue en React embarque React entier (~140 Ko) ; le réécrire en script natif économiserait ~45 Ko compressés sur `/produits` (non fait : réécriture de composant).
- Tests : `npm run test` 83/83 verts ; `npm run build` OK ; `dist/sw.js`, `dist/hors-ligne.html`, `dist/manifest.webmanifest` présents.
- **Non testé en navigateur réel** (aucun navigateur piloté disponible cette nuit) : le comportement hors ligne n'a été vérifié que par relecture et contrôle de syntaxe (`node --check`). À essayer en priorité (voir ci-dessous).

## 4. Tester le hors-ligne
1. `npm run build && npm run preview` (ou le site déployé en HTTPS), ouvrir Chrome sur `http://localhost:4321`.
2. DevTools > Application > Service Workers : `sw.js` doit être « activated and running ».
3. Visiter l'accueil, `/produits`, une fiche produit, `/contact`.
4. DevTools > Network > cocher **Offline**, recharger : les pages visitées s'affichent. Ouvrir une page jamais visitée : la page « Hors ligne » apparaît avec la liste des pages disponibles.
5. Application > Cache Storage : `sasoma-pages-v1`, `sasoma-static-v1`, `sasoma-images-v1`, `sasoma-sequences-v1`.
6. Vérifier que `/keystatic` n'apparaît dans aucun cache.

## 5. Nouvelle version : vider le cache du service worker
- Les pages HTML sont toujours rechargées depuis le réseau quand il y en a un : rien à faire pour du nouveau contenu.
- Les fichiers de `/_astro/` ont un nom haché : un nouveau build crée de nouveaux noms, l'ancien cache est simplement ignoré.
- Les fichiers à nom fixe (`/images/...`, `/fonts/...`, séquences `hero-video`/`bidon-studio` sans `?v=`) restent servis depuis le cache tant que la version ne change pas. **Si vous remplacez l'un d'eux, changez `VERSION` en tête de `public/sw.js`** (`'v1'` → `'v2'`) : à l'activation, tous les caches `sasoma-*` d'une autre version sont supprimés.
- Ponctuellement : DevTools > Application > Storage > « Clear site data », ou Service Workers > « Unregister ».
- Pour désactiver complètement le mode hors ligne : retirer `<ServiceWorker />` de `BaseLayout.astro` et publier un `sw.js` qui se désinscrit (`self.registration.unregister()`).

## 6. Points à relire
- Les héros (autre agent) ajoutent leurs propres images à la demande : elles passent par le cache « séquences » plafonné à 90 entrées (les plus anciennes sortent en premier). Si une séquence compte plus de 90 images, relever `MAX_SEQ` dans `sw.js`.
- Les JPG originaux de `dist/_astro/` (1 Mo) sont inutiles, mais leur émission vient d'Astro (imports d'images) ; sans effet pour le visiteur.
- Le domaine `site` est encore `https://sasoma.example` dans `astro.config.mjs` (non lié à cette tâche).
