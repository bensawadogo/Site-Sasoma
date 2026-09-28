/**
 * noyau.ts — moteur commun des heros vidéo mobile et desktop.
 *
 * Chaque format a son composant (HeroMobile.astro / HeroDesktop.astro), son point
 * d'entrée (mobile.ts / desktop.ts) et ses réglages (hero-video.config.ts) ; ce
 * fichier ne contient que ce qui est identique : textes, bidon, filet, séquence.
 *
 *  - un seul écouteur de scroll passif, rendu dans requestAnimationFrame ;
 *  - DOM : on n'écrit que opacity et transform ; le moteur est dessiné dans un canvas ;
 *  - séquence : chargée après l'événement load, une image sur 4 d'abord, puis le reste ;
 *    seules les images proches de l'image courante restent décodées (ImageBitmap) ;
 *  - palier lite (économie de données, 2G/3G, ≤ 2 Go, mouvement réduit) : deux images
 *    seulement (début et fin de la séquence), en fondu.
 */
import type { ReglagesHeroVideo } from '@/hero-video.config'
import { HERO } from '@/hero.config'
import { borner, doux, local, mix, opaciteBloc, tournerAutour } from '@/lib/hero-timeline'
import { couverture, type Couverture, indexImage, ordreChargement, plusProche, pointCouvert } from '@/lib/sequence-images'

type Pt = { x: number; y: number }
type NavigatorEtendu = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string }
  deviceMemory?: number
}

const plage = (id: string) => HERO.temps.find((t) => t.id === id)!
const T1 = plage('t1')
const T2 = plage('t2')
const T3 = plage('t3')
const FIN = plage('fin')
/** Images gardées décodées autour de l'image courante (avant, après). */
const FENETRE = { avant: 4, apres: 8 }

