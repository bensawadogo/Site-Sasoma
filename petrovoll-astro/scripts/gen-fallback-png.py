#!/usr/bin/env python3
"""gen-fallback-png.py — Genere public/images/bidon-fallback.png (800x800).
Rend le VRAI GLB (public/models/bidon.glb) avec la camera + lumieres
IDENTIQUES a BidonScene.astro (pos 0,0.4,4.2 / fov 35 / exposure 0.86 /
ambi 0.34 + key 0.92 + fill 0.22 + rim 0.32), fond transparent (alpha) pour
epouser le fond de la page.
Le fallback 2D ressemble ainsi exactement a la 3D qu'il remplace.
⚠️ Ces valeurs doivent rester synchronisees avec BidonScene.astro : un
fallback plus lumineux que la 3D trahirait le repli (aspect "delave").
USAGE : python scripts/gen-fallback-png.py   (exit 0 = OK, 6 = rendu KO)
"""
import base64
import sys
import threading
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GLB_FILE = ROOT / 'public' / 'models' / 'bidon.glb'
OUT = ROOT / 'public' / 'images' / 'bidon-fallback.png'
if not GLB_FILE.exists():
    print('❌ GLB absent — lance npm run bidon:compress d abord.')
    sys.exit(3)
OUT.parent.mkdir(parents=True, exist_ok=True)
GLB_DATA = GLB_FILE.read_bytes()

PAGE = """<!doctype html><html><body><canvas id="c" width="800" height="800"></canvas>
<script type="importmap">{"imports":{
 "three":"/vendor/build/three.module.js",
 "three/addons/":"/vendor/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
window.__report = undefined; const errs = [];
try {
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), alpha: true, antialias: true });
  renderer.setSize(800, 800, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Memes reglages tonals que BidonScene.astro (sinon le fallback parait delave).
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.86;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.34));
  const key = new THREE.DirectionalLight(0xffffff, 0.92); key.position.set(3, 4, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0x9db8d6, 0.22); fill.position.set(-4, 1, 2); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xf5a623, 0.32); rim.position.set(-4, 2, -3); scene.add(rim);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100); camera.position.set(0, 0.4, 4.2);
  camera.lookAt(0, 0, 0);
  const loader = new GLTFLoader(); const draco = new DRACOLoader();
  draco.setDecoderPath('/draco/'); loader.setDRACOLoader(draco);
  const gltf = await loader.loadAsync('/models/bidon.glb');
  // Meme cadrage que BidonScene.astro : centrage + echelle 2.3 / plus grande dimension.
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  model.position.sub(center);
  model.scale.setScalar(2.3 / Math.max(size.x, size.y, size.z));
  scene.add(model);
  renderer.render(scene, camera);
  window.__report = { png: renderer.domElement.toDataURL('image/png'), errs };
} catch (e) { window.__report = { png: '', errs: [...errs, String(e)] }; }
</script></body></html>"""


class H(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/models/bidon.glb':
            self.send_response(200)
            self.send_header('Content-Type', 'model/gltf-binary')
            self.end_headers()
            self.wfile.write(GLB_DATA)
            return  # sinon on tombe dans le code commun → UnboundLocalError
        elif self.path.startswith('/draco/'):
            f = ROOT / 'public' / self.path.lstrip('/')
            ct = 'application/wasm' if f.suffix == '.wasm' else 'text/javascript'
        elif self.path.startswith('/vendor/'):
            # three.js servi depuis node_modules (aucun CDN, aucun reseau).
            rel = self.path.lstrip('/').removeprefix('vendor/')
            f = ROOT / 'node_modules' / 'three' / rel
            ct = 'text/javascript'
        else:
            f = None; ct = ''
        if f is not None and f.is_file():
            self.send_response(200)
            self.send_header('Content-Type', ct)
            self.end_headers()
            self.wfile.write(f.read_bytes())
        elif self.path.startswith(('/draco/', '/vendor/')):
            self.send_response(404); self.end_headers()
        else:
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(PAGE.encode())

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
        pg.wait_for_function('window.__report !== undefined', timeout=45000)
        report = pg.evaluate('window.__report')
    except Exception as e:
        report = {'png': '', 'errs': [f'TIMEOUT 30s : {e}']}
    b.close()
srv.shutdown()

all_errs = report.get('errs', []) + errs
png = report.get('png', '')
ok = png.startswith('data:image/png') and not all_errs
if ok:
    OUT.write_bytes(base64.b64decode(png.split(',', 1)[1]))
    print(f'✅ Fallback genere : {OUT} ({OUT.stat().st_size // 1024} Ko, 800x800, fond transparent)')
else:
    print('❌ Rendu fallback KO :')
    for e in all_errs:
        print(f'  ⚠️ {e}')
sys.exit(0 if ok else 6)
