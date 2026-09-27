/**
 * hero-scroll.ts — animation du hero au scroll (BRIEF-MAITRE.md §8).
 *
 *  - un seul écouteur de scroll passif ; tout le rendu dans requestAnimationFrame ;
 *  - on n'écrit que opacity et transform (la mise en page n'est recalculée
 *    qu'au redimensionnement) ;
 *  - séquence sur canvas : ~12 images décodées à la fois (createImageBitmap),
 *    les autres libérées avec close() ; 1 image sur 4 chargée d'abord ;
 *  - garde-fou : si le rendu tombe sous ~40 i/s (24 ms par image) pendant 2 s,
 *    on descend d'un palier.
 * Tous les calculs sont dans src/lib/hero-timeline.ts (testés).
 */
import manifeste from '@/assets/hero/manifest.json'
import { type Format, HERO, type Palier } from '@/hero.config'
import {
  borner,
  choisirPalier,
  couvrir,
  doux,
  fenetre,
  imageDepuis,
  local,
  mix,
  opaciteBloc,
  ordreChargement,
  palierInferieur,
  plusProche,
  tournerAutour,
} from '@/lib/hero-timeline'

type Pt = { x: number; y: number }
type NavigatorEtendu = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string }
  deviceMemory?: number
}
type Sequence = { dossier: string; images: number; ext: string }

const plage = (id: string) => HERO.temps.find((t) => t.id === id)!
const T1 = plage('t1')
const T2 = plage('t2')
const T3 = plage('t3')
const CHARGEMENTS_SIMULTANES = 4

