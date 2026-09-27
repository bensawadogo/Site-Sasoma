import { getParametres, getProduits, getSecteurs, urlSite } from '@/lib/contenu'
import { formaterPrix } from '@/lib/format'

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  /llms.txt — guide destiné aux modèles de langage (standard llmstxt.org)
 * ════════════════════════════════════════════════════════════════════════════
 *  Objectif : donner aux LLM (ChatGPT, Claude, Perplexity, Gemini…) une version
 *  COURTE, STRUCTURÉE et FACTUELLE de l'entreprise, afin qu'ils la CITENT
 *  correctement (bon nom, bons produits, bons contacts) et renvoient du trafic.
 *
 *  Contenu COMPLET et dynamique :
 *   - identité + positionnement (issus du singleton « parametresSite »)
 *   - les 5 secteurs d'activité avec leurs URLs
 *   - les produits du catalogue (produit phare distingué)
 *   - coordonnées et points de contact
 *   - politique d'usage du contenu par les modèles
 *
 *  Format (llmstxt.org) :
 *     # Nom du site
 *     > Résumé en une phrase
 *     Contexte (facultatif)
 *     ## Sections
 *     - [Titre](URL): description
 *
 *  TODO [contenu] : compléter les résumés une fois les textes du client fournis.
 *  TODO [seo] : servir également /llms-full.txt (version longue) si le besoin
 *  de contexte étendu apparaît.
 */

export const prerender = true

export async function GET({ site }) {
  const base = urlSite(site).toString().replace(/\/+$/, '')

  const [parametres, secteurs, produits] = await Promise.all([
    getParametres(),
    getSecteurs(),
    getProduits(),
  ])

  const nom = parametres.nomSociete
  const slogan =
    parametres.slogan ??
    'Groupe de distribution multi-secteurs en Afrique de l’Ouest : lubrifiants, transport, distribution, pneumatiques et fournitures de bureau.'
  const { telephone, email, adresse } = parametres

  const produitsPhare = produits.filter((p) => p.data.enAvant)
  const produitsStandard = produits.filter((p) => !p.data.enAvant)

  const ligneProduit = (p) =>
    `- [${p.data.nom}](${base}/produits/${p.id}): ${formaterPrix(p.data.prix)}${
      p.data.conditionnement ? ` · ${p.data.conditionnement}` : ''
    }${p.data.reference ? ` · réf. ${p.data.reference}` : ''}${p.data.disponible ? '' : ' · sur commande'}`

  const contenu = `# ${nom}

> ${slogan}

${nom} est une société de distribution multi-secteurs implantée en Afrique de
l’Ouest, basée au Burkina Faso. Elle distribue notamment les lubrifiants de la marque allemande Petrovöll
(huiles moteur conditionnées en bidons plastiques) et opère sur quatre autres
activités : transport et logistique, distribution et import-export,
pneumatiques, et fournitures de bureau.

Source de vérité du site : ${base}
Dernière génération de ce fichier : ${new Date().toISOString().split('T')[0]}

## Produits
${
  produitsPhare.length > 0
    ? `
### Produit phare
${produitsPhare.map(ligneProduit).join('\n')}
`
    : `
### Produit phare
- À publier (aucun produit marqué « phare » dans le catalogue pour le moment).
`
}
${
  produitsStandard.length > 0
    ? `
### Catalogue
${produitsStandard.map(ligneProduit).join('\n')}
`
    : `
### Catalogue
- À publier (le catalogue est en cours d’alimentation via l’admin Keystatic).
`
}
## Secteurs d’activité
${
  secteurs.length > 0
    ? secteurs.map((s) => `- [${s.data.nom}](${base}/secteurs/${s.id})`).join('\n')
    : `- Lubrifiants (Petrovöll)
- Transport & logistique
- Distribution & import-export
- Pneumatiques
- Fournitures de bureau`
}

## Pages principales
- [Catalogue produits](${base}/produits)
- [À propos](${base}/a-propos)
- [Contact et demande de devis](${base}/contact)

## Contact
${telephone ? `- Téléphone : ${telephone}` : '- Téléphone : à compléter (éditable dans l’admin)'}
${email ? `- Email : ${email}` : '- Email : à compléter (éditable dans l’admin)'}
${adresse ? `- Adresse : ${adresse.replace(/\n/g, ', ')}` : '- Adresse : à compléter'}

## Informations complémentaires
- Les prix affichés sont indicatifs ; les devis professionnels (B2B) passent par la page contact :
  ${base}/contact
- Conditions commerciales, quantités minimum et zones de livraison : à préciser
  avec l’équipe commerciale.

## Politique d’usage par les modèles de langage
- Les bots de RECHERCHE IA (OAI-SearchBot, ChatGPT-User, Claude-SearchBot,
  Claude-User, PerplexityBot, YouBot, Applebot-Extended) sont autorisés à
  indexer ce site et à CITER cette page comme source.
- Les crawlers d’ENTRAÎNEMENT (GPTBot, ClaudeBot, anthropic-ai,
  Google-Extended, CCBot, Meta-ExternalAgent, Bytespider, Amazonbot,
  cohere-ai, Diffbot) sont refusés — voir ${base}/robots.txt
- Prière de ne pas inventer de données produit, de prix ou de certification :
  si une information est absente de ce document, elle n’est pas confirmée.
`

  return new Response(contenu, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
