import { describe, expect, it } from 'vitest'

import {
  choisirPalier,
  couvrir,
  fenetre,
  imageDepuis,
  opaciteBloc,
  ordreChargement,
  palierInferieur,
  plusProche,
  tournerAutour,
} from './hero-timeline'

describe('couvrir', () => {
  it('image 9:16 sur écran 360×800 : 10 % coupés de chaque côté', () => {
    const image = { l: 1080, h: 1920 }
    const ecran = { l: 360, h: 800 }
    expect(couvrir({ x: 0.5, y: 0.5 }, image, ecran)).toEqual({ x: 180, y: 400 })
    expect(couvrir({ x: 0.1, y: 0 }, image, ecran).x).toBeCloseTo(0) // 0,1 × 450 − 45 : bord de l'écran
    expect(couvrir({ x: 0.05, y: 0 }, image, ecran).x).toBeLessThan(0) // hors écran
  })
})

describe('tournerAutour', () => {
  it('90° dans le sens horaire à l’écran (y vers le bas)', () => {
    const r = tournerAutour({ x: 10, y: 0 }, { x: 0, y: 0 }, 90)
    expect(r.x).toBeCloseTo(0)
    expect(r.y).toBeCloseTo(10)
  })
})

describe('opaciteBloc', () => {
  it('visible au milieu, invisible hors plage, pas de fondu aux bornes 0 et 1', () => {
    expect(opaciteBloc(0.2, 0.08, 0.35)).toBe(1)
    expect(opaciteBloc(0.5, 0.08, 0.35)).toBe(0)
    expect(opaciteBloc(0, 0, 0.08)).toBe(1)
    expect(opaciteBloc(1, 0.92, 1)).toBe(1)
  })
  it('deux blocs voisins ne se superposent jamais', () => {
    for (let p = 0.3; p <= 0.4; p += 0.001) {
      expect(Math.min(opaciteBloc(p, 0.08, 0.35), opaciteBloc(p, 0.35, 0.55))).toBe(0)
    }
  })
})

describe('choisirPalier', () => {
  const base = { largeur: 360, tactile: true }
  it('?tier= est prioritaire', () => {
    expect(choisirPalier({ ...base, forcage: 'full', saveData: true })).toBe('full')
  })
  it('lite : économie de données, 3G, ≤ 2 Go, mouvement réduit', () => {
    expect(choisirPalier({ ...base, saveData: true })).toBe('lite')
    expect(choisirPalier({ ...base, typeConnexion: '3g' })).toBe('lite')
    expect(choisirPalier({ ...base, memoireGo: 2 })).toBe('lite')
    expect(choisirPalier({ ...base, mouvementReduit: true })).toBe('lite')
  })
  it('standard par défaut sur mobile, full si ≥ 6 Go en 4G ou ordinateur', () => {
    expect(choisirPalier({ ...base, typeConnexion: '4g', memoireGo: 4 })).toBe('standard')
    expect(choisirPalier({ ...base, typeConnexion: '4g', memoireGo: 8 })).toBe('full')
    expect(choisirPalier({ largeur: 1440, tactile: false })).toBe('full')
  })
  it('garde-fou : descend d’un palier', () => {
    expect(palierInferieur('full')).toBe('standard')
    expect(palierInferieur('standard')).toBe('lite')
  })
})

describe('séquence', () => {
  it('ordre de chargement : 1 sur 4, la dernière, puis les trous — chaque image une fois', () => {
    const ordre = ordreChargement(10)
    expect(ordre.slice(0, 4)).toEqual([0, 9, 4, 8])
    expect([...ordre].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
  it('index, fenêtre de décodage et image la plus proche', () => {
    expect(imageDepuis(0, 48)).toBe(0)
    expect(imageDepuis(1, 48)).toBe(47)
    expect(fenetre(0, 48, 12)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(fenetre(47, 48, 12)[0]).toBe(36)
    expect(fenetre(3, 5, 12)).toEqual([0, 1, 2, 3, 4])
    expect(plusProche(5, [0, 4, 8])).toBe(4)
    expect(plusProche(5, [])).toBeNull()
  })
})
