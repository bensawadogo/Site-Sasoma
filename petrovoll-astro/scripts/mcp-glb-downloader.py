"""
mcp-glb-downloader.py — PLAN B : telecharge un .glb image-to-3D sans MCP navigateur.

Contexte :
  - L'agent IA de cette session n'a pas d'outil navigateur (pas de MCP Playwright
    connecte ici). Ce script fait le travail a sa place : Playwright Python pilote
    un vrai Chromium, intercepte le .glb dans le trafic reseau (ou via le bouton
    Download en repli), et le sauvegarde dans public/models/.
  - IMPORTANT : l'image source du bidon N'EXISTE PAS encore dans le workspace.
    Sans photo, le script ne peut rien generer : preparez-la d'abord (voir § IMAGE).

§ IMAGE — photo source requise :
  - Fond uni clair (idealement blanc), bidon centre, net, bien eclaire, 1024px+.
  - Nom attendu par defaut : petrovoll-astro/assets-source/petrovoll_clean.png
    (ou passez un autre chemin en argument).
  - Formats acceptes : .png / .jpg / .jpeg / .webp.

§ SITES (ordre d'essai) :
  1. https://upsampler.com/tools/image-to-3d        (gratuit, sans compte)
  2. https://app.cinevva.com                        (repli)
  3. https://huggingface.co/spaces/tencent/Hunyuan3D-1 (repli, file d'attente)

§ INSTALLATION (une fois) :
    pip install playwright
    playwright install chromium

§ USAGE :
    # Upsampler (defaut) :
    python scripts/mcp-glb-downloader.py
    # Avec image explicite + autre site :
    python scripts/mcp-glb-downloader.py .\\assets-source\\bidon.png --site cinevva
    # Mode invisible (CI) :
    python scripts/mcp-glb-downloader.py --headless

§ SORTIE :
  - Le fichier est TOUJOURS ecrit vers assets-source/bidon-meshy.glb
    (hors public/ : jamais deploye ; et jamais bidon.glb : le modele
    procedural existant reste intact).
  - Apres controle (node scripts/verify-bidon-glb.mjs sur une copie renommee
    si besoin), remplacez manuellement public/models/bidon.glb.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
import time
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout
except ImportError:
    print("❌ playwright (Python) n'est pas installe.")
    print("   Lancez : pip install playwright && playwright install chromium")
    sys.exit(2)

# Windows : le terminal par defaut (cp1252) ne connait pas les emojis.
# Sans ce bloc, le moindre print() avec emoji leve UnicodeEncodeError
# AVANT meme la logique metier (bug constate en test le 19/09/2026).
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ---------------------------------------------------------------- constantes
ROOT = Path(__file__).resolve().parent.parent  # petrovoll-astro/
DEFAULT_IMAGE = ROOT / "assets-source" / "petrovoll_clean.png"
DEFAULT_OUT = ROOT / "assets-source" / "bidon-meshy.glb"

SITES = {
    "upsampler": "https://upsampler.com/tools/image-to-3d",
    "cinevva": "https://app.cinevva.com",
    "hunyuan": "https://huggingface.co/spaces/tencent/Hunyuan3D-1",
}

# Boutons "generer" : libelles FR + EN (Meshy est en francais dans votre URL).
GENERATE_RE = re.compile(r"Generate|Convert|Create|Générer|Generer|Créer|Convertir", re.I)
DOWNLOAD_RE = re.compile(r"Download|Télécharger|Telecharger", re.I)

GENERATE_TIMEOUT_MS = 180_000  # generation IA : 30-120 s annoncees, marge a 3 min

def is_glb_response(url: str, headers: dict, status: int) -> bool:
    """Heuristique : URL ou Content-Type typique d'un binaire glTF."""
    u = url.lower()
    ct = (headers.get("content-type") or "").lower()
    if status != 200:
        return False
    if u.endswith(".glb") or "gltf-binary" in ct or "model/gltf" in ct:
        return True
    # Certains services streament le modele sans extension (.bin, /output/...)
    if ("model" in u or "output" in u or "result" in u) and (
        "octet-stream" in ct or "binary" in ct
    ):
        return True
    return False


def looks_like_glb(data: bytes) -> bool:
    """Magic 'glTF' + version 2 + taille coherente."""
    return (
        len(data) > 100
        and data[0:4] == b"glTF"
        and int.from_bytes(data[4:8], "little") == 2
    )


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="PLAN B : image-to-3D -> GLB via Chromium.")
    p.add_argument("image", nargs="?", default=str(DEFAULT_IMAGE))
    p.add_argument("--site", choices=sorted(SITES), default="upsampler")
    p.add_argument("--out", default=str(DEFAULT_OUT))
    p.add_argument("--headless", action="store_true")
    return p.parse_args()


