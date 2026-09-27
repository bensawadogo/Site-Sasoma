'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import MobileMenu from '@/components/layout/MobileMenu'
import { cn } from '@/lib/utils'
import type { LienNavigation } from '@/types'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Navbar — barre de navigation sticky du site public
 * ────────────────────────────────────────────────────────────────────────────
 * Comportements demandés par la charte :
 *   • sticky en haut de page
 *   • fond glassmorphism LÉGER qui n'apparaît qu'au scroll (`.navbar-scrolled`)
 *   • CTA « Demander un devis » toujours visible (parcours B2B)
 *
 * TODO [navbar] :
 *  - [ ] Remplacer le texte « PETROVOLL » par le logo SVG du client (next/image
 *        ou SVG inline, prévoir une variante monochrome pour le fond noir)
 *  - [ ] Sous-menu « Secteurs » alimenté par la collection Payload `secteurs`
 *        (les 5 slugs réels) — actuellement une valeur de démonstration
 *  - [ ] Fermer le menu mobile automatiquement au changement de route
 *        (usePathname + effet)
 *  - [ ] Piéger le focus clavier quand le menu mobile est ouvert (a11y)
 *  - [ ] Marquer le lien actif (aria-current="page")
 *  - [ ] Remplacer le composant état `scrolled` par `useScroll` de Framer Motion
 *        si l'on souhaite des transitions plus fines
 */
const LIENS: LienNavigation[] = [
  { label: 'Produits', href: '/produits' },
  // TODO [nav] : générer depuis Payload (5 secteurs) + sous-menu déroulant
  { label: 'Secteurs', href: '/secteurs/lubrifiants' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOuvert, setMenuOuvert] = useState(false)

  // Fond glassmorphism progressif à partir de 24 px de défilement
  useEffect(() => {
    const surScroll = () => setScrolled(window.scrollY > 24)
    surScroll()
    window.addEventListener('scroll', surScroll, { passive: true })
    return () => window.removeEventListener('scroll', surScroll)
  }, [])

  // TODO [a11y] : bloquer le scroll du body quand le menu mobile est ouvert
  // TODO [a11y] : fermer le menu avec la touche Échap

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'navbar-scrolled py-3' : 'border-b border-transparent py-5',
      )}
    >
      <nav className="container flex items-center justify-between gap-6" aria-label="Navigation principale">
        {/* Logo / marque */}
        <Link
          href="/"
          className="font-display text-2xl tracking-industrial text-white transition-colors hover:text-gold-400"
        >
          {/* TODO [branding] : logo SVG officiel */}
          PETROVOLL
        </Link>

        {/* Liens desktop */}
        <ul className="hidden items-center gap-8 lg:flex">
          {LIENS.map((lien) => (
            <li key={lien.href}>
              <Link
                href={lien.href}
                className="text-sm font-medium uppercase tracking-wide text-white/70 transition-colors hover:text-white"
              >
                {lien.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA + bouton menu mobile */}
        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="hidden rounded-sm bg-brand-500 px-5 py-2.5 text-sm font-semibold uppercase tracking-industrial text-white transition-colors hover:bg-brand-600 lg:inline-flex"
          >
            Demander un devis
          </Link>

          {/* TODO [ui] : utiliser le composant shadcn <Sheet /> pour le drawer mobile
              (voir components/ui/README.md) */}
          <button
            type="button"
            onClick={() => setMenuOuvert((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-sm border border-white/15 text-white lg:hidden"
            aria-expanded={menuOuvert}
            aria-controls="menu-mobile"
            aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {/* TODO [ui] : icônes lucide-react Menu / X */}
            <span aria-hidden className="text-lg leading-none">
              {menuOuvert ? '×' : '☰'}
            </span>
          </button>
        </div>
      </nav>

      {/* Menu mobile (drawer plein écran) */}
      <MobileMenu
        estOuvert={menuOuvert}
        onFermer={() => setMenuOuvert(false)}
        liens={LIENS}
      />
    </header>
  )
}