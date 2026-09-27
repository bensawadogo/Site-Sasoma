'use client'

import { motion, useInView, type Variants } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'

import type { Produit } from '@/types'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ProduitPhare — Spotlight PETROVOLL (section produit vedette de la Home)
 * ────────────────────────────────────────────────────────────────────────────
 * CONTRAINTE DE DESIGN FORTE : cette section doit être VISIBLEMENT PLUS GRANDE
 * et plus travaillée que la grille produits standard.
 *   • typographie d'affichage XXL (Bebas Neue)
 *   • visuel du bidon en très grand + halo rouge/orange
 *   • fond noir premium (contraste volontaire avec les autres sections)
 *   • badge « PRODUIT PHARE » et caractéristiques clés
 *
 * Alimentation : produit dont `estProduitPhare === true` (collection Payload).
 *
 * TODO [data] :
 *  - [ ] Recevoir `produit` en props (chargé côté serveur dans app/(public)/page.tsx)
 *  - [ ] Afficher le nom réel, la marque PETROVOLL, la référence commerciale,
 *        le conditionnement et la disponibilité
 *  - [ ] Remplacer le visuel placeholder par la 1re image Cloudinary
 *        (next/image + preset `hero` + `sizes` adaptés)
 *  - [ ] Gérer le cas « aucun produit phare » (masquer la section proprement)
 *  - [ ] CTA : « Voir la fiche produit » + « Demander un devis »
 */

const conteneur: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

export interface ProduitPhareProps {
  /** Produit mis en vedette. Null tant que la data n'est pas câblée. */
  produit?: Produit | null
}

export default function ProduitPhare({ produit = null }: ProduitPhareProps) {
  const ref = useRef<HTMLElement>(null)
  // Animation jouée une seule fois, à l'entrée de la section dans le viewport
  const estVisible = useInView(ref, { once: true, margin: '-120px' })

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-y border-white/5 bg-ink-950"
      aria-labelledby="produit-phare-titre"
    >
      {/* Halo de mise en avant */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/20 blur-[140px]"
      />

      <motion.div
        variants={conteneur}
        initial="hidden"
        animate={estVisible ? 'visible' : 'hidden'}
        className="container relative grid items-center gap-16 py-20 lg:grid-cols-2 lg:py-32"
      >
        {/* ── Visuel principal (bidon PETROVOLL) ──────────────────────────── */}
        <motion.div
          variants={fadeInUp}
          className="relative order-2 flex items-center justify-center lg:order-1"
        >
          <div className="relative aspect-square w-full max-w-[560px]">
            {produit ? (
              <Image
                // TODO [data] : source réelle (preset Cloudinary `hero`)
                src="/images/placeholder-bidon.png"
                alt="Bidon d’huile moteur PETROVOLL"
                fill
                sizes="(max-width: 1024px) 90vw, 560px"
                className="object-contain"
              />
            ) : (
              // Placeholder du squelette : silhouette stylisée en attendant le visuel
              <div className="flex size-full items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
                <span className="font-display text-6xl tracking-industrial text-white/10">
                  PETROVOLL
                </span>
              </div>
            )}
          </div>

          {/* Échantillons de viscosité — TODO [catalogue] : données réelles */}
          <ul className="absolute -bottom-2 left-0 flex gap-2">
            {['15W-40', '20W-50', '10W-30'].map((viscosite) => (
              <li
                key={viscosite}
                className="rounded-sm border border-gold-400/30 bg-ink-900/80 px-3 py-1 font-display text-xs tracking-industrial text-gold-400 backdrop-blur"
              >
                {viscosite}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* ── Argumentaire de mise en avant ──────────────────────────────── */}
        <motion.div variants={fadeInUp} className="order-1 lg:order-2">
          <p className="mb-4 inline-flex items-center gap-2 rounded-sm bg-brand-500 px-3 py-1.5 font-display text-xs tracking-industrial text-white">
            PRODUIT PHARE
          </p>

          <h2 id="produit-phare-titre" className="text-4xl text-white md:text-6xl lg:text-7xl">
            {/* TODO [data] : nom réel du produit phare */}
            {produit?.nom ?? 'HUILE MOTEUR PETROVOLL'}
          </h2>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
            {/* TODO [data] : extrait réel (champ `extrait` du produit) */}
            Gamme de lubrifiants moteur conditionnés en bidons plastiques,
            formulés pour les conditions de roulage d’Afrique de l’Ouest :
            forte chaleur, poussière et kilométrages élevés.
          </p>

          {/* Caractéristiques clés — TODO [data] : champs produit réels */}
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-8">
            {[
              { libelle: 'Marque', valeur: produit?.marque ?? 'PETROVOLL' },
              { libelle: 'Référence', valeur: produit?.references ?? '—' },
              { libelle: 'Conditionnement', valeur: 'Bidon — à préciser' },
              {
                libelle: 'Disponibilité',
                valeur: produit?.disponible === false ? 'Hors stock' : 'En stock',
              },
            ].map((item) => (
              <div key={item.libelle}>
                <dt className="text-xs uppercase tracking-wide text-white/40">{item.libelle}</dt>
                <dd className="mt-1 text-sm font-medium text-white/90">{item.valeur}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-wrap gap-4">
            {/* TODO [data] : pointer vers /produits/<slug réel> */}
            <Link
              href="/produits"
              className="rounded-sm bg-brand-500 px-7 py-3.5 text-sm font-semibold uppercase tracking-industrial text-white transition-colors hover:bg-brand-600"
            >
              Voir la fiche produit
            </Link>
            <Link
              href="/contact"
              className="rounded-sm border border-gold-400/40 px-7 py-3.5 text-sm font-semibold uppercase tracking-industrial text-gold-400 transition-colors hover:bg-gold-400 hover:text-ink-900"
            >
              Demander un devis
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}