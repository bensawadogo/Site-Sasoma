'use client'

import { motion, useInView, type Variants } from 'framer-motion'
import Link from 'next/link'
import { useRef } from 'react'

import type { Secteur } from '@/types'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SecteursGrid — les 5 secteurs d'activité en cards
 * ────────────────────────────────────────────────────────────────────────────
 * 1. Huile moteur & lubrifiants (PETROVOLL)   → secteur principal
 * 2. Transport & logistique
 * 3. Distribution & import-export
 * 4. Pneumatiques
 * 5. Fournitures de bureau
 *
 * Chaque card s'appuie sur les champs de la collection `secteurs` :
 *   • `icone`   → nom d'icône Lucide
 *   • `couleur` → couleur d'accent hexadécimale
 *   • `slug`    → lien /secteurs/<slug>
 *
 * TODO [data] : passer `secteurs` en props (chargés côté serveur dans la page)
 * TODO [ui]   : envisager la card du secteur principal sur 2 colonnes (desktop)
 *               avec bordure ambrée — à valider avec le client
 * TODO [icons] : résoudre le nom Lucide SANS casser le tree-shaking :
 *               importer explicitement les 5 icônes puis utiliser une map locale
 *                 const ICONES = { Droplet, Truck, Globe, CircleDot, Paperclip }
 *               (éviter `import * as Icons from 'lucide-react'` : embarque tout)
 */

/** Modèle d'affichage unifié (data Payload OU placeholder du squelette). */
interface SecteurVue {
  id: string
  slug: string
  nom: string
  accroche: string
  icone: string
  couleur: string
}

/** TODO [data] : à supprimer dès que la collection Payload est branchée. */
const SECTEURS_PLACEHOLDER: SecteurVue[] = [
  {
    id: 'placeholder-1',
    slug: 'lubrifiants',
    nom: 'Huile moteur & lubrifiants',
    accroche: 'Marque PETROVOLL',
    icone: 'Droplet',
    couleur: '#D4420A',
  },
  {
    id: 'placeholder-2',
    slug: 'transport-logistique',
    nom: 'Transport & logistique',
    accroche: 'Flotte & fret',
    icone: 'Truck',
    couleur: '#F5A623',
  },
  {
    id: 'placeholder-3',
    slug: 'distribution-import-export',
    nom: 'Distribution & import-export',
    accroche: 'Sourcing & négoce',
    icone: 'Globe',
    couleur: '#D4420A',
  },
  {
    id: 'placeholder-4',
    slug: 'pneumatiques',
    nom: 'Pneumatiques',
    accroche: 'Véhicules légers & poids lourds',
    icone: 'CircleDot',
    couleur: '#F5A623',
  },
  {
    id: 'placeholder-5',
    slug: 'fournitures-bureau',
    nom: 'Fournitures de bureau',
    accroche: 'Équipement professionnel',
    icone: 'Paperclip',
    couleur: '#D4420A',
  },
]

const conteneur: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export interface SecteursGridProps {
  /** Les 5 secteurs d'activité (collection Payload `secteurs`). */
  secteurs?: Secteur[]
}

export default function SecteursGrid({ secteurs = [] }: SecteursGridProps) {
  const ref = useRef<HTMLElement>(null)
  const estVisible = useInView(ref, { once: true, margin: '-100px' })

  // Mapping data Payload → modèle d'affichage (ou placeholder du squelette)
  const liste: SecteurVue[] =
    secteurs.length > 0
      ? secteurs.map((secteur) => ({
          id: secteur.id,
          slug: secteur.slug,
          nom: secteur.nom,
          // TODO [data] : dériver une accroche du richText `description`
          // (ex. 12 premiers mots) au lieu de ce texte générique.
          accroche: 'Secteur d’activité du groupe',
          icone: secteur.icone,
          couleur: secteur.couleur,
        }))
      : SECTEURS_PLACEHOLDER

  return (
    <section ref={ref} className="relative py-20 lg:py-28" aria-labelledby="secteurs-titre">
      <div className="container">
        <header className="mb-14 max-w-3xl">
          <p className="mb-3 font-display text-sm tracking-industrial text-brand-500">
            NOS MÉTIERS
          </p>
          <h2 id="secteurs-titre" className="section-underline text-4xl text-white md:text-5xl">
            Cinq secteurs, une seule exigence
          </h2>
          <p className="mt-6 text-base text-white/55">
            {/* TODO [contenu] : éditorialisable depuis Payload (global ou page) */}
            Du lubrifiant qui protège vos moteurs à la logistique qui achemine
            vos marchandises : le groupe couvre toute la chaîne d’approvisionnement.
          </p>
        </header>

        <motion.ul
          variants={conteneur}
          initial="hidden"
          animate={estVisible ? 'visible' : 'hidden'}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {liste.map((secteur) => (
            <motion.li key={secteur.id} variants={fadeInUp} className="h-full">
              <Link
                href={`/secteurs/${secteur.slug}`}
                className="group flex h-full flex-col rounded-lg border border-white/10 bg-white/[0.02] p-7 transition-colors hover:border-brand-500/60 hover:bg-white/[0.04]"
              >
                {/* Pastille d'icône — TODO [icons] : composant Lucide réel */}
                <span
                  aria-hidden
                  className="mb-5 inline-flex size-12 items-center justify-center rounded-sm border border-white/10 font-display text-lg"
                  style={{ backgroundColor: `${secteur.couleur}1A`, color: secteur.couleur }}
                >
                  {secteur.icone.slice(0, 1)}
                </span>

                <h3 className="text-xl text-white">{secteur.nom}</h3>
                <p className="mt-3 flex-1 text-sm text-white/50">{secteur.accroche}</p>

                <span className="mt-6 text-xs font-semibold uppercase tracking-industrial text-brand-500 transition-colors group-hover:text-gold-400">
                  Découvrir →
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}