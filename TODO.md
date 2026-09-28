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
- [x] Phase 4b : P1 → corps sans bouchon + bouchon séparé, WebP (l'AVIF a été retiré : le masque réutilise le WebP en cache), silhouette (`npm run hero:bidon`) ; `spout` et `bottlePivot` mesurés (`geometrie.json`)
- [x] P1 intégrée dans le hero, `produitVerse` → `stark-semi-synthetique` ; huile en `overlay` (étiquette lisible, comparé en capture) — `ops/captures/bidon-360x800.jpg`
- [x] Moteur SVG animé : cames → pistons → vilebrequin, huile par pièce, orifice (0,5 ; 0,12) — SVG 4,8 Ko gzip, 12 tests *(sous-agent « moteur »)*
- [x] Moteur branché avec cadrages caméra ; séquence provisoire, affiches et `build-frames.mjs` retirés
- [x] Captures 360×800, 390×844 et 1440×900 refaites après les corrections (`ops/captures/hero-*.jpg`) : un seul texte à la fois, fin `inert` jusqu'à p = 1, aucune requête 3D pendant le hero, zéro erreur console / 404
- [x] Phase 8 : audit mobile *(sous-agent « audit », rapports dans le dossier de travail)* — Lighthouse palier lite, CPU ×4 / ×6 : performance 90 / 88, accessibilité, bonnes pratiques et SEO 100, LCP 2,1 / 2,2 s, CLS 0, **213 Ko au départ**. Défaut trouvé : la 3D du Produit phare (1,1 à 1,3 Mo) démarrait à 36 % du hero et provoquait des images de plus d'1 s → corrigé (démarrage à l'entrée à l'écran, au premier moment calme ; image seule en 3G).
- [ ] Mesurer la fluidité sur un vrai Android d'entrée de gamme (Chrome headless rend en logiciel : ses fps ne sont pas représentatifs)
- [x] Phase 9 : [docs/hero.md](docs/hero.md)

## Site

- [x] Polices auto-hébergées, zéro 404 (Bebas Neue 13 Ko + Inter Variable 47 Ko, OFL) *(sous-agent « polices »)*
- [x] Relecture du code *(sous-agent « relecture », 32 points)* — corrigés : titre de page vidé qui cassait le build, numéro WhatsApp sans indicatif, page contact sans issue, liens de fin focusables invisibles, verrouillage du menu qui décrochait le hero, menu en paysage, 3D en 3G, double téléchargement du bidon, films d'huile dans `<defs>` (variables CSS), canonical / sitemap (`build.format: 'file'`), Applebot-Extended, visuel et alt du Produit phare, contraste du badge, `<dl>`, annonces du chargement 3D, alt en double, fuite GPU si le GLB échoue, `will-change`, prefetch inutile, cache des polices, garde-fou documenté, canvas réalloué, bornes du script bidon + `sharp` déclaré, commentaires faux, code mort, `og:image` aux vraies dimensions, `BackOrder`, `Host`, `X-Robots-Tag` sur l'admin. **Laissés volontairement** : rotation 3D permanente (demande du client), compatibilité des très vieux navigateurs (Tailwind v4 : Chrome 111+ ; à surveiller), fichiers `assets-source/video` (conservés).
- [~] Script QA mobile `npm run bidon:mobile` réécrit pour le nouveau hero *(sous-agent « QA mobile »)*
- [ ] 🧑 Téléphone (désormais obligatoire), WhatsApp, e-mail et adresse dans l'admin (Coordonnées) : sans eux, la page contact affiche « coordonnées bientôt disponibles »
- [ ] 🧑 Projet Keystatic Cloud + `PUBLIC_KEYSTATIC_PROJECT`
- [ ] 🧑 Clé Web3Forms (`PUBLIC_WEB3FORMS_KEY`)
- [ ] 🧑 Nom de domaine, puis `site` dans `astro.config.mjs` (actuellement `https://sasoma.example`)
- [ ] 🧑 Déploiement Cloudflare Pages (vérifier au premier déploiement la liaison KV `SESSION` signalée par l'adaptateur)
- [ ] 🧑 Autorisation écrite de Petrovöll pour les visuels ; logo SVG ; fiches techniques (TDS)
- [ ] 🧑 Donner le feu vert pour pousser les commits sur GitHub

## Journal
- 2026-09-27 — liste créée ; décisions D1 à D5.
- 2026-09-27 — P1 intégrée (bouchon découpé, huile masquée), polices en place ; ajout de vitest.config.ts (alias `@/`).
- 2026-09-27 — moteur SVG intégré (sous-agent), phase 9 écrite ; audit et relecture lancés en parallèle (sous-agents).
- 2026-09-28 — rapports d'audit et de relecture traités ; build, 40 tests, `astro check` 0 erreur ; captures refaites en 3 formats.
