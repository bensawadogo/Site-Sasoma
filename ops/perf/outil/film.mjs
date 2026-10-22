// film.mjs — filme le hero tel qu'il s'affiche (CDP screencast) pendant qu'on reste à une
// position du scroll : on voit le moteur tourner en temps réel.
//   node film.mjs URL SORTIE.mp4 [progression=0.8] [secondes=4] [largeur=360] [hauteur=800]
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import puppeteer from 'puppeteer-core'

const [url, sortie, prog = '0.8', secondes = '4', l = '360', h = '800'] = process.argv.slice(2)
const navigateur = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
})
const page = await navigateur.newPage()
const mobile = Number(l) < 900
await page.setViewport({ width: Number(l), height: Number(h), deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile })
// Chrome sans interface annonce « mouvement réduit » : on reprend le réglage courant d'un visiteur.
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await page.goto(url, { waitUntil: 'networkidle0', timeout: 120_000 })
await new Promise((r) => setTimeout(r, 1000))
const cdp = await page.createCDPSession()
const images = []
cdp.on('Page.screencastFrame', async (f) => {
  images.push({ data: f.data, t: f.metadata.timestamp })
  await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
})
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, everyNthFrame: 1 })
await page.evaluate((p) => {
  const hero = [...document.querySelectorAll('[data-palier]')].find((e) => e.offsetHeight > 0)
  scrollTo(0, hero.offsetTop + (hero.offsetHeight - innerHeight) * p)
}, Number(prog))
await new Promise((r) => setTimeout(r, Number(secondes) * 1000))
await cdp.send('Page.stopScreencast')
await navigateur.close()

// Images à leur vrai rythme (concat avec durées).
const dossier = mkdtempSync(join(tmpdir(), 'film-'))
let liste = ''
images.forEach((im, i) => {
  const f = join(dossier, `${String(i).padStart(4, '0')}.jpg`)
  writeFileSync(f, Buffer.from(im.data, 'base64'))
  const d = i + 1 < images.length ? images[i + 1].t - im.t : 1 / 30
  liste += `file '${f.replaceAll('\\', '/')}'\nduration ${d.toFixed(4)}\n`
})
writeFileSync(join(dossier, 'liste.txt'), liste)
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(dossier, 'liste.txt'),
  '-vf', 'fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2', '-pix_fmt', 'yuv420p', sortie])
const duree = images.length > 1 ? images.at(-1).t - images[0].t : 0
console.log(JSON.stringify({ images: images.length, secondes: +duree.toFixed(2), fpsEcran: +(images.length / duree).toFixed(1) }))
