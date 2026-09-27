'use client'

import { motion, type Variants } from 'framer-motion'
import dynamic from 'next/dynamic'
import Link from 'next/link'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * HeroSection — Hero plein écran de la page d'accueil
 * ────────────────────────────────────────────────────────────────────────────
 * Mise en page imposée par la charte :
 *   • plein écran (hauteur viewport)
 *   • TEXTE À GAUCHE (accroche + CTA)
 *   • BIDON 3D À DROITE (scène R3F montée dynamiquement)
 *
 * `'use client'` est obligatoire car :
 *   1. Framer Motion anime l'entrée (fadeInUp + staggerChildren)
 *   2. `next/dynamic` avec `ssr: false` est requis pour Three.js/WebGL
 *
 * TODO [hero] :
 *  - [ ] Charger le produit phare depuis Payload et injecter sa baseline réelle
 *  - [ ] Fallback 2D (image Cloudinary du bidon) si NEXT_PUBLIC_DISABLE_3D=true
 *        ou si WebGL est indisponible (détection côté client)
 *  - [ ] Vidéo de fond optionnelle (public/videos) — attention au poids en 3G
 *  - [ ] Badge de confiance sous le CTA (licences, années d'activité)
 *  - [ ] Suivre le taux de clic « Demander un devis » (KPI principal)
 */

// Montage client uniquement : Three.js a besoin de window/WebGL.
const BidonScene = dynamic(() => import('@/components/3d/BidonScene'), {
  ssr: false,
  loading: () => (
    // Squelette de chargement pendant le téléchargement du chunk 3D
    <div className="flex h-full w-full items-center justify-center">
      <div className="size-48 animate-pulse rounded-full bg-brand-500/10 blur-2xl" />
    </div>
  ),
})

/* ── Variantes d'animation (à mutualiser dans lib/animations.ts plus tard) ── */
const conteneur: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function HeroSection() {
  return (
    <section
      className="relative flex min-h-[calc(100dvh-5rem)] items-center overflow-hidden bg-petrovoll-gradient"
      aria-labelledby="hero-titre"
    >
      {/* Halos industriels (rouge + or) en arrière-plan */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-radial" />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/2 h-64 w-[80%] -translate-x-1/2 rounded-full bg-brand-500/10 blur-[120px]"
      />

      <div className="container relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        {/* ── Colonne texte (gauche) ─────────────────────────────────────────── */}
        <motion.div variants={conteneur} initial="hidden" animate="visible">
          {/* Bandeau de marque */}
          <motion.p
            variants={fadeInUp}
            className="mb-5 inline-flex items-center gap-2 rounded-sm border border-gold-400/30 bg-gold-400/5 px-3 py-1.5 font-display text-xs tracking-industrial text-gold-400"
          >
            {/* TODO [contenu] : libellé éditorialisable depuis Payload */}
            LUBRIFIANTS · TRANSPORT · DISTRIBUTION
          </motion.p>

          <motion.h1
            variants={fadeInUp}
            id="hero-titre"
            className="text-5xl leading-[0.95] text-white sm:text-6xl lg:text-7xl xl:text-8xl"
          >
            {/* TODO [contenu] : accroche validée par le client.
                Titres en Bebas Neue (majuscules, impact industriel). */}
            L’ÉNERGIE QUI
            <br />
            <span className="text-brand-500">FAIT AVANCER</span>
            <br />
            VOS MACHINES
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mt-7 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg"
          >
            {/* TODO [contenu] : paragraphe de positionnement (2 lignes max) */}
            Huiles moteur et lubrifiants PETROVOLL, logistique, import-export,
            pneumatiques et fournitures de bureau — un partenaire unique pour
            tous vos approvisionnements en Afrique de l’Ouest.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/produits"
              className="rounded-sm bg-brand-500 px-7 py-3.5 text-sm font-semibold uppercase tracking-industrial text-white transition-colors hover:bg-brand-600"
            >
              Découvrir le catalogue
            </Link>
            <Link
              href="/contact"
              className="rounded-sm border border-white/20 px-7 py-3.5 text-sm font-semibold uppercase tracking-industrial text-white transition-colors hover:border-gold-400 hover:text-gold-400"
            >
              Demander un devis
            </Link>
          </motion.div>

          {/* Micro-preuves — TODO [data] : valeurs réelles depuis Payload */}
          <motion.dl variants={fadeInUp} className="mt-12 flex flex-wrap gap-10">
            {[
              { libelle: 'Références produits', valeur: '—' },
              { libelle: 'Pays desservis', valeur: '—' },
              { libelle: 'Clients B2B', valeur: '—' },
            ].map((item) => (
              <div key={item.libelle}>
                <dt className="text-xs uppercase tracking-wide text-white/40">{item.libelle}</dt>
                <dd className="font-display text-3xl text-gold-400">{item.valeur}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* ── Colonne 3D (droite) — scène R3F du bidon PETROVOLL ─────────────
            NOTE : `canvas-3d` est masqué par la classe `.no-webgl` de
            globals.css → permet un basculement propre vers le fallback 2D.
            TODO [3d] : ajouter ici le <Image /> de secours (visuel Cloudinary
            du bidon) affiché si la 3D est désactivée. */}
        <div className="canvas-3d relative h-[420px] w-full sm:h-[520px] lg:h-[640px]">
          <BidonScene />
        </div>

        {/* TODO [ui] : indicateur de scroll animé en bas de section */}
      </div>
    </section>
  )
}