export function lancerHeroVideo(racine: HTMLElement, R: ReglagesHeroVideo): void {
  const scene = racine.querySelector<HTMLElement>('[data-scene]')!
  const canvasMoteur = racine.querySelector<HTMLCanvasElement>('[data-sequence]')!
  const canvasFilet = racine.querySelector<HTMLCanvasElement>('[data-filet]')!
  const bidon = racine.querySelector<HTMLElement>('[data-bidon-hero]')!
  const niveau = bidon.querySelector<HTMLElement>('[data-niveau]')
  const bouchon = bidon.querySelector<HTMLElement>('[data-bouchon]')
  const aspectBidon = Number(bidon.dataset.aspect ?? 0.64)
  const blocs = [...racine.querySelectorAll<HTMLElement>('[data-bloc]')].map((el) => ({
    el,
    debut: Number(el.dataset.debut),
    fin: Number(el.dataset.fin),
    actif: el.hasAttribute('data-actif'),
  }))
  const ctxMoteur = canvasMoteur.getContext('2d', { alpha: false })!
  const ctxFilet = canvasFilet.getContext('2d')!
  const mouvementReduit = matchMedia('(prefers-reduced-motion: reduce)').matches

  // ── Palier : séquence complète, ou deux images en fondu ────────────────────
  const nav = navigator as NavigatorEtendu
  const forcage = new URLSearchParams(location.search).get(HERO.parametreForcage)
  const leger =
    forcage === 'lite' ||
    (!forcage &&
      (mouvementReduit ||
        !!nav.connection?.saveData ||
        /(^|-)(2g|3g)$/.test(nav.connection?.effectiveType ?? '') ||
        (R.nom === 'mobile' && (nav.deviceMemory ?? 4) <= 2)))
  racine.dataset.palier = leger ? 'lite' : 'sequence'

  // ── Séquence d'images ──────────────────────────────────────────────────────
  const S = R.sequence
  const total = S.images
  const url = (i: number) => `${S.dossier}/${String(i).padStart(3, '0')}.webp?v=${S.version}`
  const images: (HTMLImageElement | null)[] = Array(total).fill(null)
  const chargees = new Set<number>()
  const bitmaps = new Map<number, ImageBitmap>()
  const decodage = new Set<number>()
  let courante = 0

  function charger(i: number): Promise<void> {
    return new Promise((resolu) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        images[i] = img
        chargees.add(i)
        if (Math.abs(i - courante) <= FENETRE.apres) garderDecodees()
        demanderRendu()
        resolu()
      }
      img.onerror = () => resolu() // image manquante : on dessine la plus proche
      img.src = url(i)
    })
  }

  async function chargerTout(ordre: number[]) {
    let suivant = 0
    const ouvrier = async () => {
      while (suivant < ordre.length) await charger(ordre[suivant++])
    }
    await Promise.all(Array.from({ length: S.parallele }, ouvrier))
  }

  /** Décode les images autour de la courante, libère les autres. */
  function garderDecodees() {
    const min = courante - FENETRE.avant
    const max = courante + FENETRE.apres
    for (const [i, b] of bitmaps) {
      if (i < min || i > max) {
        b.close()
        bitmaps.delete(i)
      }
    }
    for (let i = Math.max(0, min); i <= Math.min(total - 1, max); i++) {
      const img = images[i]
      if (!img || bitmaps.has(i) || decodage.has(i)) continue
      decodage.add(i)
      createImageBitmap(img)
        .then((b) => {
          decodage.delete(i)
          if (i < courante - FENETRE.avant || i > courante + FENETRE.apres) return b.close()
          bitmaps.set(i, b)
          if (i === courante) demanderRendu()
        })
        .catch(() => decodage.delete(i))
    }
  }

  // ── Géométrie (recalculée au redimensionnement) ────────────────────────────
  let ecran = { l: 0, h: 0 }
  let dpr = 1
  let couv: Couverture = { x: 0, y: 0, l: 0, h: 0 }
  let orifice: Pt = { x: 0, y: 0 }
  let goulotRepos: Pt = { x: 0, y: 0 }
  let pivot: Pt = { x: 0, y: 0 }
  let deplacement: Pt = { x: 0, y: 0 }
  let hauteurBidon = 0

  function dimensionner(c: HTMLCanvasElement, echelle: number) {
    const l = Math.round(ecran.l * echelle)
    const h = Math.round(ecran.h * echelle)
    if (c.width !== l) c.width = l
    if (c.height !== h) c.height = h
  }

  function mesurer() {
    ecran = { l: scene.clientWidth, h: scene.clientHeight }
    couv = couverture({ l: S.largeur, h: S.hauteur }, ecran, S.focale.x, S.focale.y, S.zoom)
    // Jamais plus défini que l'image source : inutile de peindre des pixels inventés.
    dpr = Math.min(devicePixelRatio || 1, S.dprMax, Math.max(1, S.largeur / couv.l))
    dimensionner(canvasMoteur, dpr)
    dimensionner(canvasFilet, Math.min(devicePixelRatio || 1, 2))
    orifice = pointCouvert(S.orifice, couv)

    const zb = R.zones.bidon
    const h = zb.h * ecran.h
    const l = h * aspectBidon
    hauteurBidon = h
    const gauche = zb.x * ecran.l + (zb.l * ecran.l - l) / 2
    const haut = zb.y * ecran.h
    Object.assign(bidon.style, { left: `${gauche}px`, top: `${haut}px`, width: `${l}px`, height: `${h}px` })
    const { spout, bottlePivot } = HERO.ancres.bidon
    bidon.style.transformOrigin = `${bottlePivot.x * 100}% ${bottlePivot.y * 100}%`
    goulotRepos = { x: gauche + spout.x * l, y: haut + spout.y * h }
    pivot = { x: gauche + bottlePivot.x * l, y: haut + bottlePivot.y * h }
    const arrivee = { x: R.cibleGoulot.x === undefined ? orifice.x : R.cibleGoulot.x * ecran.l, y: R.cibleGoulot.y * ecran.h }
    const goulotBascule = tournerAutour(goulotRepos, pivot, HERO.angleVersement)
    deplacement = { x: arrivee.x - goulotBascule.x, y: arrivee.y - goulotBascule.y }
    derniereDessinee = -1
  }

  // ── Dessin du moteur ───────────────────────────────────────────────────────
  let derniereDessinee = -1
  let dernierFondu = -1

  let affichePresente = true

  function peindre(source: CanvasImageSource, alpha = 1) {
    if (alpha === 1 && S.zoom < 1) {
      ctxMoteur.fillStyle = '#000'
      ctxMoteur.fillRect(0, 0, canvasMoteur.width, canvasMoteur.height)
    }
    ctxMoteur.globalAlpha = alpha
    ctxMoteur.drawImage(source, couv.x * dpr, couv.y * dpr, couv.l * dpr, couv.h * dpr)
    ctxMoteur.globalAlpha = 1
    if (affichePresente) {
      // Le canvas a pris le relais : l'affiche CSS ne doit plus transparaître quand
      // le moteur s'assombrit à la fin.
      scene.style.backgroundImage = 'none'
      affichePresente = false
    }
  }

  function dessinerMoteur(t3: number) {
    if (leger) {
      // Deux images : début de V1, puis fin de V2, en fondu pendant t3.
      const f = Math.round(doux(local(t3, 0.1, 0.9)) * 100) / 100
      if (f === dernierFondu) return
      const debut = images[0]
      const fin = images[total - 1]
      if (!debut) return
      ctxMoteur.fillStyle = '#000'
      ctxMoteur.fillRect(0, 0, canvasMoteur.width, canvasMoteur.height)
      peindre(debut)
      if (fin && f > 0) peindre(fin, f)
      dernierFondu = f
      return
    }
    courante = indexImage(t3, total)
    garderDecodees()
    const i = plusProche(courante, (k) => bitmaps.has(k) || chargees.has(k), total)
    if (i === null || i === derniereDessinee) return
    const source = bitmaps.get(i) ?? images[i]
    if (!source) return
    peindre(source)
    derniereDessinee = i
  }

  // ── Filet d'huile ──────────────────────────────────────────────────────────
  const echelleFilet = () => canvasFilet.width / Math.max(1, ecran.l)
  const courbe = (a: Pt, b: Pt, t: number): Pt => {
    const c = R.filet === 'vertical' ? { x: a.x, y: (a.y + b.y) / 2 } : { x: (a.x + b.x) / 2, y: a.y }
    const u = 1 - t
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }
  }

  function dessinerFilet(goulot: Pt, debut: number, fin: number, temps: number) {
    ctxFilet.clearRect(0, 0, canvasFilet.width, canvasFilet.height)
    if (fin - debut <= 0.001) return
    ctxFilet.save()
    ctxFilet.scale(echelleFilet(), echelleFilet())
    ctxFilet.beginPath()
    for (let k = 0; k <= 24; k++) {
      const p = courbe(goulot, orifice, mix(debut, fin, k / 24))
      if (k === 0) ctxFilet.moveTo(p.x, p.y)
      else ctxFilet.lineTo(p.x, p.y)
    }
    const degrade = ctxFilet.createLinearGradient(goulot.x, goulot.y, orifice.x, orifice.y)
    degrade.addColorStop(0, HERO.couleurs.huile[0])
    degrade.addColorStop(1, HERO.couleurs.huile[1])
    ctxFilet.lineCap = 'round'
    ctxFilet.lineWidth = R.epaisseurFilet
    ctxFilet.strokeStyle = degrade
    ctxFilet.stroke()
    ctxFilet.lineWidth = 2
    ctxFilet.strokeStyle = HERO.couleurs.refletHuile
    ctxFilet.globalAlpha = 0.75
    ctxFilet.setLineDash([14, 26])
    ctxFilet.lineDashOffset = leger ? 0 : -temps * 0.15
    ctxFilet.stroke()
    ctxFilet.restore()
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  let progression = 0
  let filetVisible = false
  let filetPresent = false

  function lireProgression() {
    const r = racine.getBoundingClientRect()
    const course = r.height - ecran.h
    progression = course > 0 ? borner(-r.top / course) : 0
  }

  function rendre(temps: number) {
    const p = progression
    for (const b of blocs) {
      const o = opaciteBloc(p, b.debut, b.fin)
      b.el.style.opacity = String(o)
      b.el.style.transform = `translate3d(0, ${(1 - o) * 12}px, 0)`
      const actif = o > 0.5
      if (actif !== b.actif) {
        b.actif = actif
        b.el.toggleAttribute('data-actif', actif)
        b.el.inert = !actif // bloc caché = hors du parcours clavier
      }
    }

    if (niveau) niveau.style.transform = `translate3d(0, ${mix(100, 32, doux(local(p, T1.debut, T1.fin)))}%, 0)`

    const t2 = local(p, T2.debut, T2.fin)
    const t3 = local(p, T3.debut, T3.fin)
    const saut = doux(local(t2, 0, 0.2))
    if (bouchon) {
      const d = hauteurBidon * saut
      bouchon.style.transform = `translate3d(${d * 0.12}px, ${-d * 0.35}px, 0) rotate(${saut * 35}deg)`
      bouchon.style.opacity = String(1 - saut)
    }
    const bascule = mouvementReduit ? 0 : doux(local(t2, 0.15, 0.7))
    const sortie = mouvementReduit ? local(t2, 0, 0.5) : local(t3, 0.1, 0.25)
    bidon.style.transform = `translate3d(${deplacement.x * bascule}px, ${deplacement.y * bascule}px, 0) rotate(${HERO.angleVersement * bascule}deg)`
    bidon.style.opacity = String(1 - sortie)

    const tete = mouvementReduit ? 0 : local(t2, 0.7, 0.9)
    const queue = local(t3, 0.05, 0.25)
    filetVisible = tete > queue && bascule > 0
    if (filetVisible || filetPresent) {
      const g = tournerAutour(goulotRepos, pivot, HERO.angleVersement * bascule)
      dessinerFilet({ x: g.x + deplacement.x * bascule, y: g.y + deplacement.y * bascule }, queue, tete, temps)
      filetPresent = filetVisible
    }

    dessinerMoteur(t3)
    // Écran de fin : le moteur s'assombrit derrière les produits.
    canvasMoteur.style.opacity = String(1 - 0.7 * local(p, FIN.debut - 0.02, FIN.debut + 0.02))
  }

  let rafEnAttente = false
  function demanderRendu() {
    if (rafEnAttente) return
    rafEnAttente = true
    requestAnimationFrame((temps) => {
      rafEnAttente = false
      lireProgression()
      rendre(temps)
      if (filetVisible && !leger) demanderRendu() // le reflet du filet défile
    })
  }

  // ── Démarrage ──────────────────────────────────────────────────────────────
  racine.dataset.pret = ''
  mesurer()
  lireProgression()
  rendre(0)
  addEventListener('scroll', demanderRendu, { passive: true })
  let minuterie = 0
  addEventListener('resize', () => {
    clearTimeout(minuterie)
    minuterie = window.setTimeout(() => {
      mesurer()
      dernierFondu = -1
      demanderRendu()
    }, 150)
  })

  // Première image tout de suite (elle est l'affiche du hero), le reste après load.
  charger(0).then(() => {
    const suite = () => (leger ? charger(total - 1) : chargerTout(ordreChargement(total).filter((i) => i !== 0)))
    if (document.readyState === 'complete') suite()
    else addEventListener('load', suite, { once: true })
  })
}