def download_glb(image: Path, site: str, out: Path, headless: bool) -> int:
    """Pipeline complet : navigation -> upload -> generation -> capture .glb."""
    if not image.is_file():
        print(f"❌ Image introuvable : {image}")
        print("   Preparez la photo (fond uni clair, 1024px+) puis relancez.")
        return 3
    print(f"🖼️  Image : {image} ({image.stat().st_size // 1024} Ko)")
    print(f"🌐 Site  : {site} -> {SITES[site]}")

    captured: list = []  # (url, body)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(
            accept_downloads=True,
            viewport={"width": 1366, "height": 900},
        )
        page = context.new_page()

        def on_response(resp):
            try:
                if is_glb_response(resp.url, resp.headers, resp.status):
                    body = resp.body()
                    if body and looks_like_glb(body):
                        captured.append((resp.url, body))
                        print(f"✅ GLB intercepte : {resp.url} ({len(body)//1024} Ko)")
            except Exception:
                pass  # corps indisponible (redirect, CORS...) : on ignore

        page.on("response", on_response)

        # -- 1. navigation ------------------------------------------------
        try:
            page.goto(SITES[site], wait_until="domcontentloaded", timeout=60_000)
            page.wait_for_load_state("networkidle", timeout=60_000)
        except PwTimeout:
            print("⚠️  Chargement lent, on continue quand meme...")
        page.screenshot(path=str(out.parent / "_debug_01_page.png"))
        print("📸 _debug_01_page.png (controle visuel)")

        # -- 2. upload ----------------------------------------------------
        try:
            file_input = page.locator('input[type="file"]').first
            file_input.wait_for(state="attached", timeout=30_000)
            file_input.set_input_files(str(image))
            print("📤 Image uploadee")
        except PwTimeout:
            print("❌ Aucun <input type=file> trouve. Screenshot : _debug_01_page.png")
            print("   Le site a peut-etre change (login wall, selecteur custom).")
            browser.close()
            return 4
        page.wait_for_timeout(2500)
        page.screenshot(path=str(out.parent / "_debug_02_uploaded.png"))

        # -- 3. generation ------------------------------------------------
        try:
            gen_btn = page.get_by_role("button", name=GENERATE_RE).first
            gen_btn.wait_for(state="visible", timeout=30_000)
            gen_btn.click()
            print("⏳ Generation en cours (attente bouton Download, max 3 min)...")
        except PwTimeout:
            print("❌ Bouton Generate/Convert introuvable. Voir _debug_02_uploaded.png")
            browser.close()
            return 5

        # -- 4a. interception reseau (voie privilegiée) -------------------
        deadline = time.time() + GENERATE_TIMEOUT_MS / 1000
        while time.time() < deadline and not captured:
            page.wait_for_timeout(2000)
        if captured:
            url, body = captured[-1]
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_bytes(body)
            print(f"✅ GLB sauvegarde (reseau) : {out}")
            browser.close()
            return finish_ok(out, via=url)

        # -- 4b. repli : bouton Download ----------------------------------
        print("⚠️  Rien d'intercepte, tentative via le bouton Download...")
        try:
            dl_btn = page.get_by_role("button", name=DOWNLOAD_RE).first
            if not dl_btn.count():
                dl_btn = page.locator("a[download], a[href$='.glb']").first
            dl_btn.wait_for(state="visible", timeout=60_000)
            page.screenshot(path=str(out.parent / "_debug_03_result.png"))
            with page.expect_download(timeout=60_000) as dl_info:
                dl_btn.click()
            download = dl_info.value
            out.parent.mkdir(parents=True, exist_ok=True)
            download.save_as(str(out))
            print(f"✅ GLB sauvegarde (bouton) : {out}")
            browser.close()
            return finish_ok(out, via="bouton download")
        except PwTimeout:
            page.screenshot(path=str(out.parent / "_debug_04_echec.png"))
            print("❌ Echec : ni interception reseau ni bouton Download.")
            print("   Screenshots _debug_*.png dans public/models/ pour diagnostic.")
            browser.close()
            return 6


def finish_ok(out: Path, via: str) -> int:
    size = out.stat().st_size
    head = out.read_bytes()[:12]
    ok = head[0:4] == b"glTF" and int.from_bytes(head[4:8], "little") == 2
    print(f"🔍 Magic={'glTF' if head[0:4]==b'glTF' else head[0:4]!r} "
          f"| taille={size//1024} Ko | via={via}")
    if not ok:
        print("⚠️  Le fichier ne ressemble pas a un GLB (magic invalide).")
        return 7
    if size < 50_000:
        print("⚠️  Fichier suspectement petit (< 50 Ko) — verifiez le modele.")
    print("")
    print("PROCHAINES ETAPES :")
    print(f"  1. node scripts/verify-bidon-glb.mjs  # sur une copie nommee bidon.glb si besoin")
    print(f"  2. Remplacez public/models/bidon.glb par {out.name}")
    print("     (le loader BidonScene.astro prend le nouveau fichier tel quel)")
    return 0


def main() -> int:
    args = parse_args()
    # Garde-fou : ne jamais ecraser le procedural par accident.
    if Path(args.out).resolve() == (ROOT / "public" / "models" / "bidon.glb").resolve():
        print("⛔ Refus d'ecrire directement sur bidon.glb (modele procedural en place).")
        print("   Laissez la sortie par defaut (bidon-meshy.glb), controlez, puis remplacez.")
        return 8
    os.makedirs(Path(args.out).parent, exist_ok=True)
    return download_glb(Path(args.image), args.site, Path(args.out), args.headless)


if __name__ == "__main__":
    sys.exit(main())

