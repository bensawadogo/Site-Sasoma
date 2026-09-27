/**
 * ════════════════════════════════════════════════════════════════════════════
 *  tailwind.config.mjs — COMPATIBILITÉ UNIQUEMENT
 * ════════════════════════════════════════════════════════════════════════════
 *  ⚠️  CE FICHIER N'EST PAS LU AUTOMATIQUEMENT PAR TAILWIND v4.
 *
 *  Tailwind CSS v4 est « CSS-first » : les design tokens (couleurs, polices,
 *  breakpoints, ombres…) se déclarent directement dans la feuille de styles,
 *  via la directive `@theme` — voir `src/styles/global.css` :
 *
 *      @import "tailwindcss";
 *      @theme {
 *        --color-primary: #0A0A0A;
 *        --color-accent:  #D4420A;
 *        ...
 *      }
 *
 *  Ce qui génère automatiquement les utilitaires (`bg-primary`, `text-accent`,
 *  `font-display`, `shadow-industrial`…). Aucun fichier JS n'est nécessaire —
 *  et donc aucune de ces valeurs n'est dupliquée ici (source de vérité unique).
 *
 * ─── QUAND CE FICHIER DEVIENT UTILE ────────────────────────────────────────
 *  1. Plugin tiers sans équivalent CSS (ex. un plugin maison) :
 *       @plugin "./mon-plugin.js";      ← préférer cette forme en v4
 *  2. Intégration d'un package legacy qui exige un config JS :
 *       ajouter dans src/styles/global.css  →  @config "../tailwind.config.mjs";
 *     (la directive @config doit être placée APRÈS `@import "tailwindcss"`)
 *
 *  ⚠️  Si vous ajoutez `@config`, Tailwind v4 fusionnera ce fichier avec le
 *      `@theme` CSS. Évitez d'y redéclarer les couleurs : gardez les tokens
 *      dans global.css pour ne pas dupliquer le design system.
 * ════════════════════════════════════════════════════════════════════════════
 */

/** @type {import('tailwindcss').Config} */
export default {
  // v4 : détection automatique des sources (pas de `content: []` à maintenir).
  // v4 : `darkMode` se configure en CSS → `@custom-variant dark (&:where(.dark, .dark *));`
  theme: {
    extend: {
      // Rempli uniquement si un `@config` est ajouté dans global.css.
      // TODO [design] : rien à mettre ici tant que les tokens restent en CSS.
    },
  },
  plugins: [
    // TODO [plugins] : en v4, préférer la directive CSS :
    //   @plugin "@tailwindcss/typography";
    // (utile pour styler la description riche rendue depuis Keystatic)
  ],
}
