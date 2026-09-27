# public/fonts — polices auto-hébergées

Les polices ne sont **volontairement pas** fournies dans ce squelette (licences
et poids des binaires) : déposez ici les deux fichiers `.woff2` référencés par
`src/styles/global.css`.

## Fichiers attendus

| Fichier                     | Police          | Poids            | Usage                        |
| --------------------------- | --------------- | ---------------- | ---------------------------- |
| `bebas-neue-400.woff2`      | Bebas Neue      | 400 (regular)    | Titres d'impact              |
| `inter-variable.woff2`      | Inter Variable  | 100 → 900        | Corps de texte et chiffres   |

## Pourquoi l'auto-hébergement

- **Aucune requête tierce** (pas de Google Fonts) : moins de latence pour les
  visiteurs en 3G/4G en Afrique de l'Ouest, et meilleure conformité RGPD.
- `font-display: swap` est déjà déclaré → le texte s'affiche immédiatement avec
  la police système, sans bloquer le rendu (protection du LCP < 2,5 s).
- La sous-ensemble latin (`unicode-range`) est déjà limité au latin de base,
  suffisant pour le français.

## Comment les obtenir (sous-ensemble latin, woff2 uniquement)

1. **Fontsource** (le plus simple) :
   ```bash
   npm install @fontsource/bebas-neue @fontsource-variable/inter
   ```
   puis copier les `.woff2` de `node_modules/@fontsource*/files/` vers ce dossier
   (ou laisser Fontsource gérer l'import dans `global.css`).
2. **google-webfonts-helper** (hébergement auto, sous-ensembles au choix).
3. **Fonts d'origine** (dossier de marque du client) — penser à vérifier la
   licence d'utilisation web.

## Vérification

- Une seule variante par famille (la police variable évite de charger 4 fichiers
  pour 4 graisses → gain direct sur le LCP mobile).
- À contrôler après mise en place : `font-display: swap` effectif et **aucune**
  requête vers `fonts.googleapis.com` / `fonts.gstatic.com`.
- TODO [perf] : si les deux fichiers dépassent 90 Ko au total, sous-ensembler
  davantage (glyphes réellement utilisés) avec `glyphhanger` ou `subfont`.

## Alternative moderne

Astro propose une API de polices (`experimental.fonts` sur les versions 5.x,
stabilisée ensuite) qui télécharge et auto-héberge les polices au build :

```js
// astro.config.mjs
experimental: {
  fonts: [
    { provider: fontProviders.fontsource(), name: 'Inter', cssVariable: '--font-sans' },
  ],
}
```

À privilégier lors d'un passage à une version d'Astro où l'option est stable —
cela supprime la gestion manuelle des fichiers `.woff2`.
