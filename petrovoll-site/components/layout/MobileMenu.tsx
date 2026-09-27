'use client'

import Link from 'next/link'

import type { LienNavigation } from '@/types'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MobileMenu — drawer de navigation mobile
 * ────────────────────────────────────────────────────────────────────────────
 * Contexte marché : la majorité du trafic en Afrique de l'Ouest est mobile
 * (souvent en 3G/4G) → ce menu doit rester léger (pas d'animation coûteuse,
 * pas de librairie supplémentaire) et grouper les accès commerciaux en évidence.
 *
 * TODO [mobile] :
 *  - [ ] Animer l'ouverture/fermeture avec Framer Motion
 *        (AnimatePresence + variantes `staggerChildren` sur les liens)
 *  - [ ] Retour visuel tactile (active:) sur chaque lien
 *  - [ ] Ajouter l'accès direct WhatsApp et l'appel téléphonique
 *        (les deux canaux de conversion principaux sur mobile)
 *  - [ ] Piéger le focus + rendre le fond cliquable pour fermer
 *  - [ ] Gérer le safe-area (encoche iOS) : padding-bottom: env(safe-area-inset-bottom)
 */
export interface MobileMenuProps {
  estOuvert: boolean
  onFermer: () => void
  liens: LienNavigation[]
}

export default function MobileMenu({ estOuvert, onFermer, liens }: MobileMenuProps) {
  // Tant que le menu est fermé, on ne monte rien (perf + accessibilité : pas de
  // liens fantômes accessibles au clavier).
  if (!estOuvert) return null

  return (
    <div
      id="menu-mobile"
      className="border-t border-white/10 bg-ink-950/95 backdrop-blur-md lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navigation"
    >
      <ul className="container flex flex-col gap-1 py-6">
        {liens.map((lien) => (
          <li key={lien.href}>
            <Link
              href={lien.href}
              onClick={onFermer}
              className="block border-b border-white/5 py-4 font-display text-2xl tracking-industrial text-white/90 transition-colors hover:text-gold-400"
            >
              {lien.label}
            </Link>
          </li>
        ))}

        {/* CTA commercial */}
        <li className="pt-4">
          <Link
            href="/contact"
            onClick={onFermer}
            className="block rounded-sm bg-brand-500 px-5 py-3.5 text-center text-sm font-semibold uppercase tracking-industrial text-white"
          >
            Demander un devis
          </Link>
        </li>
      </ul>

      {/* TODO [mobile] : afficher ici les coordonnées directes
          (tel:, WhatsApp, email) provenant des réglages Payload */}
    </div>
  )
}