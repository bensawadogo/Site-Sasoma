import ContactCTA from '@/components/home/ContactCTA'
import HeroSection from '@/components/home/HeroSection'
import ProduitPhare from '@/components/home/ProduitPhare'
import SecteursGrid from '@/components/home/SecteursGrid'
import StatsSection from '@/components/home/StatsSection'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * app/(public)/page.tsx — Page d'accueil
 * ────────────────────────────────────────────────────────────────────────────
 * Ordre des sections (parcours de lecture B2B) :
 *   1. HeroSection   — scène 3D du bidon PETROVOLL + accroche + CTA
 *   2. ProduitPhare  — spotlight PETROVOLL (volontairement plus grand que le reste)
 *   3. SecteursGrid  — les 5 secteurs d'activité en cards
 *   4. StatsSection  — chiffres clés animés (tonnage, pays couverts, années…)
 *   5. ContactCTA    — demande de devis / contact direct
 *
 * TODO [data] :
 *  - [ ] Récupérer le produit phare côté serveur :
 *        `getPayload({ config }).find({ collection: 'produits',
 *         where: { estProduitPhare: { equals: true } }, limit: 1 })`
 *        puis passer le résultat en props à <ProduitPhare produit={…} />
 *  - [ ] Récupérer les 5 secteurs (locale FR, triés par `ordre`)
 *  - [ ] `export const revalidate = 3600` OU revalidation par tag/on-demand,
 *        déclenchée par les hooks afterChange des collections Payload
 *  - [ ] Aucune donnée réelle n'est branchée pour l'instant : composants en placeholder
 */
export default function HomePage() {
  return (
    <>
      {/* 1 — Hero plein écran : bidon 3D à droite, texte à gauche */}
      <HeroSection />

      {/* 2 — Produit phare : PETROVOLL, bloc nettement plus grand/mis en avant */}
      <ProduitPhare />

      {/* 3 — Les 5 secteurs d'activité */}
      <SecteursGrid />

      {/* 4 — Chiffres clés animés (count-up au scroll) */}
      <StatsSection />

      {/* 5 — Appel à l'action final : devis / contact */}
      <ContactCTA />
    </>
  )
}