export function lancerHero(racine: HTMLElement): void {
  const scene = racine.querySelector<HTMLElement>('.hero-scene')!
  const canvasSeq = racine.querySelector<HTMLCanvasElement>('[data-sequence]')!
  const canvasFilet = racine.querySelector<HTMLCanvasElement>('[data-filet]')!
  const bidon = racine.querySelector<HTMLElement>('[data-bidon-hero]')!
  const niveau = bidon.querySelector<SVGElement>('[data-niveau]')
  const bouchon = bidon.querySelector<SVGElement>('[data-bouchon]')
  const aspectBidon = Number(bidon.querySelector('svg')?.dataset.aspect ?? 0.77)
  const blocs = [...racine.querySelectorAll<HTMLElement>('.hero-bloc')].map((el) => ({
    el,
    debut: Number(el.dataset.debut),
    fin: Number(el.dataset.fin),
  }))
  const affiches = Object.fromEntries(
    [...racine.querySelectorAll<HTMLElement>('[data-affiche]')].map((el) => [el.dataset.affiche!, el]),
  )
  const ctxSeq = canvasSeq.getContext('2d')
  const ctxFilet = canvasFilet.getContext('2d')
  const mouvementReduit = matchMedia('(prefers-reduced-motion: reduce)').matches

  const nav = navigator as NavigatorEtendu
  const forcage = new URLSearchParams(location.search).get(HERO.parametreForcage)
  let palier: Palier = choisirPalier({
    forcage,
    saveData: nav.connection?.saveData,
    typeConnexion: nav.connection?.effectiveType,
    memoireGo: nav.deviceMemory,
    mouvementReduit,
    tactile: matchMedia('(pointer: coarse)').matches,
    largeur: innerWidth,
  })

  // ── Géométrie (recalculée au redimensionnement uniquement) ────────────────
  let format: Format = 'mobile'
  let ecran = { l: 0, h: 0 }
  let dpr = 1
  let goulotRepos: Pt = { x: 0, y: 0 }
  let pivot: Pt = { x: 0, y: 0 }
  let filler: Pt = { x: 0, y: 0 }
  let deplacement: Pt = { x: 0, y: 0 } // translation du bidon en fin de bascule

  function mesurer() {
    format = innerWidth >= HERO.pointDeRupture ? 'desktop' : 'mobile'
    ecran = { l: scene.clientWidth, h: scene.clientHeight }
    dpr = Math.min(devicePixelRatio || 1, HERO.paliers[palier].dprMax)
    for (const c of [canvasSeq, canvasFilet]) {
      c.width = Math.round(ecran.l * dpr)
      c.height = Math.round(ecran.h * dpr)
    }

    const z = HERO.zones[format].bidon
    const h = z.h * ecran.h
    const l = h * aspectBidon
    const gauche = z.x * ecran.l + (z.l * ecran.l - l) / 2
    const haut = z.y * ecran.h
    Object.assign(bidon.style, { left: `${gauche}px`, top: `${haut}px`, width: `${l}px`, height: `${h}px` })
    const { spout, bottlePivot } = HERO.ancres.bidon
    bidon.style.transformOrigin = `${bottlePivot.x * 100}% ${bottlePivot.y * 100}%`
    goulotRepos = { x: gauche + spout.x * l, y: haut + spout.y * h }
    pivot = { x: gauche + bottlePivot.x * l, y: haut + bottlePivot.y * h }

    const [il, ih] = manifeste.formats[format].source
    filler = couvrir(HERO.ancres.filler[format], { l: il, h: ih }, ecran)
    const cible = HERO.ancres.cibleGoulot
    const arrivee =
      format === 'mobile'
        ? { x: filler.x, y: cible.mobile.y * ecran.h }
        : { x: cible.desktop.x * ecran.l, y: cible.desktop.y * ecran.h }
    const goulotBascule = tournerAutour(goulotRepos, pivot, HERO.angleVersement)
    deplacement = { x: arrivee.x - goulotBascule.x, y: arrivee.y - goulotBascule.y }
  }

  // ── Séquence d'images ──────────────────────────────────────────────────────
  let seq: Sequence | null = null
  let fichiers: (Blob | undefined)[] = []
  let decodees = new Map<number, ImageBitmap>()
  const enDecodage = new Set<number>()
  let generation = 0 // invalide les chargements d'une séquence abandonnée
  let imageDessinee = -1
  let imageVoulue = 0

  function viderSequence() {
    generation++
    decodees.forEach((b) => b.close())
    decodees = new Map()
    enDecodage.clear()
    fichiers = []
    imageDessinee = -1
    delete racine.dataset.sequencePrete
  }

  function chargerSequence() {
    viderSequence()
    racine.dataset.palier = palier
    seq = palier === 'lite' || !ctxSeq ? null : manifeste.paliers[palier][format]
    if (!seq) return
    const s = seq
    const gen = generation
    const file = ordreChargement(s.images)
    const suivant = async (): Promise<void> => {
      const i = file.shift()
      if (i === undefined || gen !== generation) return
      try {
        const r = await fetch(`${s.dossier}/${String(i).padStart(3, '0')}.${s.ext}?v=${manifeste.version}`)
        if (gen !== generation) return
        fichiers[i] = await r.blob()
        decoderAutour()
      } catch {
        /* image manquante : l'image voisine la plus proche sera affichée */
      }
      return suivant()
    }
    for (let k = 0; k < CHARGEMENTS_SIMULTANES; k++) void suivant()
  }

  function decoderAutour() {
    if (!seq) return
    const gardees = new Set(fenetre(imageVoulue, seq.images, HERO.fenetreDecodage))
    for (const [i, b] of decodees) {
      if (!gardees.has(i)) {
        b.close()
        decodees.delete(i)
      }
    }
    const gen = generation
    // Les plus proches de l'image voulue d'abord : elle s'affiche au plus vite.
    for (const i of [...gardees].sort((a, b) => Math.abs(a - imageVoulue) - Math.abs(b - imageVoulue))) {
      const blob = fichiers[i]
      if (!blob || decodees.has(i) || enDecodage.has(i)) continue
      enDecodage.add(i)
      createImageBitmap(blob)
        .then((b) => {
          enDecodage.delete(i)
          if (gen !== generation || !gardees.has(i)) return b.close()
          decodees.set(i, b)
          demanderRendu()
        })
        .catch(() => enDecodage.delete(i))
    }
  }

  function dessinerSequence() {
    if (!seq || !ctxSeq) return
    const i = decodees.has(imageVoulue) ? imageVoulue : plusProche(imageVoulue, decodees.keys())
    if (i === null || i === imageDessinee) return
    const b = decodees.get(i)!
    const { width: cl, height: ch } = canvasSeq
    const e = Math.max(cl / b.width, ch / b.height)
    ctxSeq.drawImage(b, (cl - b.width * e) / 2, (ch - b.height * e) / 2, b.width * e, b.height * e)
    imageDessinee = i
    racine.dataset.sequencePrete = ''
  }

  // ── Filet d'huile (canvas) ────────────────────────────────────────────────
  const courbe = (a: Pt, b: Pt, t: number): Pt => {
    // Mobile : chute verticale. Desktop : départ horizontal puis chute (parabole).
    const c = format === 'mobile' ? { x: a.x, y: (a.y + b.y) / 2 } : { x: (a.x + b.x) / 2, y: a.y }
    const u = 1 - t
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }
  }

  function dessinerFilet(goulot: Pt, debut: number, fin: number, temps: number) {
    if (!ctxFilet) return
    ctxFilet.clearRect(0, 0, canvasFilet.width, canvasFilet.height)
    if (fin - debut <= 0.001) return
    ctxFilet.save()
    ctxFilet.scale(dpr, dpr)
    ctxFilet.beginPath()
    for (let k = 0; k <= 24; k++) {
      const p = courbe(goulot, filler, mix(debut, fin, k / 24))
      if (k === 0) ctxFilet.moveTo(p.x, p.y)
      else ctxFilet.lineTo(p.x, p.y)
    }
    const degrade = ctxFilet.createLinearGradient(goulot.x, goulot.y, filler.x, filler.y)
    degrade.addColorStop(0, HERO.couleurs.huile[0])
    degrade.addColorStop(1, HERO.couleurs.huile[1])
    ctxFilet.lineCap = 'round'
    ctxFilet.lineWidth = format === 'mobile' ? 6 : 8
    ctxFilet.strokeStyle = degrade
    ctxFilet.stroke()
    // Reflet qui défile vers le bas.
    ctxFilet.lineWidth = 2
    ctxFilet.strokeStyle = HERO.couleurs.refletHuile
    ctxFilet.globalAlpha = 0.75
    ctxFilet.setLineDash([14, 26])
    ctxFilet.lineDashOffset = -temps * 0.15
    ctxFilet.stroke()
    ctxFilet.restore()
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  let progression = 0
  let filetVisible = false
  let imageFiletPresente = false // le canvas du filet contient encore un dessin à effacer

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
      b.el.toggleAttribute('data-actif', o > 0.5)
    }

    // t1 : l'huile monte dans le bidon.
    niveau?.setAttribute('transform', `translate(0 ${mix(260, 70, doux(local(p, T1.debut, T1.fin)))})`)

    // t2 : le bouchon saute, le bidon bascule et se place au-dessus du filler.
    const t2 = local(p, T2.debut, T2.fin)
    const t3 = local(p, T3.debut, T3.fin)
    const sautBouchon = doux(local(t2, 0, 0.2))
    bouchon?.setAttribute('transform', `translate(${sautBouchon * 30} ${-sautBouchon * 90}) rotate(${sautBouchon * 40} 52 9)`)
    bouchon?.setAttribute('opacity', String(1 - sautBouchon))
    const bascule = mouvementReduit ? 0 : doux(local(t2, 0.15, 0.7))
    const sortie = mouvementReduit ? local(t2, 0, 0.5) : local(t3, 0.1, 0.25)
    bidon.style.transform = `translate3d(${deplacement.x * bascule}px, ${deplacement.y * bascule}px, 0) rotate(${HERO.angleVersement * bascule}deg)`
    bidon.style.opacity = String(1 - sortie)

    // Filet : naît en fin de bascule, se détache du goulot au début de t3.
    const tete = mouvementReduit ? 0 : local(t2, 0.7, 0.9)
    const queue = local(t3, 0.05, 0.25)
    filetVisible = tete > queue && bascule > 0
    if (filetVisible || imageFiletPresente) {
      const g = tournerAutour(goulotRepos, pivot, HERO.angleVersement * bascule)
      dessinerFilet({ x: g.x + deplacement.x * bascule, y: g.y + deplacement.y * bascule }, queue, tete, temps)
      imageFiletPresente = filetVisible
    }

    // t3 : séquence (standard/full) ou affiches en fondu (lite).
    if (seq) {
      const voulue = imageDepuis(t3, seq.images)
      if (voulue !== imageVoulue) {
        imageVoulue = voulue
        decoderAutour()
      }
      dessinerSequence()
    } else {
      affiches.e2?.style.setProperty('opacity', String(local(t3, 0, 0.1) * (1 - local(t3, 0.5, 0.6))))
      affiches.e3?.style.setProperty('opacity', String(local(t3, 0.5, 0.6)))
    }
  }

  // ── Boucle : rendu à la demande, garde-fou de performance ─────────────────
  let rafEnAttente = false
  let dernierTemps = 0
  let echantillons: { t: number; d: number }[] = []

  function demanderRendu() {
    if (rafEnAttente) return
    rafEnAttente = true
    requestAnimationFrame(image)
  }

  function image(temps: number) {
    rafEnAttente = false
    const ecart = temps - dernierTemps
    dernierTemps = temps
    if (ecart < 100) surveiller(temps, ecart) // seules les images consécutives comptent
    lireProgression()
    rendre(temps)
    if (filetVisible) demanderRendu() // le reflet du filet défile tant qu'il est visible
  }

  function surveiller(temps: number, ecart: number) {
    if (palier === 'lite' || forcage) return // ?tier= : palier imposé (tests, démonstration)
    echantillons.push({ t: temps, d: ecart })
    while (echantillons.length && temps - echantillons[0].t > HERO.gardeFou.dureeMs) echantillons.shift()
    const couvert = echantillons.length > 1 ? temps - echantillons[0].t : 0
    const moyenne = echantillons.reduce((s, e) => s + e.d, 0) / echantillons.length
    if (couvert >= HERO.gardeFou.dureeMs * 0.9 && moyenne > HERO.gardeFou.msParImage) {
      palier = palierInferieur(palier)
      echantillons = []
      console.info(`[hero] rendu trop lent (${moyenne.toFixed(1)} ms/image) → palier ${palier}`)
      mesurer()
      chargerSequence()
    }
  }

  // ── Démarrage ──────────────────────────────────────────────────────────────
  racine.dataset.palier = palier
  racine.dataset.pret = ''
  mesurer()
  lireProgression()
  rendre(0)
  addEventListener('scroll', demanderRendu, { passive: true })

  let formatPrecedent: Format = format
  let minuterie = 0
  addEventListener('resize', () => {
    clearTimeout(minuterie)
    minuterie = window.setTimeout(() => {
      mesurer()
      imageDessinee = -1
      if (format !== formatPrecedent) {
        formatPrecedent = format
        chargerSequence()
      }
      demanderRendu()
    }, 150)
  })

  // La séquence ne se charge qu'après la page (l'affiche e1 reste le LCP) et
  // quand le hero est proche de l'écran.
  const demarrerSequence = () => {
    const obs = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((e) => e.isIntersecting)) return
        obs.disconnect()
        chargerSequence()
      },
      { rootMargin: '50% 0px' },
    )
    obs.observe(racine)
  }
  if (document.readyState === 'complete') demarrerSequence()
  else addEventListener('load', demarrerSequence, { once: true })
}
