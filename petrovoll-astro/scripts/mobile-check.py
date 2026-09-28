#!/usr/bin/env python3
"""mobile-check.py — Agent QA MOBILE (contrainte N°1 du projet).

Sert dist/ en local (résolution /chemin → chemin.html comme Cloudflare, vrai
statut 404), pilote Chromium en émulation téléphone (tactile, is_mobile) dans
DEUX formats : 360×800 DPR 2 (Android d'entrée de gamme) et 390×844 DPR 3
(iPhone 14), et vérifie :
  1. meta viewport avec viewport-fit=cover ; aucun débordement horizontal
     sur /, /produits, /contact et une fiche produit ;
  2. menu : burger visible (≥ 44 px), s'ouvre au tap, liens ≥ 44 px, Échap
     ferme, page bloquée pendant le menu ouvert (overflow sur <html>) ;
  3. hero au scroll (HeroScroll.astro + hero-scroll.ts) : data-pret posé, aux
     progressions 0 / 0,3 / 0,5 / 0,7 / 1 (scroll = p × (hauteur hero − hauteur
     écran)) : un seul bloc data-actif (le bon), h1 visible à p=0, bloc de fin
     inert à p=0 et plus inert à p=1, bidon et moteur dans l'écran ;
     ?tier=lite|standard|full force bien data-palier ;
  4. aucune requête .glb / bidon-3d / draco pendant tout le parcours du hero
     (la 3D du Produit phare ne démarre qu'une fois à l'écran) ;
  5. corps de texte ≥ 16 px, images avec width/height (anti-CLS), cibles
     tactiles des CTA ≥ 44 px ;
  6. aucune erreur console / exception JS, aucune réponse 4xx/5xx.
Captures : qa-screenshots/ (ignoré par git).
USAGE : python scripts/mobile-check.py [port]      (npm run bidon:mobile)
Ne reconstruit pas : lance d'abord `npm run build` si le code a changé.
"""
import sys
import threading
from urllib.parse import unquote, urlparse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
CAPTURES = ROOT / 'qa-screenshots'
if not (DIST / 'index.html').is_file():
    print("❌ dist/ absent — lance d'abord : npm run build")
    sys.exit(3)

MIME = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
    '.mjs': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp',
    '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary',
    '.wasm': 'application/wasm', '.woff2': 'font/woff2', '.woff': 'font/woff',
    '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4', '.webm': 'video/webm',
}


def resoudre(chemin_url):
    """Même logique que Cloudflare (build.format 'file') :
    /x → x (fichier exact) → x.html → x/index.html ; /x/ → x/index.html."""
    chemin = unquote(chemin_url.split('?')[0].split('#')[0])
    rel = chemin.lstrip('/')
    candidats = []
    if chemin.endswith('/'):
        candidats.append(rel + 'index.html')
    else:
        candidats += [rel, rel + '.html', rel + '/index.html']
    for c in candidats:
        f = (DIST / c).resolve()
        # Garde-fou : jamais en dehors de dist/
        if (f == DIST.resolve() or DIST.resolve() in f.parents) and f.is_file():
            return f
    return None


