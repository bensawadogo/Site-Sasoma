# TODO — terminer le site SASOMA / hero Petrovöll

Liste de pilotage, consultée et mise à jour à chaque étape. Référence : [BRIEF-MAITRE.md](BRIEF-MAITRE.md).
Légende : `[x]` fait (avec preuve) · `[~]` en cours · `[ ]` à faire · 🧑 action de Ben / du client.

## Décisions prises (2026-09-27)

| # | Décision | Pourquoi |
|---|---|---|
| D1 | **P1 = `assets/photos/stark/P1.png`** (STÄRK Teil Synthetisches 10W40, 1 L, déjà détouré). Le hero verse ce produit (`stark-semi-synthetique`). | Seule photo reçue sans IA, avec une étiquette exacte et nette ([SELECTION.md](assets/photos/SELECTION.md)). |
| D2 | **Bouchon (P3) découpé dans P1 ; P2 obtenu en masquant le bouchon, avec une ouverture sombre dessinée en code.** | Pas de photo sans bouchon disponible. Aucune IA, et l'étiquette n'est pas touchée. |
| D3 | **Moteur du hero en illustration vectorielle animée (SVG) pilotée par le scroll**, au lieu d'une vidéo IA. | Les outils IA du brief (HF, Replicate, Higgsfield) ne sont pas branchés. Zéro crédit, aucun problème de droits, quelques Ko au lieu de 1 à 3 Mo, fluide sur un Android d'entrée de gamme. Le pipeline vidéo (`build-frames.mjs`) reste disponible pour une version IA plus tard. |
| D4 | **Montée de l'huile (T1) : dégradé or masqué par la silhouette (canal alpha) de P1**, avec `mask-image`. | Effet « rayons X » fidèle à la forme exacte du bidon, sans image supplémentaire. |
| D5 | **Polices : Bebas Neue (titres) et Inter Variable (texte), auto-hébergées en woff2** (licence OFL). | Les fichiers manquaient : 404 sur chaque page. |

## Hero

- [x] Phase 0 : bilan des outils
- [x] Phase 1 : recherche marque (catalogue, palette, photos)
- [x] Phase 2 : config `hero.config.ts` + scénario
- [x] Phase 3 : prototype provisoire (captures dans `ops/captures/phase3`)
- [x] Phase 4a : photos collectées, classées et sélectionnées (`research/photos-produits`, `assets/photos/SELECTION.md`)
- [x] Phase 4b : P1 → corps sans bouchon + bouchon séparé, WebP/AVIF, silhouette (`npm run hero:bidon`) ; `spout` et `bottlePivot` mesurés (`geometrie.json`)
- [x] P1 intégrée dans le hero, `produitVerse` → `stark-semi-synthetique` ; huile en `overlay` (étiquette lisible, comparé en capture) — `ops/captures/bidon-360x800.jpg`
- [~] Moteur SVG animé : cames → pistons → vilebrequin, huile dorée par étapes, ancre `filler` alignée *(sous-agent « moteur »)*
- [ ] Brancher le moteur SVG dans le hero à la place de la séquence provisoire ; retirer les images provisoires (3 Mo)
- [ ] Captures 360×800 → 390×844 → 1440×900 aux progressions 0 / 0,2 / 0,45 / 0,7 / 1, plus le filet
- [ ] Phase 8 : audit Lighthouse mobile (lite : LCP < 2,5 s, CLS < 0,05, < 400 Ko au départ) *(sous-agent « audit »)*
- [ ] Phase 9 : README « refaire un hero pour un autre produit »

## Site

- [x] Polices auto-hébergées, zéro 404 (Bebas Neue 13 Ko + Inter Variable 47 Ko, OFL) *(sous-agent « polices »)*
- [ ] Relecture du code finale (qualité, dette technique) *(sous-agent « relecture »)*
- [ ] 🧑 Numéro WhatsApp, e-mail et adresse dans l'admin (Réglages du site)
- [ ] 🧑 Projet Keystatic Cloud + `PUBLIC_KEYSTATIC_PROJECT`
- [ ] 🧑 Clé Web3Forms (`PUBLIC_WEB3FORMS_KEY`)
- [ ] 🧑 Nom de domaine, puis `site` dans `astro.config.mjs` (actuellement `https://sasoma.example`)
- [ ] 🧑 Déploiement Cloudflare Pages
- [ ] 🧑 Autorisation écrite de Petrovöll pour les visuels ; logo SVG ; fiches techniques (TDS)
- [ ] 🧑 Donner le feu vert pour pousser les commits sur GitHub

## Journal
- 2026-09-27 — liste créée ; décisions D1 à D5.
- 2026-09-27 — P1 intégrée (bouchon découpé, huile masquée), polices en place ; ajout de vitest.config.ts (alias `@/`).
