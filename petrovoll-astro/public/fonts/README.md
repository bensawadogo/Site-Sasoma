# public/fonts — polices auto-hébergées

Deux polices variables, déclarées dans `src/styles/global.css` (`@font-face`) et préchargées dans
`src/layouts/BaseLayout.astro`. Choix du 20/10/2026 (demande de Ben : « de vraies polices professionnelles »).

| Fichier                            | Police                       | Usage                    | Licence       |
| ---------------------------------- | ---------------------------- | ------------------------ | ------------- |
| `plus-jakarta-sans-variable.woff2` | Plus Jakarta Sans (200–800)  | Titres (`--font-display`) | SIL OFL 1.1   |
| `inter-variable.woff2`             | Inter (100–900)              | Texte (`--font-sans`)     | SIL OFL 1.1   |

Source : Fontsource 5.3.0 (`@fontsource-variable/plus-jakarta-sans`, `@fontsource-variable/inter`), sous-ensemble
latin (accents français, œ, « », €, ä ö ü de Petrovöll/STÄRK). Textes de licence : `LICENSE-OFL.txt` (Inter),
`LICENSE-PlusJakartaSans-OFL.txt`.

Mise à jour : `npm pack @fontsource-variable/plus-jakarta-sans` dans un dossier temporaire, puis copier
`files/plus-jakarta-sans-latin-wght-normal.woff2` ici.

Avant le 20/10 : Clash Display + General Sans (09/10), puis Bebas Neue + Inter.
