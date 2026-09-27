/// <reference types="astro/client" />

/**
 * Variables d'environnement (voir .env.example). Tout ce que le CLIENT modifie
 * (téléphone, WhatsApp, e-mail…) est dans l'admin, pas ici : ces variables
 * sont réglées une fois par le développeur, dans le dashboard Cloudflare Pages.
 */
interface ImportMetaEnv {
  /** « équipe/projet » Keystatic Cloud ; absent = admin en mode fichiers locaux. */
  readonly PUBLIC_KEYSTATIC_PROJECT?: string
  /** Clé Web3Forms du formulaire de contact ; absente = formulaire masqué. */
  readonly PUBLIC_WEB3FORMS_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
