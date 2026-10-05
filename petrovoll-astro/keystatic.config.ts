import { collection, config, fields, singleton } from '@keystatic/core'

import { ICONES_SECTEUR } from './src/lib/icones'

/**
 * keystatic.config.ts — panneau d'administration du client (/keystatic).
 *
 * Écrit pour une personne qui n'est PAS informaticienne et qui modifie son site
 * depuis son téléphone : libellés en français, une aide sous chaque champ,
 * aucun code à saisir (ni couleur hexadécimale, ni nom d'icône technique).
 *
 * Chaque « Enregistrer » crée un commit sur GitHub ; Cloudflare Pages
 * reconstruit alors le site (1 à 2 minutes). Le schéma Astro qui relit ces
 * fichiers (src/content.config.ts) est volontairement TOLÉRANT : une saisie
 * incomplète ne doit jamais casser la mise en ligne.
 *
 * Stockage :
 *   - PUBLIC_KEYSTATIC_PROJECT défini → Keystatic Cloud (connexion par e-mail)
 *   - sinon                           → fichiers locaux (développement)
 */

const projetCloud = import.meta.env.PUBLIC_KEYSTATIC_PROJECT as string | undefined

/** Numéro saisi avec l'indicatif (+226 ou 00226), espaces, points et tirets tolérés. */
const NUMERO = {
  regex: /^\s*(\+|00)?[\d\s.-]{8,}$/,
  message: 'Numéro avec l’indicatif, ex. « +226 70 00 00 00 ».',
}
/** Même règle, mais le champ peut rester vide. */
const NUMERO_FACULTATIF = { ...NUMERO, regex: /^\s*$|^\s*(\+|00)?[\d\s.-]{8,}$/ }

/** Texte riche réduit à l'essentiel : moins d'options = moins d'erreurs. */
const TEXTE_RICHE = {
  bold: true,
  italic: true,
  heading: [2, 3] as const,
  unorderedList: true,
  orderedList: true,
  link: true,
  strikethrough: false,
  code: false,
  codeBlock: false,
  blockquote: false,
  table: false,
  divider: false,
  image: false,
}

/* Les images sont rangées dans src/assets (optimisées au build par Astro) ;
   le chemin enregistré est relatif au fichier de contenu, ce qu'attend le
   schéma `image()` d'Astro. */
const photo = (label: string, dossier: string, description?: string) =>
  fields.image({
    label,
    description,
    directory: `src/assets/${dossier}`,
    publicPath: `../../assets/${dossier}/`,
    validation: { isRequired: true },
  })

