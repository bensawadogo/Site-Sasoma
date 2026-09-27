'use client'

import { motion, useInView, type Variants } from 'framer-motion'
import Link from 'next/link'
import { useRef } from 'react'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ContactCTA — bandeau d'appel à l'action final de la Home
 * ────────────────────────────────────────────────────────────────────────────
 * Deux canaux prioritaires pour le marché ouest-africain :
 *   1. Formulaire de devis (/contact) — parcours B2B structuré
 *   2. WhatsApp direct — canal réellement utilisé pour les échanges commerciaux
 *
 * TODO [cta] :
 *  - [ ] Construire le lien WhatsApp :
 *        `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=…`
 *        avec un message pré-rempli mentionnant le produit/secteur d'intérêt
 *  - [ ] Ajouter le numéro de téléphone cliquable (tel:) pour le mobile
 *  - [ ] Rendre les libellés et le numéro éditables depuis Payload
 *  - [ ] Mesurer les conversions (événement analytics sur clic CTA)
 *  - [ ] Prévoir une variante sans image pour le rendu mobile en 3G
 */

const conteneur: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export interface ContactCTAProps {
  /** Numéro WhatsApp (format international sans « + »), ex. « 2250000000000 ». */
  numeroWhatsApp?: string
  /** Email commercial affiché (fallback si WhatsApp indisponible). */
  emailCommercial?: string
}

export default function ContactCTA({
  numeroWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  emailCommercial = 'commercial@petrovoll.example',
}: ContactCTAProps) {
  const ref = useRef<HTMLElement>(null)
  const estVisible = useInView(ref, { once: true, margin: '-100px' })

  // TODO [cta] : adapter le message pré-rempli au contexte (produit / secteur)
  const lienWhatsApp = numeroWhatsApp
    ? `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(
        'Bonjour, je souhaite un devis PETROVOLL.',
      )}`
    : undefined

  return (
    <section ref={ref} className="relative py-20 lg:py-28" aria-labelledby="cta-titre">
      <div className="container">
        <motion.div
          variants={conteneur}
          initial="hidden"
          animate={estVisible ? 'visible' : 'hidden'}
          className="relative overflow-hidden rounded-lg border border-brand-500/30 bg-petrovoll-gradient px-8 py-14 lg:px-16 lg:py-20"
        >
          {/* Halos décoratifs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand-500/20 blur-[100px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-gold-400/10 blur-[100px]"
          />

          <div className="relative max-w-3xl">
            <motion.p
              variants={fadeInUp}
              className="mb-4 font-display text-sm tracking-industrial text-gold-400"
            >
              DEVIS & RENSEIGNEMENTS
            </motion.p>

            <motion.h2
              variants={fadeInUp}
              id="cta-titre"
              className="text-4xl leading-tight text-white md:text-5xl lg:text-6xl"
            >
              {/* TODO [contenu] : accroche validée par le client */}
              UN BESOIN RÉGULIER ?
              <br />
              PARLONS-EN.
            </motion.h2>

            <motion.p variants={fadeInUp} className="mt-6 max-w-xl text-base text-white/60">
              {/* TODO [contenu] : préciser les conditions commerciales (volume
                  minimum, délais, zones livrées) — éléments décisifs pour un
                  acheteur B2B. */}
              Distributeurs, industriels, flottes de véhicules : bénéficiez de
              conditions dédiées et d’un accompagnement logistique sur mesure.
            </motion.p>

            <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/contact"
                className="rounded-sm bg-brand-500 px-7 py-3.5 text-sm font-semibold uppercase tracking-industrial text-white transition-colors hover:bg-brand-600"
              >
                Demander un devis
              </Link>

              {lienWhatsApp ? (
                <a
                  href={lienWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-sm border border-gold-400/40 px-7 py-3.5 text-sm font-semibold uppercase tracking-industrial text-gold-400 transition-colors hover:bg-gold-400 hover:text-ink-900"
                >
                  WhatsApp
                </a>
              ) : (
                // TODO [cta] : renseigner NEXT_PUBLIC_WHATSAPP_NUMBER dans .env.local
                <span className="rounded-sm border border-white/15 px-7 py-3.5 text-sm font-semibold uppercase tracking-industrial text-white/30">
                  WhatsApp — à configurer
                </span>
              )}

              <a
                href={`mailto:${emailCommercial}`}
                className="text-sm text-white/50 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                {emailCommercial}
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}