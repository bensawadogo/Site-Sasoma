import type { Metadata } from 'next'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * /contact — Contact & demande de devis B2B
 * ────────────────────────────────────────────────────────────────────────────
 * Deux parcours distincts (ouverture d'un compte distributeur vs demande
 * ponctuelle). Le formulaire doit rester court : sur mobile, chaque champ
 * supplémentaire fait chuter le taux de conversion.
 *
 * Champs prévus (cf. type DemandeDevis dans types/index.ts) :
 *   nom · entreprise · email · téléphone · pays · secteur concerné
 *   quantité estimée · message · consentement RGPD
 *
 * TODO [form] :
 *  - [ ] Composant client `DemandeDevisForm.tsx` (react-hook-form + zodResolver)
 *        → `use client`, shadcn Form/Input/Textarea/Select, états pending/success
 *  - [ ] Route handler POST `/api/contact` → validation zod côté serveur,
 *        insertion Prisma `DemandeDevis`, email à CONTACT_EMAIL_TO
 *  - [ ] Anti-spam : honeypot + rate-limiting par IP (ou Turnstile si besoin)
 *  - [ ] Message de confirmation clair + délai de réponse annoncé (48 h ouvrées)
 *  - [ ] Lien WhatsApp direct (NEXT_PUBLIC_WHATSAPP_NUMBER) — très utilisé en
 *        Afrique de l'Ouest pour les demandes commerciales
 *  - [ ] Carte Google Maps / OpenStreetMap (RGPD : charger après consentement)
 */
export const metadata: Metadata = {
  title: 'Contact & devis',
  description:
    'Contactez PETROVOLL pour un devis : huiles moteur et lubrifiants, transport & logistique, pneumatiques, fournitures de bureau. Réponse sous 48 h ouvrées.',
}

export default function ContactPage() {
  return (
    <div className="container py-16">
      <header className="mb-16 max-w-3xl">
        <p className="mb-3 font-display text-sm tracking-industrial text-brand-500">
          {/* TODO [contenu] : éditorialisable depuis Payload */}
          PARLONS DE VOTRE BESOIN
        </p>
        <h1 className="section-underline text-4xl text-white md:text-6xl">Contact & devis</h1>
        <p className="mt-6 text-base text-white/60">
          {/* TODO [contenu] : adapter si l'entreprise distingue les demandes
              distributeurs / clients finaux */}
          Demande de devis, partenariat distributeur ou question technique :
          l’équipe commerciale répond sous 48 h ouvrées.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        {/* Colonne formulaire — à extraire dans un composant client dédié */}
        <section className="glass rounded-lg p-8">
          <h2 className="text-2xl text-white">Demande de devis</h2>
          <p className="mt-3 text-sm text-white/60">
            {/* TODO [form] : remplacer ce bloc par <DemandeDevisForm /> */}
            Formulaire à implémenter (react-hook-form + zod + route /api/contact).
          </p>

          {/* Aperçu des champs attendus — simple repère visuel du squelette */}
          <ul className="mt-6 space-y-2 text-sm text-white/40">
            <li>• Nom et prénom*</li>
            <li>• Entreprise</li>
            <li>• Email professionnel*</li>
            <li>• Téléphone / WhatsApp*</li>
            <li>• Pays</li>
            <li>• Secteur concerné (lubrifiants, transport, pneumatiques…)</li>
            <li>• Quantité estimée / fréquence</li>
            <li>• Message*</li>
            <li>• Consentement au traitement des données*</li>
          </ul>
        </section>

        {/* Colonne coordonnées */}
        <aside className="space-y-6">
          <div className="glass rounded-lg p-8">
            <h2 className="text-xl text-white">Coordonnées</h2>
            {/* TODO [contenu] : brancher sur les réglages Payload (global `parametres-site`)
                pour éviter de coder en dur les coordonnées de l'entreprise */}
            <ul className="mt-4 space-y-3 text-sm text-white/60">
              <li>Siège social : à renseigner</li>
              <li>Commercial : à renseigner</li>
              <li>Email : à renseigner</li>
              <li>WhatsApp : à renseigner</li>
              <li>Horaires : à renseigner</li>
            </ul>
          </div>

          <div className="glass rounded-lg p-8">
            <h2 className="text-xl text-white">Zones desservies</h2>
            <p className="mt-4 text-sm text-white/60">
              {/* TODO [contenu] : liste des pays / villes couverts par la logistique */}
              Pays et villes desservis à préciser avec le client.
            </p>
          </div>

          {/* TODO [ui] : carte interactive (chargement conditionné au consentement) */}
        </aside>
      </div>
    </div>
  )
}