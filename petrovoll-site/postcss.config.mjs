/**
 * Configuration PostCSS (Tailwind CSS v3 + Autoprefixer).
 * NOTE : Tailwind v4 n'utilise plus ce fichier (plugin @tailwindcss/postcss).
 *       Le projet est volontairement sur Tailwind v3 car shadcn/ui + tailwind.config.ts
 *       sont utilisés dans la stack demandée.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}