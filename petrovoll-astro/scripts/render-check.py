#!/usr/bin/env python3
"""render-check.py — Agent RENDU : le .glb s'affiche-t-il VRAIMENT ?
Sert le GLB + render-page.html en local, pilote Chromium (Playwright),
lit window.__report (pixels eclaires + erreurs), verdict exit 0/6.
USAGE : python scripts/render-check.py [models/bidon.glb]
"""
import json
import sys
import threading
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GLB_REL = sys.argv[1] if len(sys.argv) > 1 else 'models/bidon.glb'
GLB_FILE = ROOT / 'public' / GLB_REL
if not GLB_FILE.exists():
    print(f'❌ GLB absent : {GLB_FILE}')
    sys.exit(3)

PAGE = (ROOT / 'scripts' / 'render-page.html').read_text(encoding='utf-8').replace('__GLB__', '/' + GLB_REL)
DATA = GLB_FILE.read_bytes()


class H(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' + GLB_REL:
            self.send_response(200)
            self.send_header('Content-Type', 'model/gltf-binary')
            self.end_headers()
            self.wfile.write(DATA)
        elif self.path.startswith('/draco/'):
            # Decodeurs Draco LOCAUX = exactement ce que sert la production
            # (public/draco/, copies par npm run bidon:decoders).
            f = ROOT / 'public' / self.path.lstrip('/')
            if f.is_file():
                self.send_response(200)
                self.send_header('Content-Type',
                                 'application/wasm' if f.suffix == '.wasm' else 'text/javascript')
                self.end_headers()
                self.wfile.write(f.read_bytes())
            else:
                self.send_response(404); self.end_headers()
        else:
            body = PAGE.encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(body)

    def log_message(self, *a):
        pass


srv = HTTPServer(('127.0.0.1', 0), H)
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

from playwright.sync_api import sync_playwright

errs = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(f'http://127.0.0.1:{port}/', wait_until='load')
    try:
        pg.wait_for_function('window.__report !== undefined', timeout=30000)
        report = pg.evaluate('window.__report')
    except Exception as e:
        report = {'lit': -1, 'errs': [f'TIMEOUT 30s : {e}']}
    b.close()
srv.shutdown()

lit = report.get('lit', -1)
# `lit` = fraction de pixels non noirs sur un echantillon 64x64 (1024 px) ;
# le bidon orange remplit ~25% du cadre, donc le plafond sain est ~0.30.
print(f'📊 Pixels eclaires : {lit:.3f} (plafond sain ~= 0.30)')
for e in report.get('errs', []) + errs:
    print(f'⚠️ {e}')
ok = lit > 0.05 and not report.get('errs') and not errs
print('✅ RENDU OK — le GLB s affiche vraiment.' if ok else '❌ RENDU KO — ecran noir ou erreurs.')
sys.exit(0 if ok else 6)
