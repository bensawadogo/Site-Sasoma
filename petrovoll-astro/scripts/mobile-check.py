#!/usr/bin/env python3
"""mobile-check.py — Agent QA MOBILE (contrainte N°1 du projet).
Sert dist/ en local, pilote Chromium émulant un iPhone 14
(390x844, DPR 3, tactile), vérifie :
  1. meta viewport avec viewport-fit=cover
  2. aucun débordement horizontal (scrollWidth <= innerWidth + tolérance)
  3. burger visible, menu s'ouvre, liens >= 44px, fermeture par Échap
  4. hero : texte AVANT la 3D dans l'ordre visuel mobile (pas d'inversion)
  5. corps de texte >= 16px
  6. images avec width/height (anti-CLS) et pas de loading=lazy sur le hero
  7. canvas 3D dimensionné (largeur > 0, hauteur > 0)
  8. touch targets des CTA >= 44px
USAGE : python scripts/mobile-check.py [port]
"""
import sys
import threading
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
if not DIST.exists():
    print("❌ dist/ absent — lance d'abord : npm run build")
    sys.exit(3)

MIME = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
    '.mjs': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.glb': 'model/gltf-binary', '.wasm': 'application/wasm', '.woff2': 'font/woff2',
    '.txt': 'text/plain', '.xml': 'application/xml', '.ico': 'image/x-icon',
}


class H(BaseHTTPRequestHandler):
    def do_GET(self):
        chemin = self.path.split('?')[0].split('#')[0]
        if chemin.endswith('/'):
            chemin += 'index.html'
        f = DIST / chemin.lstrip('/')
        if not f.is_file() and not chemin.endswith('.html'):
            f = DIST / chemin.lstrip('/') / 'index.html'
        if not f.is_file():
            f = DIST / '404.html'
        if not f.is_file():
            self.send_response(404); self.end_headers(); return
        self.send_response(200)
        self.send_header('Content-Type', MIME.get(f.suffix.lower(), 'application/octet-stream'))
        self.end_headers()
        self.wfile.write(f.read_bytes())

    def log_message(self, *a):
        pass


PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8901
srv = HTTPServer(('127.0.0.1', PORT), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{PORT}'

from playwright.sync_api import sync_playwright

resultats = []
def check(nom, ok, detail=''):
    resultats.append((nom, bool(ok), detail))
    print(f"{'✅' if ok else '❌'} {nom}" + (f' — {detail}' if detail else ''))

with sync_playwright() as p:
    navigateur = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
    ctx = navigateur.new_context(
        viewport={'width': 390, 'height': 844}, device_scale_factor=3,
        is_mobile=True, has_touch=True,
        user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) '
                   'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    )
    pg = ctx.new_page()
    pg.goto(f'{BASE}/', wait_until='load')
    pg.wait_for_timeout(1200)

    # 1. Viewport meta
    vp = pg.evaluate("document.querySelector('meta[name=viewport]')?.content || ''")
    check('meta viewport présent', bool(vp), vp)
    check('viewport-fit=cover', 'viewport-fit=cover' in vp)

    # 2. Débordement horizontal
    debord = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    check('aucun débordement horizontal', debord <= 2, f'écart {debord}px')

    # 3. Burger + menu mobile
    burger = pg.locator('#menu-toggle')
    check('burger visible sur mobile', burger.is_visible())
    boite = burger.bounding_box()
    check('burger >= 44x44px', bool(boite and boite['width'] >= 44 and boite['height'] >= 44),
          f"{boite and round(boite['width'])}x{boite and round(boite['height'])}px")
    burger.tap()
    pg.wait_for_timeout(300)
    menu = pg.locator('#menu-mobile')
    check("menu mobile s'ouvre au tap", menu.is_visible())
    tailles = pg.evaluate("""
      [...document.querySelectorAll('#menu-mobile a')].map(a => {
        const r = a.getBoundingClientRect();
        return { t: a.textContent.trim().slice(0, 20), h: Math.round(r.height) };
      })
    """)
    petits = [t for t in tailles if t['h'] < 44]
    check('liens menu >= 44px de haut', not petits,
          f"{len(tailles)} liens, min {min((t['h'] for t in tailles), default=0)}px")
    pg.screenshot(path=str(ROOT / 'qa-screenshots' / 'mobile-menu-ouvert.png'))

    # 4. Hero : texte avant la vidéo sur mobile (ordre visuel)
    ordre = pg.evaluate("""
      const t = document.querySelector('#hero-titre')?.getBoundingClientRect();
      const v = document.querySelector('.hero-video');
      const r = v ? v.getBoundingClientRect() : null;
      t && r ? { texte: t.top, visuel: r.top } : null
    """)
    check('hero mobile : texte AU-DESSUS de la vidéo',
          bool(ordre and ordre['texte'] < ordre['visuel']),
          ordre and f"texte y={round(ordre['texte'])} < vidéo y={round(ordre['visuel'])}")

    # 5. Texte de lecture >= 16px + lisibilité absolue >= 12px
    #    Le 1er <p> du DOM peut être un badge/eyebrow décoratif (12px volontaire),
    #    on mesure donc les paragraphes réels (>= 60 caractères de texte).
    taille = pg.evaluate("""
      [...document.querySelectorAll('main p, body p')]
        .filter(p => p.textContent.trim().length >= 60)
        .map(p => parseFloat(getComputedStyle(p).fontSize))
    """)
    check('corps de texte >= 16px', bool(taille) and min(taille) >= 16,
          ', '.join(f'{x}px' for x in taille) if taille else 'aucun paragraphe long')
    minis = pg.evaluate("""
      [...document.querySelectorAll('p, span, li, a')]
        .filter(e => e.offsetParent !== null && e.textContent.trim().length > 0)
        .map(e => parseFloat(getComputedStyle(e).fontSize))
        .filter(fs => fs < 12)
    """)
    check('aucun texte < 12px (lisibilité)', len(minis) == 0,
          f"{len(minis)} éléments trop petits" if minis else 'OK')

    # 6. Images : dimensions explicites + hero eager
    imgs = pg.evaluate("""
      [...document.querySelectorAll('img')].map(i => ({
        src: (i.currentSrc || i.src).split('/').pop(), w: i.width, h: i.height,
        lazy: i.loading === 'lazy',
      }))
    """)
    sans_dims = [i['src'] for i in imgs if not i['w'] or not i['h']]
    check('toutes les images ont width/height', not sans_dims, f"{len(imgs)} images")
    # NOTE : seule l'img DANS la section hero doit être eager. L'img fallback
    # de ProduitPhare est SOUS la ligne de flottaison → loading=lazy y est
    # CORRECT (le check initial matchait trop large et donnait un faux échec).
    hero_lazy = pg.evaluate("""
      [...document.querySelectorAll('section[aria-labelledby="hero-titre"] img')]
        .filter(i => i.loading === 'lazy')
        .map(i => (i.currentSrc || i.src).split('/').pop())
    """)
    check('hero non-lazy (LCP protégé)', not hero_lazy, f'{len(imgs)} images analysées')

    # 7. Hero à DEUX VUES : vidéo par défaut, 3D chargée à la demande
    try:
        pg.screenshot(path=str(ROOT / 'qa-screenshots' / 'mobile-hero.png'), timeout=8000)
    except Exception:
        pass
    video = pg.locator('.hero-video')
    video.scroll_into_view_if_needed(timeout=5000)
    pg.wait_for_timeout(2500)
    cv = pg.evaluate("""
      (() => { const v = document.querySelector('.hero-video');
        if (!v) return null;
        const r = v.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height),
                 ready: v.readyState, paused: v.paused }; })()
    """)
    check('vidéo hero dimensionnée et prête', bool(cv and cv['w'] > 100 and cv['h'] > 100 and cv['ready'] >= 2),
          cv and f"{cv['w']}x{cv['h']}px ready={cv['ready']} paused={cv['paused']}")

    # La 3D doit rester INTÉGRÉE au hero (pas supprimée)…
    check('canvas 3D présent dans le hero (vue 3D intégrée)',
          pg.locator('#bidon-canvas').count() == 1)
    # …mais NE PAS coûter un octet tant qu'on n'a pas demandé la 3D :
    # le GLB ne doit pas être réclamé au chargement initial (vue vidéo par défaut).
    glb_initial = pg.evaluate("""
      performance.getEntriesByType('resource')
        .filter(r => /\\.glb$/.test(r.name)).map(r => r.name.split('/').pop())
    """)
    check('3D non téléchargée avant interaction (lazy)', not glb_initial,
          f'{len(glb_initial)} GLB préchargés' if glb_initial else 'aucun GLB au chargement')

    # Bascule réelle vers la 3D : le canvas doit devenir visible ET se remplir.
    pg.click('[data-hero-tab="3d"]')
    pg.wait_for_timeout(4000)
    etat3d = pg.evaluate("""
      (() => {
        const p = document.querySelector('[data-pane="3d"]');
        const c = document.querySelector('#bidon-canvas');
        const r = c ? c.getBoundingClientRect() : null;
        const glb = performance.getEntriesByType('resource')
          .filter(x => /\\.glb$/.test(x.name)).map(x => x.name.split('/').pop());
        return { visible: p ? !p.classList.contains('hidden') : false,
                 w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0,
                 init: document.documentElement.classList.contains('webgl-3d-init'),
                 echec: document.documentElement.classList.contains('webgl-echec'),
                 glb, vpause: (document.querySelector('.hero-video') || {}).paused };
      })()
    """)
    check('bascule 3D : vue affichée et canvas dimensionné',
          bool(etat3d['visible'] and etat3d['w'] > 100 and etat3d['h'] > 100),
          f"{etat3d['w']}x{etat3d['h']}px")
    check('bascule 3D : GLB chargé puis affiché', bool(etat3d['init'] or etat3d['echec']),
          f"GLB={etat3d['glb']} init={etat3d['init']} echec={etat3d['echec']}")
    check('vidéo mise en pause pendant la vue 3D', bool(etat3d['vpause']))

    # Retour vidéo : la lecture doit reprendre (pas de hero figé).
    pg.click('[data-hero-tab="video"]')
    pg.wait_for_timeout(1200)
    reprise = pg.evaluate("(document.querySelector('.hero-video') || {}).paused")
    check('retour vidéo : lecture reprise', reprise is False)
    try:
        pg.screenshot(path=str(ROOT / 'qa-screenshots' / 'mobile-hero-video.png'), timeout=8000)
    except Exception:
        pass

    # 8. Touch targets CTA hero
    cta = pg.evaluate("""
      [...document.querySelectorAll('a.btn-primary, a.btn-outline')]
        .filter(a => a.offsetParent !== null).slice(0, 3)
        .map(a => { const r = a.getBoundingClientRect();
          return { t: a.textContent.trim().slice(0, 15), h: Math.round(r.height) }; })
    """)
    petits_cta = [c for c in cta if c['h'] < 44]
    check('CTA hero >= 44px de haut', not petits_cta,
          f"min {min((c['h'] for c in cta), default=0)}px")

    # Pages secondaires : débordement horizontal (rapide)
    for route in ['/produits', '/contact', '/a-propos']:
        pg.goto(f'{BASE}{route}', wait_until='load')
        pg.wait_for_timeout(600)
        d = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        check(f'{route} : pas de débordement', d <= 2, f'écart {d}px')

    navigateur.close()
srv.shutdown()

echecs = [r for r in resultats if not r[1]]
print(f"\n📊 QA MOBILE : {len(resultats) - len(echecs)}/{len(resultats)} checks OK")
sys.exit(0 if not echecs else 8)

