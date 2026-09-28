/**
 * noyau.ts — moteur commun des heros vidéo mobile et desktop.
 *
 * Chaque format a son composant (HeroMobile.astro / HeroDesktop.astro), son point
 * d'entrée (mobile.ts / desktop.ts) et ses réglages (hero-video.config.ts) ; ce
 * fichier ne contient que ce qui est identique : textes, bidon, filet, étiquettes,
 * séquence.
 *
 * Déroulé (HERO.temps) : l'huile monte dans le bidon debout (t1) ; le bouchon saute,
 * le bidon, à gauche du moteur, se penche et verse un filet en chute libre dans
 * l'orifice (t2) ; pendant t3 la séquence montre l'huile qui descend dans le moteur en
 * coupe (cames, pistons, vilebrequin), le filet se tarit, le bidon se redresse, et
 * chaque pièce reçoit son étiquette quand l'huile l'atteint.
 *
 *  - un seul écouteur de scroll passif, rendu dans requestAnimationFrame ;
 *  - DOM : on n'écrit que opacity et transform (tailles et positions au redimensionnement) ;
 *  - séquence : chargée après l'événement load, une image sur 4 d'abord, puis le reste ;
 *    seules les images proches de l'image courante restent décodées (ImageBitmap) ;
 *  - palier lite (économie de données, 2G/3G, ≤ 2 Go, mouvement réduit) : deux images
 *    seulement (moteur sec, moteur huilé), en fondu.
 */
import { dansImage, MOTEUR, PLANS_T3, type ReglagesHeroVideo, RETARD_REPERE } from '@/hero-video.config'
import { HERO } from '@/hero.config'
import { borner, doux, local, mix, opaciteBloc, tournerAutour } from '@/lib/hero-timeline'
import { couverture, type Couverture, indexImage, ordreChargement, plusProche, pointCouvert } from '@/lib/sequence-images'
import { placerGoulot, pointFilet, type Pt } from '@/lib/versement'

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
/** Fin de la séquence dans t3 (ensuite : dernière image, tout est huilé). */
const FIN_SEQUENCE = PLANS_T3[PLANS_T3.length - 1][1]
/** Pente du filet à la sortie du goulot (dy/dx) : le goulot du bidon basculé pointe un peu vers le bas. */
const PENTE_FILET = 0.25
/**
 * Surface de l'huile dans le bidon, en hauteurs de bidon depuis le haut du bidon debout
 * (plein, finale), ou par rapport au pivot quand il penche (versement, tari ; > 0 : sous
 * le pivot). Le goulot basculé est à +0,026 : l'huile coule tant que la surface est au-dessus.
 */
