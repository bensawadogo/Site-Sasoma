# PETROVOLL — site vitrine & catalogue

Astro 5 · Keystatic (admin) · Tailwind v4 · three.js · Cloudflare Pages.
Conçu mobile-first pour l'Afrique de l'Ouest : smartphones d'entrée de gamme, 3G.

## Commandes

```bash
npm install
npm run dev       # http://127.0.0.1:4321  — admin : /keystatic
npm run check     # vérification des types (doit afficher 0 erreur)
npm test          # tests unitaires (vitest)
npm run build     # site de production dans dist/
```

## Qui modifie quoi

| Contenu | Où |
|---|---|
| Produits (prix, photos, stock), secteurs, textes des pages, coordonnées, WhatsApp | **Le client**, dans l'admin `/keystatic` (depuis son téléphone) |
| Mise en page, couleurs, polices, bidon 3D | Le développeur, dans `src/` |
| Clés Keystatic Cloud et formulaire | Le développeur, variables d'environnement (`.env.example`) |

Chaque enregistrement dans l'admin crée un commit ; Cloudflare Pages reconstruit
le site en 1 à 2 minutes. Les schémas de `src/content.config.ts` sont
volontairement tolérants : une saisie incomplète ne bloque jamais la mise en ligne.

## Organisation

```
keystatic.config.ts      champs de l'admin (libellés et aides en français)
src/content.config.ts    relecture de ces contenus par Astro
src/content/             contenus écrits par l'admin (.mdoc / .yaml)
src/assets/produits/     photos envoyées par le client (optimisées au build)
src/lib/contenu.ts       accès au contenu + valeurs de repli (point d'entrée unique)
src/lib/format.ts        prix FCFA, liens WhatsApp/tel, extraits (testé)
src/components/3d/       bidon : image WebP instantanée, puis 3D si l'appareil le permet
src/scripts/bidon-3d.ts  rendu three.js, chargé à la demande
```

## Bidon 3D

- `src/assets/bidon/bidon-lite.glb` (161k triangles, couleur 2048 px, 1 Mo) pour les smartphones,
  `src/assets/bidon/bidon.glb` (269k triangles, 2048 px, 1,5 Mo) pour les ordinateurs.
  Sous ~160k triangles, le relief du scan ne colle plus à la forme : le bidon paraît cabossé.
- Générés depuis le scan brut `assets-source/bidon-meshy.glb` (33 Mo, textures 4096 px,
  non versionné) : `npm run bidon:all`. La texture du scan n'est jamais retouchée ;
  seules la taille et la compression changent (voir l'en-tête de `scripts/build-bidon.mjs`).
- Le scan a recopié l'étiquette en miroir au dos : `bidon-3d.ts` la neutralise au rendu
  (`neutraliserDosEtiquette`), ce qui permet la rotation complète.
- `src/assets/bidon/bidon-400.webp` / `bidon-800.webp` : rendu fixe du bidon avec le
  même cadrage et le même éclairage que la scène 3D. À régénérer si l'un des deux change.

## Mise en ligne (Cloudflare Pages)

1. Connecter le dépôt GitHub à Cloudflare Pages — dossier racine
   `petrovoll-astro`, commande `npm run build`, dossier de sortie `dist`.
2. Variables d'environnement : `PUBLIC_KEYSTATIC_PROJECT`, `PUBLIC_WEB3FORMS_KEY`.
3. Remplacer `site` dans `astro.config.mjs` par le vrai domaine (seul endroit).
