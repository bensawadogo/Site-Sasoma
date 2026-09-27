/**
 * Types d'environnement Astro.
 * `astro/client` apporte les types d'`import.meta.env`, des collections et
 * des modules virtuels (`astro:content`, `astro:assets`…).
 */
/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** URL canonique publique (par défaut : `site` de astro.config.mjs) */
  readonly PUBLIC_SITE_URL?: string
  /** Numéro WhatsApp au format international sans « + » (ex. « 2250000000000 ») */
  readonly PUBLIC_WHATSAPP_NUMBER?: string
  readonly PUBLIC_CONTACT_EMAIL?: string
  readonly PUBLIC_CONTACT_TELEPHONE?: string

  /** Cloudinary — nom du cloud uniquement côté client */
  readonly PUBLIC_CLOUDINARY_CLOUD_NAME?: string
  /** Cloudinary — secrets serveur (uploads signés, usage dans les endpoints) */
  readonly CLOUDINARY_CLOUD_NAME?: string
  readonly CLOUDINARY_API_KEY?: string
  readonly CLOUDINARY_API_SECRET?: string

  /** Keystatic — mode GitHub (serveur uniquement, voir .env.example) */
  readonly KEYSTATIC_GITHUB_CLIENT_ID?: string
  readonly KEYSTATIC_GITHUB_CLIENT_SECRET?: string
  readonly KEYSTATIC_SECRET?: string

  /** Analytics (optionnel) */
  readonly PUBLIC_UMAMI_WEBSITE_ID?: string
  readonly PUBLIC_GA_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