const SURFACE = { plein: 0.32, finale: 0.62, versement: -0.01, tari: 0.06 }

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
  const colonne = R.reperes === 'colonne'
  const reperes = [...racine.querySelectorAll<HTMLElement>('[data-repere]')].map((el, i) => ({
    el,
    point: el.querySelector<HTMLElement>('[data-point]')!,
    trait: el.querySelector<HTMLElement>('[data-trait]')!,
    etiquette: el.querySelector<HTMLElement>('[data-etiquette]')!,
    // L'étiquette arrive peu après le début du plan où l'huile atteint la pièce.
    apparition: PLANS_T3[i][0] + RETARD_REPERE,
    ancre: { x: 0, y: 0 },
    etiquetteX: 0,
    traitX: 0,
  }))
  const ctxMoteur = canvasMoteur.getContext('2d')!
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
  let boite = { x: 0, y: 0, l: 0, h: 0 } // canvas de la séquence, dans la scène
  let dpr = 1
  let couv: Couverture = { x: 0, y: 0, l: 0, h: 0 }
  let orifice: Pt = { x: 0, y: 0 }
  let goulotRepos: Pt = { x: 0, y: 0 }
  let pivot: Pt = { x: 0, y: 0 }
  let deplacement: Pt = { x: 0, y: 0 }
  let hauteurBidon = 0

  function dimensionner(c: HTMLCanvasElement, echelle: number, taille = ecran) {
    const l = Math.round(taille.l * echelle)
    const h = Math.round(taille.h * echelle)
    if (c.width !== l) c.width = l
    if (c.height !== h) c.height = h
  }

  /** Point de la vidéo source → position dans la scène (px). */
  const aLEcran = (p: Pt): Pt => {
    const q = pointCouvert(dansImage(p, S.recadrage), couv)
    return { x: boite.x + q.x, y: boite.y + q.y }
  }

  function mesurer() {
    ecran = { l: scene.clientWidth, h: scene.clientHeight }
    const zm = R.zones.moteur
    boite = { x: zm.x * ecran.l, y: zm.y * ecran.h, l: zm.l * ecran.l, h: zm.h * ecran.h }
    Object.assign(canvasMoteur.style, { left: `${boite.x}px`, top: `${boite.y}px`, width: `${boite.l}px`, height: `${boite.h}px` })
    couv = couverture({ l: S.largeur, h: S.hauteur }, boite, S.focale.x, S.focale.y, S.zoom)
    // Jamais plus défini que l'image source : inutile de peindre des pixels inventés.
    dpr = Math.min(devicePixelRatio || 1, S.dprMax, Math.max(1, S.largeur / couv.l))
    dimensionner(canvasMoteur, dpr, boite)
    dimensionner(canvasFilet, Math.min(devicePixelRatio || 1, 2))
    orifice = aLEcran(MOTEUR.orifice)

    // Bidon debout, à gauche ; basculé, son goulot vient au-dessus et à gauche de l'orifice.
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
    const goulotBascule = tournerAutour(goulotRepos, pivot, HERO.angleVersement)
    const arrivee = placerGoulot({
      orifice,
      cible: R.cibleGoulot,
      bidon: { l, h },
      goulotVersPivot: { x: pivot.x - goulotBascule.x, y: pivot.y - goulotBascule.y },
      angle: HERO.angleVersement,
      gauche: 8,
      haut: R.zones.entete.h * ecran.h * 0.7,
    })
    deplacement = { x: arrivee.x - goulotBascule.x, y: arrivee.y - goulotBascule.y }

    // Étiquettes : point sur la pièce, trait, étiquette (à droite du moteur, ou pastille
    // à gauche du point).
    const bord = aLEcran({ x: MOTEUR.bordDroit, y: 0 }).x
    for (const [i, r] of reperes.entries()) {
      r.ancre = aLEcran(MOTEUR.pieces[i])
      const largeur = r.etiquette.offsetWidth
      if (colonne) {
        r.etiquetteX = Math.min(bord + 28, ecran.l - largeur - 16)
        r.traitX = r.ancre.x
      } else {
        r.etiquetteX = Math.max(8, r.ancre.x - 14 - largeur)
        r.traitX = r.etiquetteX + largeur
      }
      r.trait.style.width = `${Math.max(0, colonne ? r.etiquetteX - r.ancre.x : r.ancre.x - r.traitX)}px`
      r.trait.style.transformOrigin = colonne ? '0 50%' : '100% 50%'
      r.point.style.transform = `translate3d(${r.ancre.x}px, ${r.ancre.y}px, 0)`
    }
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
      canvasMoteur.style.backgroundImage = 'none'
      affichePresente = false
    }
  }

  function dessinerMoteur(t3: number) {
    if (leger) {
      // Deux images : moteur sec, puis moteur huilé, en fondu pendant t3.
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
    courante = indexImage(local(t3, 0, FIN_SEQUENCE), total)
    garderDecodees()
    const i = plusProche(courante, (k) => bitmaps.has(k) || chargees.has(k), total)
    if (i === null || i === derniereDessinee) return
    const source = bitmaps.get(i) ?? images[i]
    if (!source) return
    peindre(source)
    derniereDessinee = i
  }

  // ── Filet d'huile : chute libre du goulot à l'orifice ──────────────────────
  const echelleFilet = () => canvasFilet.width / Math.max(1, ecran.l)

  function dessinerFilet(goulot: Pt, debut: number, fin: number, temps: number) {
    ctxFilet.clearRect(0, 0, canvasFilet.width, canvasFilet.height)
    if (fin - debut <= 0.001) return
    const e = R.epaisseurFilet
    const anime = !leger
    ctxFilet.save()
    ctxFilet.scale(echelleFilet(), echelleFilet())

    // Ruban : épais au goulot, il s'affine en tombant (il accélère) ; léger « glouglou ».
    const n = 28
    const bordG: Pt[] = []
    const bordD: Pt[] = []
    const centre: Pt[] = []
    for (let k = 0; k <= n; k++) {
      const t = mix(debut, fin, k / n)
      const p = pointFilet(goulot, orifice, PENTE_FILET, t)
      const q = pointFilet(goulot, orifice, PENTE_FILET, Math.min(1, t + 0.01))
      const norme = Math.hypot(q.x - p.x, q.y - p.y) || 1
      const nx = -(q.y - p.y) / norme
      const ny = (q.x - p.x) / norme
      const ondulation = anime ? 1 + 0.12 * Math.sin(temps * 0.012 - t * 14) : 1
      const demi = (e / 2) * (1 - 0.45 * t) * ondulation
      centre.push(p)
      bordG.push({ x: p.x + nx * demi, y: p.y + ny * demi })
      bordD.push({ x: p.x - nx * demi, y: p.y - ny * demi })
    }
    const degrade = ctxFilet.createLinearGradient(goulot.x, goulot.y, orifice.x, orifice.y)
    degrade.addColorStop(0, HERO.couleurs.huile[0])
    degrade.addColorStop(1, HERO.couleurs.huile[1])
    ctxFilet.beginPath()
    bordG.forEach((p, k) => (k === 0 ? ctxFilet.moveTo(p.x, p.y) : ctxFilet.lineTo(p.x, p.y)))
    for (let k = bordD.length - 1; k >= 0; k--) ctxFilet.lineTo(bordD[k].x, bordD[k].y)
    ctxFilet.closePath()
    ctxFilet.fillStyle = degrade
    ctxFilet.shadowColor = 'rgb(240 204 48 / 0.45)'
    ctxFilet.shadowBlur = e * 1.5
    ctxFilet.fill()
    ctxFilet.shadowBlur = 0
    // Tête arrondie tant que le filet n'a pas atteint l'orifice.
    if (fin < 1) {
      const tete = centre[centre.length - 1]
      ctxFilet.beginPath()
      ctxFilet.arc(tete.x, tete.y, (e / 2) * (1 - 0.45 * fin) * 1.15, 0, Math.PI * 2)
      ctxFilet.fill()
    }
    // Reflet de la lampe (à gauche) qui descend le long du filet.
    ctxFilet.beginPath()
    bordG.forEach((p, k) => {
      const x = mix(centre[k].x, p.x, 0.45)
      const y = mix(centre[k].y, p.y, 0.45)
      if (k === 0) ctxFilet.moveTo(x, y)
      else ctxFilet.lineTo(x, y)
    })
    ctxFilet.lineWidth = Math.max(1, e * 0.18)
    ctxFilet.strokeStyle = HERO.couleurs.refletHuile
    ctxFilet.globalAlpha = 0.8
    ctxFilet.setLineDash([e * 2.5, e * 3.5])
    ctxFilet.lineDashOffset = anime ? -temps * 0.12 : 0
    ctxFilet.lineCap = 'round'
    ctxFilet.stroke()
    ctxFilet.setLineDash([])
    ctxFilet.globalAlpha = 1

    // Arrivée dans l'orifice : petit anneau d'huile et gouttelettes qui rejaillissent.
    if (fin >= 1) {
      const r = e * 1.3
      ctxFilet.beginPath()
      ctxFilet.ellipse(orifice.x, orifice.y, r, r * 0.35, 0, 0, Math.PI * 2)
      ctxFilet.strokeStyle = HERO.couleurs.huile[0]
      ctxFilet.globalAlpha = 0.75
      ctxFilet.lineWidth = Math.max(1, e * 0.25)
      ctxFilet.stroke()
      if (anime) {
        ctxFilet.fillStyle = HERO.couleurs.huile[0]
        for (let k = 0; k < 4; k++) {
          const phase = (temps * 0.0016 + k / 4) % 1
          const sens = k % 2 ? 1 : -1
          ctxFilet.globalAlpha = 0.8 * (1 - phase)
          ctxFilet.beginPath()
          ctxFilet.arc(
            orifice.x + sens * (r * 0.6 + phase * e * 1.8),
            orifice.y - Math.sin(phase * Math.PI) * e * 1.6,
            Math.max(0.8, e * 0.22 * (1 - phase)),
            0,
            Math.PI * 2,
          )
          ctxFilet.fill()
        }
      }
      ctxFilet.globalAlpha = 1
    }
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

    const t2 = local(p, T2.debut, T2.fin)
    const t3 = local(p, T3.debut, T3.fin)
    const disparition = local(p, FIN.debut - 0.02, FIN.debut + 0.005)

    // Bouchon : saute et sort.
    const saut = doux(local(t2, 0, 0.15))
    if (bouchon) {
      const d = hauteurBidon * saut
      bouchon.style.transform = `translate3d(${d * 0.12}px, ${-d * 0.35}px, 0) rotate(${saut * 35}deg)`
      bouchon.style.opacity = String(1 - saut)
    }

    // Bidon : se penche au-dessus de l'orifice, verse, puis se redresse à sa place.
    const penche = doux(local(t2, 0.12, 0.62))
    const retour = mouvementReduit ? 0 : doux(local(t3, 0.3, 0.44))
    const bascule = mouvementReduit ? 0 : penche * (1 - retour)
    const angle = HERO.angleVersement * bascule
    bidon.style.transform = `translate3d(${deplacement.x * bascule}px, ${deplacement.y * bascule}px, 0) rotate(${angle}deg)`
    bidon.style.opacity = String(1 - disparition)

    // Huile dans le bidon : surface horizontale (contre-rotation), qui monte (t1), passe
    // au-dessus du goulot quand il penche, baisse pendant le versement.
    if (niveau) {
      const pivotY = HERO.ancres.bidon.bottlePivot.y
      const monte = mix(1, SURFACE.plein, doux(local(p, T1.debut, T1.fin))) - pivotY
      const versee = local(p, mix(T2.debut, T2.fin, 0.6), mix(T3.debut, T3.fin, 0.26))
      const surface = mix(mix(mix(monte, SURFACE.versement, mouvementReduit ? 0 : penche), SURFACE.tari, versee), SURFACE.finale - pivotY, retour)
      // Ballottement : la surface prend un peu de retard sur les mouvements du bidon.
      const ballottement = mouvementReduit ? 0 : 9 * Math.sin(Math.PI * bascule) * (1 - retour) - 7 * Math.sin(Math.PI * retour)
      niveau.style.transform = `rotate(${-angle + ballottement}deg) translate3d(0, ${surface * hauteurBidon}px, 0)`
    }

    // Filet : sa tête tombe du goulot à l'orifice, sa queue suit quand le bidon est tari.
    const tete = mouvementReduit ? 0 : local(t2, 0.55, 0.78)
    const queue = local(t3, 0.22, 0.3)
    filetVisible = tete > queue && bascule > 0
    if (filetVisible || filetPresent) {
      const g = tournerAutour(goulotRepos, pivot, angle)
      dessinerFilet({ x: g.x + deplacement.x * bascule, y: g.y + deplacement.y * bascule }, queue, tete, temps)
      filetPresent = filetVisible
    }

    // Étiquettes : chaque pièce s'allume quand l'huile l'atteint ; la précédente s'efface à moitié.
    for (const [i, r] of reperes.entries()) {
      const suivante = reperes[i + 1]
      const arrivee = local(t3, r.apparition, r.apparition + 0.02)
      const estompe = suivante ? local(t3, suivante.apparition, suivante.apparition + 0.04) : 0
      r.el.style.opacity = String(arrivee * (1 - 0.5 * estompe) * (1 - disparition))
      const trait = doux(local(t3, r.apparition, r.apparition + 0.035))
      r.trait.style.transform = `translate3d(${r.traitX}px, ${r.ancre.y}px, 0) scaleX(${trait})`
      const o = local(t3, r.apparition + 0.02, r.apparition + 0.06)
      r.etiquette.style.opacity = String(o)
      r.etiquette.style.transform = `translate3d(${r.etiquetteX + (1 - o) * (colonne ? 12 : -8)}px, ${r.ancre.y}px, 0)`
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
      if (filetVisible && !leger) demanderRendu() // le filet ondule, le reflet défile
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
