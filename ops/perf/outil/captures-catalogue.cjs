// captures-catalogue.cjs — catalogue, aperçu rapide, fiches produit, 1440×900 et 390×844.
// NODE_PATH=ops/perf/outil/node_modules node captures-catalogue.cjs http://localhost:5056 DOSSIER
const puppeteer = require('puppeteer-core')
const [base, dossier] = process.argv.slice(2)
const pages = [
  ['catalogue', '/produits'],
  ['fiche-stark-fully', '/produits/petrovoll-stark-fully-synthetic'],
  ['fiche-sans-variantes', '/produits/petrovoll-fuel-injector-cleaner'],
]
const attendre = (ms) => new Promise((r) => setTimeout(r, ms))
;(async () => {
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
  for (const [l, h, suffixe] of [[1440, 900, '1440x900'], [390, 844, '390x844']]) {
    const mobile = l < 900
    const ouvrirPage = async (chemin) => {
      const page = await nav.newPage()
      await page.setViewport({ width: l, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile })
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
      await page.goto(base + chemin, { waitUntil: 'networkidle0', timeout: 120000 })
      await attendre(600)
      return page
    }
    for (const [nom, chemin] of pages) {
      const page = await ouvrirPage(chemin)
      const debord = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      console.log(nom, suffixe, 'débordement horizontal:', debord)
      const hauteur = await page.evaluate(() => document.documentElement.scrollHeight)
      await page.screenshot({ path: `${dossier}/${nom}-${suffixe}.png`, captureBeyondViewport: true, clip: { x: 0, y: 0, width: l, height: Math.min(hauteur, nom === 'catalogue' ? 2600 : 3200) } })
      if (nom === 'catalogue') {
        // Aperçu rapide : clic sur la carte STÄRK Fully.
        await page.evaluate(() => document.querySelector('a[data-apercu="petrovoll-stark-fully-synthetic"]').scrollIntoView({ block: 'center' }))
        await attendre(300)
        await page.click('a[data-apercu="petrovoll-stark-fully-synthetic"]')
        await attendre(700)
        console.log('aperçu ouvert:', await page.evaluate(() => document.querySelector('dialog.apercu').open))
        await page.screenshot({ path: `${dossier}/apercu-${suffixe}.png` })
        await page.keyboard.press('Escape')
        await attendre(300)
        console.log('fermé par Échap, focus rendu à:', await page.evaluate(() => document.activeElement.dataset.apercu))
        // Filtre actif : barre collante + résultats
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.type('#recherche', '5W-30')
        await attendre(400)
        await page.evaluate(() => window.scrollTo(0, 500))
        await attendre(300)
        await page.screenshot({ path: `${dossier}/catalogue-filtre-${suffixe}.png` })
        if (mobile) {
          await page.click('[data-ouvrir-tiroir]')
          await attendre(500)
          await page.screenshot({ path: `${dossier}/tiroir-${suffixe}.png` })
        }
      }
      await page.close()
    }
  }
  await nav.close()
})()
