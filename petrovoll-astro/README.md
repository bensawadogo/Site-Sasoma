# PETROVOLL — Site corporate (Astro 5 + Keystatic + Tailwind v4)

Squelette B2B/B2C multi-secteurs, **mobile-first** (Afrique de l'Ouest, 3G/4G).
Produit phare : huiles moteur **PETROVOLL** (bidon 3D en hero).

## Commandes

```bash
npm install        # dependances
npm run dev        # dev local : http://127.0.0.1:4321
npm run build      # build statique + verif types (astro check)
npm run preview    # previsualiser dist/
npm run deploy     # publier dist/ sur Cloudflare Pages (wrangler)
```

Admin CMS (dev) : **http://127.0.0.1:4321/keystatic**

## Ajouter un produit via Keystatic

1. `npm run dev` → ouvrir `/keystatic`
2. Collection **Produits** → *Create* → remplir titre, secteur, marque,
   reference, images (max 5, alt obligatoire), cocher **Produit phare**
   pour la Home → *Save* (ecrit `src/content/produits/<slug>.mdoc`)
3. Rebuild auto en prod (commit Git → Cloudflare Pages).

## Placer le .glb du bidon

1. Deposer `bidon.glb` dans `public/models/` (< 1 Mo, Draco si possible)
2. Dans `src/components/3d/BidonScene.astro` : decommenter section 4
   (GLTFLoader), supprimer le cylindre section 3
3. Procedure detaillee : `src/scripts/bidon-three.js`

## Compresser le scan Meshy (SANS Blender)

> Contexte : le scan brut `assets-source/bidon-meshy.glb` (HORS `public/`,
> jamais deploye) fait **33 Mo** (~18 Mo de textures JPEG + ~15 Mo de
> geometrie) — inutilisable sur 3G.
> Ce pipeline le ramene a **~2-4 Mo** via `@gltf-transform/cli`
> (outil de Don McCurdy, standard industrie 2026).

```bash
npm install                  # installe @gltf-transform/cli (devDependency)
npm run bidon:audit          # audit : repartition textures vs geometrie
npm run bidon:compress       # weld → resample → resize 1024 → webp → draco → optimize
npm run bidon:inspect public/models/bidon.glb   # controle le resultat
```

Apres compression, activer les decodeurs Draco dans
`src/components/3d/BidonScene.astro` (suivre `TODO [3d-decoders]`) :
copier `node_modules/three/examples/jsm/libs/draco/` vers `public/draco/`,
decommenter le bloc DRACO, recharger. Le procedural d'origine est
sauvegarde en `public/models/bidon-procedural-backup.glb`.

### Depannage compression

| Probleme | Cause probable | Solution |
|---|---|---|
| `npx gltf-transform` introuvable | `npm install` non lance | `npm install` puis relancer |
| Erreur Sharp a l'install | Binaire natif manquant | Voir https://sharp.pixelplumbing.com/install |
| Resultat encore > 5 Mo | Geometrie tres dense | Ajouter `simplify` : `npx gltf-transform simplify in.glb out.glb --ratio 0.3` avant l'etape Draco |
| Cylindrе orange au lieu du scan | Bloc DRACO pas decommente | Suivre `TODO [3d-decoders]` dans BidonScene.astro |
| Textures floues | Resize 1024 trop agressif | Relancer avec `--width 2048 --height 2048` (etape resize) |

## Deployer sur Cloudflare Pages

1. `wrangler login` → `npm run build` → `npm run deploy`
   (ou connecter le repo Git : build `npm run build`, dossier `dist/`)
2. Variables : `PUBLIC_SITE_URL` (domaine prod), `PUBLIC_WHATSAPP_NUMBER`
3. Verifier : `/robots.txt`, `/sitemap.xml`, `/llms.txt`, validator.schema.org

## Ecarts vs spec initiale (assumes, documentes)

| Spec | Realite Astro 5 / Tailwind v4 |
|---|---|
| `output: 'hybrid'` | Supprime en v5 → `output: 'server'` + `prerender: true`/page |
| `@astrojs/tailwind` + `@astrojs/sitemap` | Deprecie / doublon → `@tailwindcss/vite` + `sitemap.xml.js` maison |
| `src/content/config.ts` | Deplace en v5 → `src/content.config.ts` (Content Layer + `glob()`) |
| `.yaml` produits | Keystatic ecrit `.mdoc` (frontmatter + rich text unifies) |
| ProduitFiltre React `client:load` | Wrapper Astro + `FiltreIsland.tsx` (island explicite) |
| `motion` (Framer) | Optionnel : `npm i motion` si animations orchestrees (squelette : CSS + `scroll-reveal.js` ~1 Ko) |
| FAQ + page 404 | Non generees (a ajouter : `faq.astro` + `404.astro`) |
