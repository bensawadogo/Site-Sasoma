// scroll.mjs — banc d'essai du hero : téléphone d'entrée de gamme simulé (CPU ÷ 6, 360×800,
// DPR 2, réseau 4G lente), défilement à vitesse constante, mesure des images (frames).
//   node scroll.mjs http://localhost:5055/apercu-hero [ralentissement=6] [palier]
import puppeteer from 'puppeteer-core'

const [url = 'http://localhost:5055/apercu-hero', ralenti = '6', palier = '', css = ''] = process.argv.slice(2)
const navigateur = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
})
const page = await navigateur.newPage()
await page.emulate({
  viewport: { width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-A022F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
})
const cdp = await page.createCDPSession()
if (process.env.BLOQUER) {
  // Essai : bloquer une ressource (ex. les pièces mobiles) pour mesurer son coût.
  await page.setRequestInterception(true)
  page.on('request', (r) => (r.url().includes(process.env.BLOQUER) ? r.abort() : r.continue()))
}
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(ralenti) })
// 4G lente : 1,6 Mb/s, 150 ms de latence.
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200_000, uploadThroughput: 90_000 })
const t0 = Date.now()
// Chrome sans interface annonce « mouvement réduit » : on reprend le réglage courant d'un visiteur.
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await page.goto(url + (palier ? `?tier=${palier}` : ''), { waitUntil: 'load', timeout: 120_000 })
const chargement = Date.now() - t0
if (css) await page.addStyleTag({ content: css }) // essai : masquer un élément pour mesurer son coût
await new Promise((r) => setTimeout(r, Number(process.env.ATTENTE ?? 6000))) // la séquence se charge après load
const res = await page.evaluate(async () => {
  const loafs = []
  new PerformanceObserver((l) => loafs.push(...l.getEntries())).observe({ type: 'long-animation-frame' })
  const hero = document.querySelector('[data-palier]')
  const course = hero.offsetHeight - innerHeight
  const dts = []
  let dernier = performance.now()
  await new Promise((fin) => {
    const debut = performance.now()
    const DUREE = 5000
    const pas = () => {
      const t = performance.now()
      dts.push(t - dernier)
      dernier = t
      const f = Math.min(1, (t - debut) / DUREE)
      scrollTo(0, course * f)
      if (f < 1) requestAnimationFrame(pas)
      else fin()
    }
    requestAnimationFrame(pas)
  })
  await new Promise((r) => setTimeout(r, 300))
  const tri = [...dts].sort((a, b) => a - b)
  const q = (p) => +tri[Math.floor(tri.length * p)].toFixed(1)
  return {
    palier: hero.dataset.palier,
    images: dts.length,
    fps: +(dts.length / 5).toFixed(1),
    p50: q(0.5),
    p95: q(0.95),
    max: +tri.at(-1).toFixed(1),
    saccades: dts.filter((d) => d > 50).length,
    loaf: loafs
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
      .map((e) => ({
        ms: Math.round(e.duration),
        rendu: Math.round(e.startTime + e.duration - e.renderStart),
        styleLayout: Math.round(e.startTime + e.duration - e.styleAndLayoutStart),
        scripts: e.scripts.map((s) => `${s.sourceFunctionName || s.invoker}@${(s.sourceURL || '').split('/').pop()}:${Math.round(s.duration)}`).join(' | '),
      })),
  }
})
const octets = await page.evaluate(() => performance.getEntriesByType('resource').reduce((s, e) => s + (e.transferSize || 0), 0))
console.log(JSON.stringify({ chargementMs: chargement, poidsKo: Math.round(octets / 1024), ...res }, null, 1))
await navigateur.close()
