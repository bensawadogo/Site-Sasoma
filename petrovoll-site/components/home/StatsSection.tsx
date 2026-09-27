'use client'

import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * StatsSection — chiffres clés animés (count-up au scroll)
 * ────────────────────────────────────────────────────────────────────────────
 * Objectif : rassurer instantanément un acheteur B2B (capacité, couverture,
 * ancienneté). Les valeurs doivent être FACTUELLES et fournies par le client.
 *
 * TODO [contenu] — valeurs à faire confirmer par le client AVANT publication :
 *   - années d'expérience
 *   - litres / tonnes distribués par an
 *   - nombre de pays ou de villes desservis
 *   - nombre de références en catalogue
 *   - taille de flotte / surface de stockage
 *
 * TODO [data] :
 *  - [ ] Rendre ces chiffres éditables dans Payload (global `parametres-site`
 *        ou collection `chiffres-cles`) : jamais de valeurs codées en dur
 *  - [ ] Prévoir la précision (« + de », « env. ») pour éviter toute ambiguïté
 *  - [ ] Désactiver l'animation si `prefers-reduced-motion: reduce`
 *
 * ⚠️  Les nombres ci-dessous sont des PLACEHOLDERS À ZÉRO : rien de faux n'est
 *     affiché publiquement tant que le client n'a pas validé les valeurs.
 */

interface ChiffreCle {
  libelle: string
  /** Valeur cible du compteur. 0 = non renseigné (squelette). */
  valeur: number
  suffixe?: string
  prefixe?: string
}

const CHIFFRES_PLACEHOLDER: ChiffreCle[] = [
  { libelle: 'Années d’expérience', valeur: 0, suffixe: '' },
  { libelle: 'Litres distribués / an', valeur: 0, suffixe: '' },
  { libelle: 'Pays desservis', valeur: 0, suffixe: '' },
  { libelle: 'Références au catalogue', valeur: 0, suffixe: '+' },
]

/**
 * Compteur animé — interpole de 0 vers `cible` sur ~1,6 s.
 * TODO [animation] : remplacer par `useMotionValue` + `animate()` de Framer
 * Motion pour une courbe plus naturelle et un vrai easing.
 */
interface CompteurAnimeProps {
  /** Valeur cible du compteur (0 = aucune donnée → rien n'est animé). */
  cible: number
  suffixe?: string
  prefixe?: string
}

function CompteurAnime({ cible, suffixe = '', prefixe = '' }: CompteurAnimeProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const estVisible = useInView(ref, { once: true, margin: '-80px' })
  const [valeur, setValeur] = useState(0)

  useEffect(() => {
    if (!estVisible) return
    if (cible <= 0) {
      // Aucune valeur renseignée : on n'anime rien (placeholder du squelette)
      setValeur(0)
      return
    }

    const duree = 1600
    const debut = performance.now()
    let frame = 0

    const tick = (maintenant: number) => {
      const progression = Math.min((maintenant - debut) / duree, 1)
      // Easing « easeOutCubic »
      const avancement = 1 - Math.pow(1 - progression, 3)
      setValeur(Math.round(cible * avancement))
      if (progression < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [cible, estVisible])

  return (
    <span ref={ref} className="font-display text-5xl tracking-industrial text-gold-400 lg:text-6xl">
      {prefixe}
      {valeur}
      {suffixe}
    </span>
  )
}

export interface StatsSectionProps {
  /** Chiffres clés (à charger depuis Payload une fois la collection créée). */
  chiffres?: ChiffreCle[]
}

export default function StatsSection({ chiffres = CHIFFRES_PLACEHOLDER }: StatsSectionProps) {
  return (
    <section
      className="relative overflow-hidden border-y border-white/5 bg-ink-950 py-20 lg:py-24"
      aria-labelledby="stats-titre"
    >
      {/* Filet lumineux or */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gold-line" />

      <div className="container">
        <header className="mb-14 max-w-2xl">
          <p className="mb-3 font-display text-sm tracking-industrial text-brand-500">
            EN CHIFFRES
          </p>
          <h2 id="stats-titre" className="text-4xl text-white md:text-5xl">
            Une capacité qui parle d’elle-même
          </h2>
          {/* TODO [contenu] : phrase de contexte validée par le client */}
        </header>

        <dl className="grid gap-10 border-t border-white/10 pt-12 sm:grid-cols-2 lg:grid-cols-4">
          {chiffres.map((chiffre) => (
            <div key={chiffre.libelle}>
              <dd>
                <CompteurAnime
                  cible={chiffre.valeur}
                  suffixe={chiffre.suffixe}
                  prefixe={chiffre.prefixe}
                />
              </dd>
              <dt className="mt-3 text-xs uppercase tracking-industrial text-white/45">
                {chiffre.libelle}
              </dt>
              {/* TODO [data] : masquer/afficher un libellé « à confirmer » tant
                  que la valeur n'est pas fournie par le client */}
            </div>
          ))}
        </dl>

        {/* TODO [ui] : logos partenaires / marques distribuées (bandeau marquee) */}
      </div>
    </section>
  )
}