import type { Metadata } from 'next'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * /a-propos — Présentation de l'entreprise
 * ────────────────────────────────────────────────────────────────────────────
 * Sections prévues (à rédiger / brancher) :
 *   1. Narrative du groupe (création, ancrage Afrique de l'Ouest, croissance)
 *   2. Les 5 métiers (rappel des secteurs avec renvoi vers /secteurs/<slug>)
 *   3. Chiffres clés (réutiliser StatsSection ou une variante « corporate »)
 *   4. Valeurs / engagements (qualité des lubrifiants, traçabilité, HSE)
 *   5. Certifications & licences (documents fournis par le client)
 *   6. Couverture géographique (carte des pays desservis)
 *   7. Équipe dirigeante (portraits + fonctions) — validation RGPD nécessaire
 *
 * TODO [contenu] :
 *  - [ ] Rendre ces blocs éditorialisables dans Payload (collection `pages`
 *        ou globals) plutôt que codés en dur → demander une validation client
 *  - [ ] Prévoir la version anglaise si l'activité s'étend hors zone francophone
 *  - [ ] Insérer les mentions légales réellement applicables par pays
 *        (RCCM, IFU, numéro d'importateur) dans le footer
 */
export const metadata: Metadata = {
  title: 'À propos',
  description:
    'Qui sommes-nous : groupe de distribution multi-secteurs en Afrique de l’Ouest, huiles moteur et lubrifiants PETROVOLL, transport, import-export, pneumatiques et fournitures.',
}

export default function AProposPage() {
  return (
    <div className="container py-16">
      <header className="mb-16 max-w-3xl">
        <p className="mb-3 font-display text-sm tracking-industrial text-brand-500">
          {/* TODO [contenu] : éditorialisable depuis Payload */}
          NOTRE GROUPE
        </p>
        <h1 className="section-underline text-4xl text-white md:text-6xl">À propos</h1>
        <p className="mt-6 text-base text-white/60">
          {/* TODO [contenu] : remplacer par le récit réel de l'entreprise */}
          Texte de présentation à connecter (histoire, implantation, capacité logistique,
          réseau de distribution).
        </p>
      </header>

      {/* TODO [ui] : SectionNarrative.tsx — texte riche (rendu `prose prose-invert`) */}
      <section className="mb-20 grid gap-10 lg:grid-cols-2">
        <div className="glass rounded-lg p-8">
          <h2 className="text-2xl text-white">Nos métiers</h2>
          <p className="mt-4 text-sm text-white/60">
            {/* TODO [ui] : réutiliser SecteursGrid avec une variante compacte */}
            Les 5 secteurs du groupe à présenter ici (renvoi vers /secteurs/…).
          </p>
        </div>
        <div className="glass rounded-lg p-8">
          <h2 className="text-2xl text-white">Nos engagements</h2>
          <p className="mt-4 text-sm text-white/60">
            {/* TODO [contenu] : qualité produits, HSE, traçabilité, service client */}
            Valeurs et engagements à rédiger avec le client.
          </p>
        </div>
      </section>

      {/* TODO [ui] : SectionChiffres.tsx (réutiliser StatsSection) */}
      <section className="mb-20">
        <h2 className="text-3xl text-white">Notre couverture</h2>
        <p className="mt-4 max-w-2xl text-sm text-white/60">
          {/* TODO [ui] : carte des pays desservis (SVG ou lib statique, éviter
              une dépendance lourde type mapbox pour le marché mobile) */}
          Carte / liste des zones desservies à intégrer.
        </p>
      </section>

      {/* TODO [ui] : SectionDocuments.tsx — licences et certifications (PDF) */}
      <section>
        <h2 className="text-3xl text-white">Licences & certifications</h2>
        <p className="mt-4 max-w-2xl text-sm text-white/60">
          {/* TODO [contenu] : le client fournira les licences (import, distribution,
              transport de matières dangereuses le cas échéant) */}
          Documents à publier (PDF) une fois fournis par le client.
        </p>
      </section>
    </div>
  )
}