class H(BaseHTTPRequestHandler):
    def do_GET(self):
        f = resoudre(self.path)
        statut = 200
        if f is None:
            statut, f = 404, DIST / '404.html'
        corps = f.read_bytes() if f.is_file() else b'404'
        self.send_response(statut)
        self.send_header('Content-Type', MIME.get(f.suffix.lower(), 'application/octet-stream'))
        self.send_header('Content-Length', str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def log_message(self, *a):
        pass


PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8901
srv = ThreadingHTTPServer(('127.0.0.1', PORT), H)
srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{PORT}'

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print('❌ Playwright absent — pip install playwright && python -m playwright install chromium')
    sys.exit(4)

# Une fiche produit réelle (la première du build).
fiches = sorted((DIST / 'produits').glob('*.html'))
PAGES = ['/', '/produits', '/contact'] + ([f'/produits/{fiches[0].stem}'] if fiches else [])

FORMATS = [
    {
        'nom': '360×800 DPR 2', 'cle': '360', 'viewport': {'width': 360, 'height': 800}, 'dpr': 2,
        'ua': 'Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36 '
              '(KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
    },
    {
        'nom': '390×844 DPR 3', 'cle': '390', 'viewport': {'width': 390, 'height': 844}, 'dpr': 3,
        'ua': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) '
              'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    },
]
PROGRESSIONS = [0, 0.3, 0.5, 0.7, 1]
# Tout ce qui appartient à la 3D du Produit phare (modèle, module three.js, décodeur).
MOTIF_3D = ('.glb', 'bidon-3d', '/draco/')

resultats = []
def check(nom, ok, detail=''):
    resultats.append((nom, bool(ok), detail))
    print(f"{'✅' if ok else '❌'} {nom}" + (f' — {detail}' if detail else ''))


def capture(pg, nom):
    try:
        CAPTURES.mkdir(exist_ok=True)
        pg.screenshot(path=str(CAPTURES / nom), timeout=8000)
    except Exception:
        pass


def attendre_rendu(pg, ms=150):
    """Deux images d'animation (le hero rend dans requestAnimationFrame) + marge."""
    pg.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
    pg.wait_for_timeout(ms)


def aller(pg, route):
    pg.goto(f'{BASE}{route}', wait_until='load')
    pg.wait_for_timeout(700)


# ── Mesures exécutées dans la page ───────────────────────────────────────────
JS_DEBORD = "document.documentElement.scrollWidth - window.innerWidth"

# Corps de texte : paragraphes réels (≥ 40 caractères) du contenu + textes du hero.
# Exclus volontairement : surtitres / badges / indice du hero (courts, décoratifs)
# et le fil d'Ariane (<nav>), qui ne sont pas du texte de lecture.
JS_TEXTE = """
  [...document.querySelectorAll('main p')]
    .filter(e => !e.closest('nav'))
    .filter(e => e.textContent.trim().length >= 40 || e.classList.contains('hero-texte'))
    .filter(e => e.getClientRects().length > 0)
    .map(e => ({ t: e.textContent.trim().slice(0, 30), fs: parseFloat(getComputedStyle(e).fontSize) }))
"""

JS_IMAGES = """
  [...document.querySelectorAll('img')].map(i => ({
    src: (i.currentSrc || i.src).split('/').pop().slice(0, 40),
    w: i.getAttribute('width'), h: i.getAttribute('height'),
  }))
"""

# Cibles tactiles : boutons / CTA rendus (même à opacité 0, le bloc de fin est mesuré).
JS_CTA = """
  [...document.querySelectorAll('main a.btn-primary, main a.btn-outline, main button')]
    .filter(e => e.getClientRects().length > 0 && !e.hidden)
    .map(e => { const r = e.getBoundingClientRect();
      return { t: e.textContent.trim().replace(/\\s+/g, ' ').slice(0, 25),
               l: Math.round(r.width), h: Math.round(r.height) }; })
"""

# État du hero à la progression courante.
JS_HERO = """
  (() => {
    const hero = document.querySelector('[data-hero]');
    const vw = innerWidth, vh = innerHeight;
    const dansEcran = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const ix = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
      const iy = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      const aire = r.width * r.height;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      return { part: aire > 0 ? (ix * iy) / aire : 0,
               centre: cx >= 0 && cx <= vw && cy >= 0 && cy <= vh,
               r: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
               o: parseFloat(getComputedStyle(el).opacity) };
    };
    const blocs = [...hero.querySelectorAll('.hero-bloc')];
    const titre = document.getElementById('hero-titre');
    const rt = titre.getBoundingClientRect();
    const pt = document.elementFromPoint(rt.left + rt.width / 2, rt.top + rt.height / 2);
    const fin = hero.querySelector('[data-fin-bloc]');
    return {
      actifs: blocs.map((b, i) => b.hasAttribute('data-actif') ? i : -1).filter(i => i >= 0),
      opacites: blocs.map(b => +parseFloat(getComputedStyle(b).opacity).toFixed(2)),
      bornes: blocs.map(b => [Number(b.dataset.debut), Number(b.dataset.fin)]),
      titre: { dedans: rt.top >= 0 && rt.bottom <= vh && rt.left >= 0 && rt.right <= vw && rt.height > 0,
               o: parseFloat(getComputedStyle(titre.closest('.hero-bloc')).opacity),
               dessus: !!pt && (pt === titre || titre.contains(pt)) },
      finInert: fin ? fin.inert : null,
      bidon: dansEcran(hero.querySelector('[data-bidon-hero]')),
      moteur: dansEcran(hero.querySelector('[data-moteur-cadre] svg')),
      niveau: !!hero.querySelector('[data-bidon-hero] [data-niveau]'),
      bouchon: !!hero.querySelector('[data-bidon-hero] [data-bouchon]'),
      filet: !!hero.querySelector('canvas.hero-filet'),
    };
  })()
"""


def scroller_hero(pg, p):
    """scroll = haut du hero + p × (hauteur hero − hauteur écran)."""
    y = pg.evaluate("""(p) => {
      const h = document.querySelector('[data-hero]');
      const r = h.getBoundingClientRect();
      const y = Math.round(r.top + scrollY + p * (r.height - innerHeight));
      window.scrollTo({ top: y, behavior: 'instant' });
      return y;
    }""", p)
    attendre_rendu(pg)
    return y


def bloc_attendu(bornes, p):
    for i, (d, f) in enumerate(bornes):
        if d <= p < f or (p >= 1 and f >= 1):
            return i
    return None


with sync_playwright() as pw:
    navigateur = pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader'])

    for fmt in FORMATS:
        print(f"\n━━━ {fmt['nom']} (tactile, mobile) ━━━")
        ctx = navigateur.new_context(
            viewport=fmt['viewport'], device_scale_factor=fmt['dpr'],
            is_mobile=True, has_touch=True, user_agent=fmt['ua'], locale='fr-FR',
        )
        pg = ctx.new_page()

        # ── Écoutes : erreurs, 404, requêtes 3D pendant le hero ───────────────
        erreurs, reponses_ko, requetes_3d = [], [], []
        etat = {'route': '', 'hero': False}
        pg.on('console', lambda m: m.type == 'error' and erreurs.append(f"[{etat['route']}] {m.text[:160]}"))
        pg.on('pageerror', lambda e: erreurs.append(f"[{etat['route']}] exception : {str(e)[:160]}"))
        pg.on('response', lambda r: r.status >= 400 and reponses_ko.append(
            f"[{etat['route']}] {r.status} {urlparse(r.url).path}"))
        pg.on('requestfailed', lambda r: 'ERR_ABORTED' not in (r.failure or '') and reponses_ko.append(
            f"[{etat['route']}] échec {r.failure} {r.url[:100]}"))
        pg.on('request', lambda r: etat['hero'] and any(m in r.url for m in MOTIF_3D) and requetes_3d.append(
            urlparse(r.url).path.split('/')[-1]))

        # ── 1 + 5. Pages : viewport, débordement, texte, images, CTA ──────────
        for route in PAGES:
            etat['route'] = route
            etat['hero'] = route == '/'  # la home démarre dans le hero
            aller(pg, route)
            etat['hero'] = False
            vp = pg.evaluate("document.querySelector('meta[name=viewport]')?.content || ''")
            check(f'{route} : meta viewport avec viewport-fit=cover', 'viewport-fit=cover' in vp, vp or 'absente')
            d = pg.evaluate(JS_DEBORD)
            check(f'{route} : aucun débordement horizontal', d <= 1, f'écart {d}px')

            textes = pg.evaluate(JS_TEXTE)
            petits = [t for t in textes if t['fs'] < 16]
            check(f'{route} : corps de texte ≥ 16px', not petits,
                  (f"{len(textes)} paragraphes, min {min(t['fs'] for t in textes)}px" if textes
                   else 'aucun paragraphe de lecture sur cette page')
                  + (f" — trop petits : {petits[:3]}" if petits else ''))

            imgs = pg.evaluate(JS_IMAGES)
            sans = [i['src'] for i in imgs if not i['w'] or not i['h']]
            check(f'{route} : images avec width/height', not sans,
                  f"{len(imgs)} images" + (f" — sans dimensions : {sans[:4]}" if sans else ''))

            cta = pg.evaluate(JS_CTA)
            petits_cta = [c for c in cta if c['h'] < 44 or c['l'] < 44]
            check(f'{route} : CTA ≥ 44px (cible tactile)', not petits_cta,
                  f"{len(cta)} cibles, hauteur min {min((c['h'] for c in cta), default=0)}px"
                  + (f" — trop petites : {petits_cta[:3]}" if petits_cta else ''))

        # ── 2. Menu mobile (sur la home) ──────────────────────────────────────
        etat['route'] = '/ (menu)'
        aller(pg, '/')
        burger = pg.locator('#menu-toggle')
        check('burger visible', burger.is_visible())
        b = burger.bounding_box()
        check('burger ≥ 44×44px', bool(b and b['width'] >= 44 and b['height'] >= 44),
              f"{b and round(b['width'])}×{b and round(b['height'])}px")
        burger.tap()
        pg.wait_for_timeout(300)
        menu = pg.locator('#menu-mobile')
        check("menu s'ouvre au tap", menu.is_visible() and burger.get_attribute('aria-expanded') == 'true')
        liens = pg.evaluate("""
          [...document.querySelectorAll('#menu-mobile a')].map(a => {
            const r = a.getBoundingClientRect();
            return { t: a.textContent.trim().slice(0, 20), h: Math.round(r.height) };
          })
        """)
        petits = [l for l in liens if l['h'] < 44]
        check('liens du menu ≥ 44px', liens and not petits,
              f"{len(liens)} liens, min {min((l['h'] for l in liens), default=0)}px"
              + (f' — trop petits : {petits}' if petits else ''))
        ov = pg.evaluate("getComputedStyle(document.documentElement).overflow")
        avant = pg.evaluate("scrollY")
        pg.mouse.move(fmt['viewport']['width'] / 2, fmt['viewport']['height'] - 20)
        pg.mouse.wheel(0, 600)
        pg.wait_for_timeout(400)
        apres = pg.evaluate("scrollY")
        check('menu ouvert : la page ne défile pas', ov == 'hidden' and apres == avant,
              f'overflow <html> = {ov}, scrollY {avant} → {apres}')
        capture(pg, f"mobile-{fmt['cle']}-menu-ouvert.png")
        pg.keyboard.press('Escape')
        pg.wait_for_timeout(300)
        ov2 = pg.evaluate("document.documentElement.style.overflow")
        focus = pg.evaluate("document.activeElement?.id")
        check('Échap ferme le menu (défilement rendu, focus au burger)',
              not menu.is_visible() and ov2 == '' and focus == 'menu-toggle',
              f'overflow="{ov2}", focus #{focus}')

        # ── 3 + 4. Hero au scroll, sans aucune requête 3D ─────────────────────
        etat['route'] = '/ (hero)'
        etat['hero'] = True
        aller(pg, '/')
        pret = pg.evaluate("document.querySelector('[data-hero]')?.hasAttribute('data-pret')")
        palier = pg.evaluate("document.querySelector('[data-hero]')?.dataset.palier")
        check('hero : data-pret posé (JS lancé)', pret, f'palier auto = {palier}')
        mesure = pg.evaluate("""(() => { const h = document.querySelector('[data-hero]');
          return { h: Math.round(h.getBoundingClientRect().height), vh: innerHeight }; })()""")
        check('hero : zone de scroll plus haute que l’écran', mesure['h'] > mesure['vh'],
              f"{mesure['h']}px pour {mesure['vh']}px d'écran")
        for p in PROGRESSIONS:
            y = scroller_hero(pg, p)
            s = pg.evaluate(JS_HERO)
            if p == 0:
                check('hero p=0 : bidon (niveau + bouchon), moteur SVG et filet présents',
                      s['niveau'] and s['bouchon'] and s['moteur'] and s['filet'])
            attendu = bloc_attendu(s['bornes'], p)
            check(f'hero p={p} : un seul bloc data-actif, le bon',
                  len(s['actifs']) == 1 and s['actifs'][0] == attendu,
                  f"scroll {y}px, actif(s) {s['actifs']} (attendu [{attendu}]), opacités {s['opacites']}")
            for nom in ('bidon', 'moteur'):
                e = s[nom]
                check(f'hero p={p} : {nom} dans l’écran',
                      bool(e and e['centre'] and e['part'] >= 0.5),
                      e and f"{round(e['part'] * 100)} % visible, rect {e['r']}, opacité {round(e['o'], 2)}")
            if p == 0:
                t = s['titre']
                check('hero p=0 : titre h1 visible', t['dedans'] and t['o'] > 0.9 and t['dessus'],
                      f"dans l'écran={t['dedans']}, opacité={t['o']}, au premier plan={t['dessus']}")
                capture(pg, f"mobile-{fmt['cle']}-hero-0.png")
            if p < 1:
                # Invisible = hors du parcours clavier (ses liens ne doivent pas être focusables).
                check(f'hero p={p} : bloc de fin inert (invisible)', s['finInert'] is True,
                      f"inert={s['finInert']}, opacité {s['opacites'][-1]}")
            if p == 0.5:
                capture(pg, f"mobile-{fmt['cle']}-hero-50.png")
            if p == 1:
                check('hero p=1 : bloc de fin plus inert', s['finInert'] is False, f"inert={s['finInert']}")
                capture(pg, f"mobile-{fmt['cle']}-hero-100.png")
        # Retour en arrière : le bloc de fin redevient inert.
        scroller_hero(pg, 0.5)
        re_inert = pg.evaluate("document.querySelector('[data-fin-bloc]').inert")
        check('hero : bloc de fin de nouveau inert en remontant', re_inert is True)

        # Paliers forcés : ?tier=… → data-palier, parcours sans 3D ni double bloc actif.
        for tier in ('lite', 'standard', 'full'):
            etat['route'] = f'/?tier={tier}'
            aller(pg, f'/?tier={tier}')
            pal = pg.evaluate("document.querySelector('[data-hero]')?.dataset.palier")
            doubles = []
            for p in PROGRESSIONS:
                scroller_hero(pg, p)
                n = pg.evaluate("document.querySelectorAll('[data-hero] .hero-bloc[data-actif]').length")
                if n != 1:
                    doubles.append((p, n))
            check(f'?tier={tier} : data-palier forcé, un seul bloc actif partout',
                  pal == tier and not doubles, f'data-palier={pal}' + (f', écarts {doubles}' if doubles else ''))
        pg.wait_for_timeout(1500)  # laisse passer un éventuel chargement différé
        etat['hero'] = False
        check('aucune requête .glb / bidon-3d pendant le hero', not requetes_3d,
              f'requêtes : {sorted(set(requetes_3d))}' if requetes_3d else 'aucune')

        # La 3D doit bien démarrer une fois le Produit phare à l'écran (sinon le test ci-dessus ne prouve rien).
        etat['route'] = '/ (produit phare)'
        a_bidon = pg.evaluate("!!document.querySelector('[data-bidon]')")
        if a_bidon:
            pg.evaluate("document.querySelector('[data-bidon]').scrollIntoView({ block: 'center', behavior: 'instant' })")
            try:
                pg.wait_for_function("""() => { const b = document.querySelector('[data-bidon]');
                  return b.dataset.etat !== 'image' || !b.querySelector('[data-bidon-bouton]').hidden; }""",
                                     timeout=10000)
                ok3d = True
            except Exception:
                ok3d = False
            et = pg.evaluate("document.querySelector('[data-bidon]').dataset.etat")
            check('Produit phare : la 3D démarre une fois à l’écran', ok3d, f'data-etat={et}')
        else:
            check('Produit phare : [data-bidon] présent sur la home', False)

        # ── 6. Erreurs ────────────────────────────────────────────────────────
        pg.wait_for_timeout(500)
        check('aucune erreur console / exception JS', not erreurs,
              f'{len(erreurs)} : ' + ' | '.join(erreurs[:5]) if erreurs else '')
        check('aucune réponse 4xx/5xx ni requête en échec', not reponses_ko,
              f'{len(reponses_ko)} : ' + ' | '.join(sorted(set(reponses_ko))[:6]) if reponses_ko else '')
        ctx.close()

    navigateur.close()
srv.shutdown()

echecs = [r for r in resultats if not r[1]]
print(f"\n📊 QA MOBILE : {len(resultats) - len(echecs)}/{len(resultats)} checks OK")
if echecs:
    print('❌ ÉCHECS :')
    for nom, _, detail in echecs:
        print(f'   • {nom}' + (f' — {detail}' if detail else ''))
sys.exit(0 if not echecs else 8)
