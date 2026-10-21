// secteurs.mjs — capture de la grille « Nos métiers » de l'accueil.  node secteurs.mjs URL SORTIE.png l h
import puppeteer from 'puppeteer-core'
const [url, sortie, l = '1440', h = '900'] = process.argv.slice(2)
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const page = await nav.newPage()
const mobile = Number(l) < 900
await page.setViewport({ width: Number(l), height: Number(h), deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile })
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await page.goto(url, { waitUntil: 'networkidle0', timeout: 120_000 })
await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)) } })
await page.evaluate(() => document.querySelector('a[href^="/secteurs/"]')?.scrollIntoView({ block: 'start' }))
await new Promise((r) => setTimeout(r, 1500))
await page.screenshot({ path: sortie })
await nav.close()
