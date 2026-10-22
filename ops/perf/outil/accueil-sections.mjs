// accueil-sections.mjs — captures des sections clés de l'accueil.  node accueil-sections.mjs URL DOSSIER l h suffixe
import puppeteer from 'puppeteer-core'
const [url, dossier, l, h, suf] = process.argv.slice(2)
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const page = await nav.newPage()
const m = Number(l) < 900
await page.setViewport({ width: Number(l), height: Number(h), deviceScaleFactor: 1, isMobile: m, hasTouch: m })
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 })
await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)) } })
const prises = [['bidon1', '[data-produit-scroll]', 0.12], ['vitrine', '#produits-vitrine', 0], ['secteurs', '#secteurs', 0], ['certifs', '.bande-certif', 0]]
for (const [nom, sel, f] of prises) {
  const ok = await page.evaluate((sel, f) => {
    const s = document.querySelector(sel)
    if (!s) return false
    const top = s.getBoundingClientRect().top + scrollY
    const course = s.offsetHeight - innerHeight
    scrollTo(0, f > 0 ? top + course * f : top - 70)
    return true
  }, sel, f)
  if (!ok) continue
  await new Promise((r) => setTimeout(r, 1800))
  await page.screenshot({ path: `${dossier}/${nom}-${suf}.png` })
}
await nav.close()
