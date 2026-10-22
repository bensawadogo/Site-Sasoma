// captures.mjs — rendu réel du hero en taille téléphone (360×800, DPR 2) à plusieurs
// moments du défilement.  node captures.mjs URL DOSSIER 0.3,0.6,0.9 [largeur hauteur]
import puppeteer from 'puppeteer-core'

const [url, dossier, points = '0.5', l = '360', h = '800'] = process.argv.slice(2)
const navigateur = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const page = await navigateur.newPage()
const mobile = Number(l) < 900
await page.setViewport({ width: Number(l), height: Number(h), deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile })
// Chrome sans interface annonce « mouvement réduit » : on reprend le réglage courant d'un visiteur.
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await page.goto(url, { waitUntil: 'networkidle0', timeout: 120_000 })
await new Promise((r) => setTimeout(r, 1500))
for (const p of points.split(',').map(Number)) {
  await page.evaluate((p) => {
    const hero = [...document.querySelectorAll('[data-palier]')].find((e) => e.offsetHeight > 0)
    scrollTo(0, hero.offsetTop + (hero.offsetHeight - innerHeight) * p)
  }, p)
  await new Promise((r) => setTimeout(r, 900))
  await page.screenshot({ path: `${dossier}/hero-${mobile ? 'm' : 'd'}-${p}.png` })
}
await navigateur.close()
