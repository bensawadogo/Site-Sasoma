import { describe, expect, it } from 'vitest'

import { niveauAppareil, niveauForce, SCRIPT_APPAREIL, type SignauxAppareil } from './capacite-appareil'

describe('niveauAppareil', () => {
  it('ordinateur puissant → fort, même avec « mouvement réduit »', () => {
    expect(niveauAppareil({ memoire: 8, coeurs: 12, reseau: '4g' })).toBe('fort')
    expect(niveauAppareil({ memoire: 8, coeurs: 12, mouvementReduit: true })).toBe('fort')
  })

  it('valeurs inconnues (Safari, Firefox) → fort', () => {
    expect(niveauAppareil({})).toBe('fort')
    expect(niveauAppareil({ memoire: undefined, coeurs: undefined, reseau: undefined })).toBe('fort')
  })

  it('économiseur de données ou réseau 2g → faible', () => {
    expect(niveauAppareil({ memoire: 8, coeurs: 8, economiseur: true })).toBe('faible')
    expect(niveauAppareil({ memoire: 8, coeurs: 8, reseau: '2g' })).toBe('faible')
    expect(niveauAppareil({ memoire: 8, coeurs: 8, reseau: 'slow-2g' })).toBe('faible')
  })

  it('RAM ≤ 2 Go ou ≤ 2 cœurs → faible', () => {
    expect(niveauAppareil({ memoire: 2, coeurs: 8 })).toBe('faible')
    expect(niveauAppareil({ memoire: 1, coeurs: 4 })).toBe('faible')
    expect(niveauAppareil({ memoire: 8, coeurs: 2 })).toBe('faible')
  })

  it('RAM 4 Go sur bon réseau → moyen ; PC à 4 cœurs et 8 Go → fort', () => {
    expect(niveauAppareil({ memoire: 4, coeurs: 8, reseau: '4g' })).toBe('moyen')
    expect(niveauAppareil({ memoire: 8, coeurs: 4 })).toBe('fort') // PC de bureau à 4 cœurs : garde ses animations
  })

  it('réseau 3g : moyen sur un appareil confortable, faible sur un appareil juste', () => {
    expect(niveauAppareil({ memoire: 8, coeurs: 8, reseau: '3g' })).toBe('moyen')
    expect(niveauAppareil({ memoire: 4, coeurs: 8, reseau: '3g' })).toBe('faible')
  })

  it('mouvement réduit : moyen → faible, mais seulement avec un signal de faiblesse', () => {
    expect(niveauAppareil({ memoire: 4, coeurs: 8, mouvementReduit: true })).toBe('faible')
    expect(niveauAppareil({ memoire: 8, coeurs: 8, mouvementReduit: true })).toBe('fort')
  })
})

describe('niveauForce', () => {
  it('lit ?appareil=…', () => {
    expect(niveauForce('?appareil=faible')).toBe('faible')
    expect(niveauForce('?a=1&appareil=moyen&b=2')).toBe('moyen')
    expect(niveauForce('?appareil=fort')).toBe('fort')
  })
  it('ignore les valeurs inconnues', () => {
    expect(niveauForce('?appareil=ultra')).toBeNull()
    expect(niveauForce('')).toBeNull()
  })
})

/** Exécute le script inline du <head> avec un faux navigateur ; renvoie data-appareil. */
function executerScript(s: SignauxAppareil, recherche = ''): string | null {
  const attrs: Record<string, string> = {}
  const nav = {
    deviceMemory: s.memoire ?? undefined,
    hardwareConcurrency: s.coeurs ?? undefined,
    connection: { saveData: s.economiseur ?? undefined, effectiveType: s.reseau ?? undefined },
  }
  const doc = { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } }
  const matchMedia = () => ({ matches: !!s.mouvementReduit })
  new Function('document', 'navigator', 'location', 'matchMedia', SCRIPT_APPAREIL)(doc, nav, { search: recherche }, matchMedia)
  return attrs['data-appareil'] ?? null
}

describe('SCRIPT_APPAREIL (script inline du <head>)', () => {
  const cas: SignauxAppareil[] = []
  for (const memoire of [undefined, 1, 2, 4, 8])
    for (const coeurs of [undefined, 2, 4, 8])
      for (const reseau of [undefined, 'slow-2g', '2g', '3g', '4g'])
        for (const economiseur of [false, true])
          for (const mouvementReduit of [false, true]) cas.push({ memoire, coeurs, reseau, economiseur, mouvementReduit })

  it('donne le même niveau que niveauAppareil() sur toutes les combinaisons', () => {
    for (const c of cas) expect(executerScript(c), JSON.stringify(c)).toBe(niveauAppareil(c))
  })

  it('respecte le forçage ?appareil=…', () => {
    expect(executerScript({ memoire: 8, coeurs: 8 }, '?appareil=faible')).toBe('faible')
    expect(executerScript({ memoire: 1 }, '?appareil=fort')).toBe('fort')
  })
})
