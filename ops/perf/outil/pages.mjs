// pages.mjs — captures pleine page de plusieurs pages (rendu réel).  node pages.mjs BASE DOSSIER l h chemin1,chemin2…
import puppeteer from 'puppeteer-core'
const [base, dossier, l = '1440', h = '900', chemins = '/'] = process.argv.slice(2)
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const page = await nav.newPage()
const mobile = Number(l) < 900
await page.setViewport({ width: Number(l), height: Number(h), deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile })
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
for (const c of chemins.split(',')) {
  await page.goto(base + c, { waitUntil: 'networkidle0', timeout: 120_000 })
  await new Promise((r) => setTimeout(r, 1200))
  const nom = (c === '/' ? 'accueil' : c.replace(/\W+/g, '-').replace(/^-|-$/g, '')) + (mobile ? '-m' : '-d')
  await page.screenshot({ path: `${dossier}/${nom}.png`, fullPage: c !== '/' })
}
await nav.close()
