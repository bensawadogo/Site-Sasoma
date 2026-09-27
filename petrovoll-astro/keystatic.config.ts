import { collection, config, fields, singleton } from '@keystatic/core'

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  keystatic.config.ts — Admin Git-based du site PETROVOLL
 * ════════════════════════════════════════════════════════════════════════════
 *  • Local   (dev)  : npm run dev → http://127.0.0.1:4321/keystatic
 *                     Les modifications écrivent directement dans src/content/
 *  • GitHub  (prod) : édition depuis le navigateur, chaque save = un commit
 *                     → rebuild automatique Cloudflare Pages
 *
 *  ⚠️  POINTS CLÉS DE CONFIGURATION (à connaître avant d'éditer ce fichier)
 *
 *  1. FORMAT DE FICHIER — un champ `document` (rich text) ne peut PAS être
 *     sérialisé dans un .yaml. Avec `format: { contentField: 'description' }`,
 *     Keystatic regroupe TOUT dans UN SEUL fichier par entrée :
 *
 *        src/content/produits/petrovoll-huile-5w30.mdoc
 *        ┌── frontmatter YAML : titre, secteur, marque, images…
 *        └── corps           : la description riche (Markdoc)
 *
 *     C'est le format recommandé ici (1 produit = 1 fichier). L'alternative
 *     « données en YAML + description dans un fichier séparé » génère un
 *     DOSSIER par entrée (index.yaml + description.mdoc) : plus verbeux et
 *     plus difficile à charger avec Astro Content Collections.
 *
 *  2. IMAGES — `fields.cloudImage` de Keystatic = IMAGE LIBRARY DE KEYSTATIC
 *     CLOUD (service hébergé Thinkmill), ce n'est PAS Cloudinary.
 *     Ici on utilise donc :
 *       • `fields.image` → fichier versionné dans le dépôt, optimisé au build
 *         par <Image /> d'Astro (WebP/AVIF, dimensions auto, zéro CLS) ;
 *       • `fields.url`   → pour une image déjà hébergée sur Cloudinary.
 *
 *  3. LIMITE DE 5 IMAGES — le champ `array` de Keystatic n'expose AUCUNE
 *     validation de longueur (min/max). La règle « 5 maximum » est donc :
 *       • documentée dans le label du champ (côté éditeur) ;
 *       • vérifiée au build / en CI (voir TODO dans src/content.config.ts).
 *
 *  TODO [cms] :
 *   - [ ] Passer en `storage: { kind: 'github', … }` pour l'édition en ligne
 *         (voir le bloc commenté plus bas + README § Admin)
 *   - [ ] Ajouter une collection `actualites` si le client veut une section blog
 *   - [ ] Brancher `fields.relationship` pour lier produits ↔ secteurs
 *         (évite la désynchronisation des sélecteurs)
 *   - [ ] Ajouter `fields.date` (dateAjout) si un tri chronologique est requis
 */

/** Secteurs d'activité — référence unique partagée par tous les sélecteurs. */
export const SECTEURS = [
  { label: 'Huile moteur & lubrifiants', value: 'lubrifiants' },
  { label: 'Transport & logistique', value: 'transport' },
  { label: 'Distribution & import-export', value: 'distribution' },
  { label: 'Pneumatiques', value: 'pneumatiques' },
  { label: 'Fournitures de bureau', value: 'fournitures' },
] as const

export default config({
  /* ── Stockage ────────────────────────────────────────────────────────────
     'local' = le contenu est écrit sur le disque (dev / éditeur sur sa
     machine). À passer en 'github' pour éditer depuis le navigateur en
     production. */
  storage: { kind: 'local' },

  // storage: {
  //   kind: 'github',
  //   repo: { owner: 'petrovoll', name: 'site-petrovoll' },
  //   // Nécessite KEYSTATIC_GITHUB_CLIENT_ID / _CLIENT_SECRET / KEYSTATIC_SECRET
  //   // dans .env (voir .env.example) + une GitHub App configurée.
  //   // ⚠️ Le mode GitHub exige du rendu à la demande (SSR) : l'admin ne
  //   //    fonctionne que si `output: 'server'` (déjà le cas) ET que l'hôte
  //   //    fournit les APIs Node (Cloudflare → compatibility_flags
  //   //    ["nodejs_compat"], voir wrangler.toml).
  // },

  /* ── Interface d'administration ─────────────────────────────────────── */
  ui: {
    brand: { name: 'PETROVOLL — Administration' },
  },

  /* ── Collections ─────────────────────────────────────────────────────── */
  collections: {
    /* ──────────────────────────────────────────────────────────────────────
       COLLECTION : produits
       ──────────────────────────────────────────────────────────────────────
       Produit phare (estProduitPhare = true) → mise en avant en héros sur la
       Home, bloc visuellement dominant (voir home/ProduitPhare.astro).
       ─────────────────────────────────────────────────────────────────── */
    produits: collection({
      label: 'Produits',
      // Le slug est dérivé du titre ; il devient le NOM DU FICHIER
      // (donc l'ID de l'entrée Astro) et n'est pas dupliqué dans les données.
      slugField: 'titre',
      path: 'src/content/produits/*',
      // Un seul fichier .mdoc par produit (frontmatter + description riche)
      // slugField: 'titre' — le slug (nom de fichier) est dérivé du titre et
      // N'EST PAS stocké dans le frontmatter (évite toute dérive titre/slug).
      format: { contentField: 'description' },
      entryLayout: 'content',
      columns: ['titre', 'secteur', 'marque', 'estProduitPhare', 'disponible'],
      schema: {
        titre: fields.slug({
          name: {
            label: 'Titre',
            description: 'Ex. « Huile moteur PETROVOLL 5W-30 — bidon 5 L »',
            validation: { isRequired: true },
          },
          slug: {
            label: 'Slug (URL)',
            description: 'Généré depuis le titre. URL finale : /produits/<slug>',
          },
        }),

        secteur: fields.select({
          label: 'Secteur',
          description: 'Détermine la page /secteurs/<slug> sur laquelle le produit apparaît.',
          options: [...SECTEURS],
          defaultValue: 'lubrifiants',
        }),

        marque: fields.text({
          label: 'Marque',
          description: 'Marque commerciale. Ex. « PETROVOLL ».',
          defaultValue: 'PETROVOLL',
        }),

        reference: fields.text({
          label: 'Référence',
          description: 'Référence commerciale / fournisseur. Ex. « PTV-5W30-5L ».',
        }),

        description: fields.document({
          label: 'Description',
          description: 'Contenu riche affiché sur la fiche produit.',
          // TODO [cms] : affiner la mise en forme si besoin, ex.
          //   formatting: { headingLevels: [2, 3], listTypes: ['ordered', 'unordered'] }
          dividers: true,
          links: true,
          images: true,
        }),

        /**
         * Galerie — ⚠️ Keystatic ne sait PAS plafonner un array à 5 éléments.
         * La contrainte est documentée dans le label et vérifiée au build.
         */
        images: fields.array(
          fields.object({
            image: fields.image({
              label: 'Image (fichier du dépôt)',
              // Optimisée au build par <Image /> d'Astro (WebP/AVIF + dimensions)
              directory: 'src/assets/produits',
              publicPath: '/images/produits',
            }),
            urlCloudinary: fields.url({
              label: 'URL Cloudinary (alternative)',
              description: 'À utiliser si l’image est déjà hébergée sur Cloudinary.',
            }),
            alt: fields.text({
              label: 'Texte alternatif',
              description: 'Obligatoire : accessibilité + SEO + citations par les IA.',
              validation: { isRequired: true },
            }),
          }),
          {
            label: 'Images — 5 maximum',
            itemLabel: (props) => props.fields.alt.value || 'Nouvelle image',
          },
        ),

        estProduitPhare: fields.checkbox({
          label: 'Produit phare (mis en avant sur la Home)',
          description:
            'Si coché, le produit apparaît dans la section PETROVOLL de la page d’accueil, en grand format.',
          defaultValue: false,
        }),

        disponible: fields.checkbox({
          label: 'Disponible',
          description: 'Décocher pour afficher le badge « sur commande ».',
          defaultValue: true,
        }),
      },
    }),

    /* ──────────────────────────────────────────────────────────────────────
       COLLECTION : secteurs
       ──────────────────────────────────────────────────────────────────────
       5 entrées attendues : lubrifiants · transport · distribution ·
       pneumatiques · fournitures.
       TODO [cms] : initialiser ces 5 entrées depuis la console Keystatic
       (elles ne sont pas générées ici pour respecter « aucun contenu réel »).
       ─────────────────────────────────────────────────────────────────── */
    secteurs: collection({
      label: 'Secteurs',
      slugField: 'nom',
      path: 'src/content/secteurs/*',
      format: { contentField: 'description' },
      entryLayout: 'content',
      columns: ['nom', 'icone', 'couleur'],
      schema: {
        nom: fields.slug({
          name: {
            label: 'Nom du secteur',
            description: 'Ex. « Transport & logistique ».',
            validation: { isRequired: true },
          },
        }),

        description: fields.document({
          label: 'Description',
          description: 'Texte de présentation du métier (page /secteurs/<slug>).',
          dividers: true,
          links: true,
          images: true,
        }),

        icone: fields.text({
          label: 'Icône (nom Lucide)',
          description:
            'Nom EXACT de l’icône lucide.dev en PascalCase. Ex. Droplet, Truck, Globe, CircleDot, Paperclip.',
          defaultValue: 'Droplet',
          // TODO [cms] : le nom est converti en composant dans
          // src/components/home/SecteursGrid.astro via une map explicite
          // (évite d'embarquer tout lucide-react dans le bundle).
        }),

        couleur: fields.text({
          label: 'Couleur d’accent (hex)',
          description: 'Code hexadécimal. Ex. « #D4420A » (rouge PETROVOLL) ou « #F5A623 » (or).',
          defaultValue: '#D4420A',
          validation: { isRequired: true },
        }),
      },
    }),
  },

  /* ── Singletons (contenu unique, non listé) ──────────────────────────── */
  singletons: {
    /* ──────────────────────────────────────────────────────────────────────
       SINGLETON : parametresSite
       ──────────────────────────────────────────────────────────────────────
       Coordonnées et informations globales réutilisées par le footer, la page
       contact et les schémas JSON-LD (Organization / LocalBusiness).
       Fichier généré : src/content/parametresSite/index.yaml
       ─────────────────────────────────────────────────────────────────── */
    parametresSite: singleton({
      label: 'Paramètres du site',
      path: 'src/content/parametresSite/',
      schema: {
        nomSociete: fields.text({
          label: 'Nom de la société',
          defaultValue: 'PETROVOLL',
          validation: { isRequired: true },
        }),

        slogan: fields.text({
          label: 'Slogan',
          description: 'Phrase de positionnement courte (aussi utilisée en og:description).',
        }),

        telephone: fields.text({
          label: 'Téléphone',
          description: 'Format international affiché. Ex. « +225 00 00 00 00 ».',
        }),

        email: fields.text({
          label: 'Email de contact',
          description: 'Adresse commerciale affichée publiquement.',
        }),

        adresse: fields.text({
          label: 'Adresse',
          multiline: true,
          description: 'Adresse postale du siège (utilisée par le schema.org LocalBusiness).',
        }),

        reseauxSociaux: fields.array(
          fields.object({
            plateforme: fields.select({
              label: 'Plateforme',
              options: [
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'Facebook', value: 'facebook' },
                { label: 'Instagram', value: 'instagram' },
                { label: 'WhatsApp', value: 'whatsapp' },
                { label: 'YouTube', value: 'youtube' },
              ],
              defaultValue: 'linkedin',
            }),
            url: fields.url({ label: 'URL du profil' }),
          }),
          {
            label: 'Réseaux sociaux',
            itemLabel: (props) => props.fields.plateforme.value ?? 'Réseau',
          },
        ),
      },
    }),
  },
})