export default config({
  storage: projetCloud ? { kind: 'cloud' } : { kind: 'local' },
  ...(projetCloud ? { cloud: { project: projetCloud } } : {}),
  locale: 'fr-FR', // boutons de l'interface (Enregistrer, Ajouter…) en français

  ui: {
    brand: { name: 'Mon site SASOMA' },
    navigation: {
      Catalogue: ['produits', 'secteurs'],
      Pages: ['accueil', 'aPropos', 'mentionsLegales'],
      Réglages: ['parametresSite'],
    },
  },

  collections: {
    produits: collection({
      label: 'Produits',
      slugField: 'nom',
      path: 'src/content/produits/*',
      format: { contentField: 'description' },
      columns: ['nom', 'prix'],
      schema: {
        nom: fields.slug({
          name: {
            label: 'Nom du produit',
            description: 'Ex. « Huile moteur Petrovöll STÄRK 5W-30 — bidon 5 L »',
            validation: { isRequired: true },
          },
          slug: {
            label: 'Adresse de la page',
            description: 'Remplie automatiquement à partir du nom. Inutile d’y toucher.',
          },
        }),
        secteur: fields.relationship({
          label: 'Secteur',
          description: 'Rubrique du catalogue dans laquelle le produit apparaît.',
          collection: 'secteurs',
          validation: { isRequired: true },
        }),
        prix: fields.integer({
          label: 'Prix (FCFA)',
          description: 'Chiffres uniquement, sans espace ni point. Ex. 12500. Laisser vide pour afficher « Prix sur demande ».',
          validation: { min: 0 },
        }),
        conditionnement: fields.text({
          label: 'Format',
          description: 'Ex. « Bidon 5 L », « Carton de 12 », « Pneu 195/65 R15 ».',
        }),
        photos: fields.array(photo('Photo', 'produits'), {
          label: 'Photos',
          description: '5 photos maximum. La première est la photo principale. Une photo prise au téléphone convient : elle est allégée automatiquement.',
          itemLabel: (props) => (props.value ? `Photo (${props.value.filename})` : 'Nouvelle photo'),
          validation: { length: { max: 5 } },
        }),
        disponible: fields.checkbox({
          label: 'En stock',
          description: 'Décocher si le produit est momentanément indisponible : la page affichera « Sur commande ».',
          defaultValue: true,
        }),
        enAvant: fields.checkbox({
          label: 'Mettre en avant sur la page d’accueil',
          description: 'Un seul produit à la fois : c’est le premier coché qui est affiché.',
          defaultValue: false,
        }),
        marque: fields.text({ label: 'Marque', defaultValue: 'Petrovöll' }),
        reference: fields.text({
          label: 'Référence (facultatif)',
          description: 'Code interne du produit, s’il y en a un.',
        }),
        description: fields.markdoc({
          label: 'Description',
          description: 'Caractéristiques, usages, avantages…',
          options: TEXTE_RICHE,
        }),
      },
    }),

    secteurs: collection({
      label: 'Secteurs d’activité',
      slugField: 'nom',
      path: 'src/content/secteurs/*',
      format: { contentField: 'description' },
      columns: ['nom', 'ordre'],
      schema: {
        nom: fields.slug({
          name: {
            label: 'Nom du secteur',
            description: 'Ex. « Transport & logistique ».',
            validation: { isRequired: true },
          },
          slug: {
            label: 'Adresse de la page',
            description: 'Remplie automatiquement à partir du nom. Inutile d’y toucher.',
          },
        }),
        icone: fields.select({
          label: 'Icône',
          options: ICONES_SECTEUR.map(({ value, label }) => ({ value, label })),
          defaultValue: 'boite',
        }),
        ordre: fields.integer({
          label: 'Position',
          description: '1 = affiché en premier sur la page d’accueil.',
          defaultValue: 10,
        }),
        resume: fields.text({
          label: 'Phrase de présentation',
          description: 'Une ou deux phrases, affichées sur la carte du secteur en page d’accueil.',
          multiline: true,
        }),
        image: fields.image({
          label: 'Photo de couverture',
          description: 'Affichée sur la carte du secteur (accueil) et en haut de sa page. Une photo de téléphone convient.',
          directory: 'src/assets/secteurs',
          publicPath: '../../assets/secteurs/',
        }),
        description: fields.markdoc({
          label: 'Présentation complète',
          description: 'Texte de la page du secteur.',
          options: TEXTE_RICHE,
        }),
      },
    }),
  },

  singletons: {
    accueil: singleton({
      label: 'Page d’accueil',
      path: 'src/content/accueil/',
      // Le hero (animation du haut de page) ne se règle PAS ici : src/hero.config.ts.
      schema: {
        chiffres: fields.array(
          fields.object({
            valeur: fields.text({
              label: 'Chiffre',
              description: 'Ex. « 15 », « 500+ », « 24 h ».',
              validation: { isRequired: true },
            }),
            libelle: fields.text({
              label: 'Légende',
              description: 'Ex. « années d’expérience ».',
              validation: { isRequired: true },
            }),
          }),
          {
            label: 'Chiffres clés',
            description: 'Uniquement des chiffres vrais. Laisser vide pour masquer la section.',
            itemLabel: (props) => `${props.fields.valeur.value} ${props.fields.libelle.value}`.trim() || 'Nouveau chiffre',
            validation: { length: { max: 4 } },
          },
        ),
        appelTitre: fields.text({
          label: 'Encadré « devis » — titre',
          defaultValue: 'Besoin d’un devis professionnel ?',
        }),
        appelTexte: fields.text({ label: 'Encadré « devis » — texte', multiline: true }),
      },
    }),

    aPropos: singleton({
      label: 'Page « À propos »',
      path: 'src/content/pages/a-propos',
      format: { contentField: 'contenu' },
      schema: {
        titre: fields.text({
          label: 'Titre de la page',
          defaultValue: 'Qui sommes-nous ?',
          validation: { isRequired: true },
        }),
        contenu: fields.markdoc({ label: 'Texte de la page', options: TEXTE_RICHE }),
      },
    }),

    mentionsLegales: singleton({
      label: 'Mentions légales',
      path: 'src/content/pages/mentions-legales',
      format: { contentField: 'contenu' },
      schema: {
        titre: fields.text({
          label: 'Titre de la page',
          defaultValue: 'Mentions légales',
          validation: { isRequired: true },
        }),
        contenu: fields.markdoc({
          label: 'Texte de la page',
          description: 'Raison sociale, RCCM, IFU, responsable de publication, hébergeur, données personnelles.',
          options: TEXTE_RICHE,
        }),
      },
    }),

    parametresSite: singleton({
      label: 'Coordonnées et réseaux',
      path: 'src/content/parametresSite/',
      schema: {
        nomSociete: fields.text({
          label: 'Nom de l’entreprise',
          defaultValue: 'SASOMA',
          validation: { isRequired: true },
        }),
        slogan: fields.text({
          label: 'Phrase de présentation',
          description: 'Affichée en bas de chaque page et dans les résultats Google.',
          multiline: true,
        }),
        telephone: fields.text({
          label: 'Téléphone',
          description: 'Avec l’indicatif. Ex. « +226 70 00 00 00 ». Obligatoire : c’est le contact de secours du site.',
          validation: { isRequired: true, pattern: NUMERO },
        }),
        whatsapp: fields.text({
          label: 'Numéro WhatsApp',
          description: 'Avec l’indicatif. Ex. « +226 70 00 00 00 ». Laisser vide pour masquer les boutons WhatsApp.',
          validation: { pattern: NUMERO_FACULTATIF },
        }),
        email: fields.text({ label: 'E-mail affiché sur le site' }),
        adresse: fields.text({ label: 'Adresse', multiline: true }),
        horaires: fields.text({
          label: 'Horaires d’ouverture',
          description: 'Ex. « Lun–Ven 8h–18h, Sam 8h–13h ».',
          multiline: true,
        }),
        reseauxSociaux: fields.array(
          fields.object({
            plateforme: fields.select({
              label: 'Réseau',
              options: [
                { label: 'Facebook', value: 'facebook' },
                { label: 'Instagram', value: 'instagram' },
                { label: 'TikTok', value: 'tiktok' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'YouTube', value: 'youtube' },
              ],
              defaultValue: 'facebook',
            }),
            url: fields.url({
              label: 'Lien de la page',
              description: 'Copier l’adresse de la page depuis l’application du réseau.',
              validation: { isRequired: true },
            }),
          }),
          {
            label: 'Réseaux sociaux',
            itemLabel: (props) => props.fields.plateforme.value,
          },
        ),
        rccm: fields.text({ label: 'N° RCCM (facultatif)' }),
        ifu: fields.text({ label: 'N° IFU (facultatif)' }),
      },
    }),
  },
})
