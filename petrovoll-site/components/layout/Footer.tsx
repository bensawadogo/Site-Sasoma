import Link from 'next/link'

import type { LienNavigation } from '@/types'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Footer — pied de page du site public
 * ────────────────────────────────────────────────────────────────────────────
 * Composant serveur (aucun état) → reste hors du bundle client.
 *
 * Contenu prévu :
 *   • Rappel des 5 secteurs d'activité
 *   • Navigation secondaire (à propos, contact, mentions légales)
 *   • Coordonnées (siège, commercial, WhatsApp) + réseaux sociaux
 *   • Inscription newsletter (champ email → route /api/newsletter à créer)
 *   • Mentions légales : RCCM / IFU / n° d'importateur selon les pays d'exercice
 *
 * TODO [footer] :
 *  - [ ] Brancher les coordonnées sur un global Payload `parametres-site`
 *        (éviter tout contenu codé en dur, le client doit pouvoir l'éditer)
 *  - [ ] Créer les pages /mentions-legales et /politique-confidentialite
 *  - [ ] Intégrer le formulaire newsletter (composant client + validation zod)
 *  - [ ] Icônes sociales en SVG inline (éviter une dépendance d'icônes lourde)
 *  - [ ] Vérifier le contraste des textes secondaires (WCAG AA)
 *  - [ ] Afficher la mention de licence professionnelle si imposée par le pays
 */
const LIENS_ENTREPRISE: LienNavigation[] = [
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact & devis', href: '/contact' },
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'Politique de confidentialité', href: '/politique-confidentialite' },
]

const LIENS_SECTEURS: LienNavigation[] = [
  { label: 'Huile moteur & lubrifiants', href: '/secteurs/lubrifiants' },
  { label: 'Transport & logistique', href: '/secteurs/transport-logistique' },
  { label: 'Distribution & import-export', href: '/secteurs/distribution-import-export' },
  { label: 'Pneumatiques', href: '/secteurs/pneumatiques' },
  { label: 'Fournitures de bureau', href: '/secteurs/fournitures-bureau' },
]

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-ink-950">
      <div className="container grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        {/* Marque */}
        <div>
          <p className="font-display text-3xl tracking-industrial text-white">PETROVOLL</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
            {/* TODO [contenu] : phrase de positionnement validée par le client */}
            Groupe de distribution multi-secteurs en Afrique de l’Ouest :
            lubrifiants, transport, import-export, pneumatiques et fournitures.
          </p>
          {/* TODO [social] : LinkedIn / Facebook / WhatsApp en SVG inline */}
        </div>

        {/* Secteurs */}
        <nav aria-label="Secteurs d’activité">
          <h2 className="mb-5 font-display text-sm tracking-industrial text-gold-400">
            SECTEURS
          </h2>
          <ul className="space-y-3">
            {LIENS_SECTEURS.map((lien) => (
              <li key={lien.href}>
                <Link
                  href={lien.href}
                  className="text-sm text-white/60 transition-colors hover:text-white"
                >
                  {lien.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Entreprise */}
        <nav aria-label="Informations">
          <h2 className="mb-5 font-display text-sm tracking-industrial text-gold-400">
            ENTREPRISE
          </h2>
          <ul className="space-y-3">
            {LIENS_ENTREPRISE.map((lien) => (
              <li key={lien.href}>
                <Link
                  href={lien.href}
                  className="text-sm text-white/60 transition-colors hover:text-white"
                >
                  {lien.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact / newsletter */}
        <div>
          <h2 className="mb-5 font-display text-sm tracking-industrial text-gold-400">
            CONTACT
          </h2>
          {/* TODO [data] : coordonnées réelles issues du global Payload */}
          <ul className="space-y-3 text-sm text-white/60">
            <li>Siège social : à renseigner</li>
            <li>Téléphone : à renseigner</li>
            <li>Email : à renseigner</li>
          </ul>

          {/* TODO [newsletter] : extraire en composant client <NewsletterForm /> */}
          <div className="mt-6">
            <label htmlFor="newsletter-email" className="sr-only">
              Adresse email pour la newsletter
            </label>
            <input
              id="newsletter-email"
              type="email"
              disabled
              placeholder="Newsletter — bientôt disponible"
              className="w-full rounded-sm border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Barre légale */}
      <div className="border-t border-white/5">
        <div className="container flex flex-col gap-2 py-6 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          {/* TODO [légal] : RCCM / IFU / numéro d'importateur à insérer ici */}
          <p>© {new Date().getFullYear()} PETROVOLL — Tous droits réservés.</p>
          <p>Mentions légales et identifiants d’entreprise à compléter.</p>
        </div>
      </div>
    </footer>
  )
}