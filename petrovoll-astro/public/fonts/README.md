# public/fonts — polices auto-hébergées

Deux fichiers `.woff2`, déclarés dans `src/styles/global.css` (`@font-face`) et
préchargés dans `src/layouts/BaseLayout.astro` (`<link rel="preload">`).

## Fichiers

| Fichier                | Police              | Poids / axes          | Taille              | Usage                      |
| ---------------------- | ------------------- | --------------------- | ------------------- | -------------------------- |
| `bebas-neue-400.woff2` | Bebas Neue Regular  | 400                   | 13 768 o (13,4 Ko)  | Titres d'impact            |
| `inter-variable.woff2` | Inter (variable)    | axe `wght` 100 → 900  | 48 256 o (47,1 Ko)  | Corps de texte et chiffres |

Total : 62 024 octets (60,6 Ko), sous l'objectif de 70 Ko.

## Source et version

| Fichier                | Paquet npm (non installé, extrait via `npm pack`) | Fichier d'origine dans le paquet            | Version interne de la police       |
| ---------------------- | ------------------------------------------------- | ------------------------------------------- | ---------------------------------- |
| `bebas-neue-400.woff2` | `@fontsource/bebas-neue@5.3.0`                    | `files/bebas-neue-latin-400-normal.woff2`   | Version 2.000 (Google Fonts v16)   |
| `inter-variable.woff2` | `@fontsource-variable/inter@5.3.0`                | `files/inter-latin-wght-normal.woff2`       | Version 4.001 (Google Fonts v20)   |

Fontsource reprend les fichiers de https://github.com/google/fonts ; ils sont
copiés tels quels (renommés, non modifiés).

SHA-256 :

- `bebas-neue-400.woff2` : `a7c90c89240c134f7fdd33d40c000ec90b79d675ea53e8cc5a6d423c073de412`
- `inter-variable.woff2` : `3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62`

## Licence

SIL Open Font License 1.1 pour les deux polices — texte complet et copyrights
dans `LICENSE-OFL.txt` :

- Copyright 2019 The Bebas Neue Project Authors (https://github.com/dharmatype/Bebas-Neue)
- Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)

## Sous-ensemble

Sous-ensemble « latin » de Fontsource / Google Fonts, repris à l'identique dans
les `unicode-range` de `global.css` :

```
U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304,
U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
U+FEFF, U+FFFD
```

Couverture vérifiée avec fontTools (table `cmap`) sur les deux fichiers :

- français : é è ê à ç ô û ï â î ë ù ÿ, majuscules accentuées, œ Œ, « » ’ – — € ;
- allemand (noms de marque Petrovöll, STÄRK, MÖTPRO) : ä ö ü Ä Ö Ü.

Seul manque « Ÿ » (U+0178, sous-ensemble latin-ext), sans usage sur le site.
Si un jour il faut du latin étendu (polonais, turc…), ajouter le fichier
`latin-ext` du même paquet dans un second `@font-face` avec sa propre
`unicode-range` (il ne sera téléchargé que si la page en a besoin).

## Mise à jour

```bash
# dans un dossier temporaire, hors du projet (ne pas ajouter aux dépendances)
npm pack @fontsource/bebas-neue @fontsource-variable/inter
tar -xzf fontsource-bebas-neue-*.tgz && cp package/files/bebas-neue-latin-400-normal.woff2 <projet>/public/fonts/bebas-neue-400.woff2
tar -xzf fontsource-variable-inter-*.tgz && cp package/files/inter-latin-wght-normal.woff2 <projet>/public/fonts/inter-variable.woff2
```

Puis mettre à jour ce README (versions, tailles, SHA-256).

## Pourquoi l'auto-hébergement

- **Aucune requête tierce** (pas de Google Fonts) : moins de latence pour les
  visiteurs en 3G/4G en Afrique de l'Ouest, et meilleure conformité RGPD.
- `font-display: swap` → le texte s'affiche immédiatement avec la police
  système, sans bloquer le rendu (protection du LCP < 2,5 s).
- Une seule variante par famille : la police variable évite de charger un
  fichier par graisse.
- TODO [perf] : si le poids devient un problème, sous-ensembler davantage
  (glyphes réellement utilisés) avec `glyphhanger` ou `subfont`.

## Alternative moderne

Astro propose une API de polices (`experimental.fonts` sur les versions 5.x,
stabilisée ensuite) qui télécharge et auto-héberge les polices au build. À
envisager lors d'un passage à une version d'Astro où l'option est stable.
