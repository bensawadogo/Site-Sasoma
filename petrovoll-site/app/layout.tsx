import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Inter } from 'next/font/google'
import type { ReactNode } from 'react'

// Feuille de styles globale (Tailwind + design tokens PETROVOLL)
import '@/styles/globals.css'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * app/layout.tsx — Layout racine (obligatoire, englobe TOUTES les routes)
 * ────────────────────────────────────────────────────────────────────────────
 * Chargement des deux polices du design system :
 *   • Inter      → texte courant (variable CSS --font-sans)
 *   • Bebas Neue → titres impactants (variable CSS --font-display)
 * Les variables sont consommées par tailwind.config.ts (theme.fontFamily).
 *
 * ⚠️  `next/font/google` télécharge les polices AU BUILD : si le serveur CI n'a
 *     pas d'accès réseau, prévoir un self-hosting (next/font/local) avec les
 *     fichiers .woff2 dans /public/fonts.
 *
 * TODO [seo] :
 *  - [ ] Renseigner metadataBase avec NEXT_PUBLIC_SITE_URL (URLs OG absolues)
 *  - [ ] Compléter openGraph / twitter avec les visuels de marque
 *  - [ ] Ajouter les balises de vérification (Google Search Console)
 *  - [ ] Prévoir les versions anglaises (hreflang) si ouverture régionale
 * TODO [analytics] : brancher le script de mesure (GA4 / Matomo) après
 *      consentement cookies (bandeau à créer, voir components/layout).
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'PETROVOLL — Lubrifiants, transport, distribution en Afrique de l’Ouest',
    template: '%s | PETROVOLL',
  },
  description:
    'Groupe de distribution multi-secteurs : huiles moteur et lubrifiants PETROVOLL, transport & logistique, import-export, pneumatiques et fournitures de bureau.',
  applicationName: 'PETROVOLL',
  // TODO [seo] : metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!)
  keywords: [
    // Placeholders — à valider avec la stratégie SEO du client
    'PETROVOLL',
    'huile moteur',
    'lubrifiants',
    'distribution Afrique de l’Ouest',
    'transport logistique',
    'pneumatiques',
  ],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    // TODO [branding] : déposer favicon.ico / icon.png / apple-icon.png dans app/
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  // Cohérent avec le noir profond de la charte (#0A0A0A)
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  // TODO [a11y] : ne pas bloquer le zoom (accessibilité WCAG 1.4.4)
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${bebasNeue.variable}`}>
      <body className="min-h-dvh bg-ink-900 font-sans text-white antialiased">
        {/*
          TODO [layout] :
           - [ ] Ajouter ici les providers globaux (ThemeProvider shadcn,
                 SessionProvider NextAuth si utilisé côté client)
           - [ ] Ajouter le bandeau cookies (RGPD) — le site est exposé en UE ? 
           - [ ] Ajouter <Toaster /> (shadcn) pour les retours de formulaire
        */}
        {children}
      </body>
    </html>
  )
}