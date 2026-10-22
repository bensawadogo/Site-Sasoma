// fcp.mjs — premier affichage (FCP) et load, sans ralentissement, n essais.
//   node fcp.mjs URL [n=3]
import puppeteer from 'puppeteer-core'

const [url, n = '3'] = process.argv.slice(2)
const navigateur = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
for (let k = 0; k < Number(n); k++) {
  const ctx = await navigateur.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await page.goto(url, { waitUntil: 'load' })
  await new Promise((r) => setTimeout(r, 3000))
  const m = await page.evaluate(() => {
    const p = Object.fromEntries(performance.getEntriesByType('paint').map((e) => [e.name, Math.round(e.startTime)]))
    const nav = performance.getEntriesByType('navigation')[0]
    return { fcp: p['first-contentful-paint'], load: Math.round(nav.loadEventEnd) }
  })
  console.log(JSON.stringify(m))
  await ctx.close()
}
await navigateur.close()
