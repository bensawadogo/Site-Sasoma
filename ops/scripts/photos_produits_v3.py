"""Photos produits v3 : chaque photo montre UN produit ENTIER (bouchon compris), détouré par
segmentation par instance (SAM ViT-B, boîte + points positifs/négatifs ; voir sam_util.py),
sans recadrage, sans symétrie. Si le produit voulu est caché en partie dans l'original, on garde
la photo officielle COMPLÈTE (deux flacons), détourée en un seul bloc.
Toile 1200x1200 transparente, haut ~8 %, bas ~92 %, WebP q88, vers
petrovoll-astro/src/assets/produits/<id>.webp. Écrit docs/photos-produits.json et
petrovoll-astro/src/data/photos-produits.json (ne touche pas aux produits).
Usage : python ops/scripts/photos_produits_v3.py [id ...]   (sans argument : tout)
Méthodes : sam (objet de devant), plein (objet unique), deux (photo complète à deux flacons).
"""
import json, re, sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
from rembg import new_session
sys.path.insert(0, str(Path(__file__).resolve().parent))
import photos_produits as pp
import photos_produits_v2 as v2
from sam_util import sam_vote

ROOT = v2.ROOT
import os
DEBUG = Path(os.environ['PHOTOS_DEBUG']) if os.environ.get('PHOTOS_DEBUG') else None
SRC, OUT, DOC = v2.SRC, v2.OUT, v2.DOC
DATA = ROOT / "petrovoll-astro/src/data/photos-produits.json"
BASE_1L = 868  # ordonnée de la base du 1 L dans le gabarit STÄRK
L1 = dict(box=(0, 295, 350, 1000), pos=[(130, 720)], neg=[(550, 650)], crop=None, cap=(0, 250, 215, 470), l1=True)
# id -> options SAM (coordonnées dans l'image 800x1000)
SAM = {i: dict(L1) for i in [
    "stark-fully-synthetic", "stark-semi-synthetic", "volex-multigrade-mineral", "vono-mineral",
    "viro-tec-fully-synthetic", "viro-tec-semi-synthetic", "d-tec-mineral", "cng-tec", "marineol-mineral",
    "marineol-2t-outboard", "dexo-atf-cvt", "dexo-atf-dexron-vi", "dexo-atf-dexron-iii",
    "dexo-atf-dexron-ii", "dexo-atf-type-a", "max-grob-synthetic"]}
SAM["viro-tec-fully-synthetic"]["comble"] = True
SAM["marineol-mineral"]["clipD"] = 13
for _i, _b in (("dexo-atf-cvt", 885), ("dexo-atf-dexron-vi", 860), ("dexo-atf-dexron-iii", 857)):
    SAM[_i]["base"] = _b  # le gabarit se cale mal sur ces trois photos : base mesurée sur la photo
SAM.update({
    "motpro-4t": dict(box=(50, 165, 460, 830), pos=[(250, 640)], neg=[(650, 500)], cap=(60, 160, 250, 300)),
    "motpro-2t": dict(box=(50, 165, 460, 830), pos=[(250, 640)], neg=[(650, 500)], cap=(60, 160, 250, 300)),
    "marineol-synthetic-cylinder": dict(box=(10, 185, 450, 890), pos=[(200, 650), (100, 350), (60, 720), (388, 400), (300, 215)], neg=[(500, 500), (315, 335), (335, 400), (365, 445)], cap=(20, 190, 150, 290), trou=[(335, 400)], ymin=192),
    "marineol-trunk-piston": dict(box=(10, 230, 445, 890), pos=[(200, 650), (100, 350), (60, 720)], neg=[(520, 520), (335, 380), (350, 430)], cap=(30, 225, 150, 330), trou=[(335, 380)]),
    "max-grob-gear": dict(box=(10, 185, 470, 905), pos=[(180, 650), (300, 215), (385, 330), (110, 330)], neg=[(620, 500)], xmax=452,
        arriere=dict(box=(330, 185, 800, 905), pos=[(620, 650), (400, 215), (410, 300)], neg=[(150, 650)], zone=(300, 195, 452, 480)),
        vide=[(305, 262), (372, 262), (390, 292), (404, 340), (413, 395), (412, 430), (395, 470), (352, 474), (338, 450), (318, 400), (305, 330)], trou=[(360, 360)], cap=(30, 185, 170, 300)),
    "hydkon-hydraulic": dict(box=(0, 280, 500, 1000), pos=[(250, 700)], neg=[(650, 500)], crop=(0, 200, 800, 1000)),
    "glat-ep2-ep3": dict(box=(40, 400, 450, 900), pos=[(230, 650)], neg=[(560, 500)], crop=(0, 250, 800, 1000)),
    "dot-4-3": dict(box=(200, 245, 435, 790), pos=[(320, 560), (320, 330), (320, 700)], neg=[(520, 500)], cap=(250, 250, 390, 340)),
})
SAM.update(json.loads((Path(__file__).with_name("photos_produits_v3_sam.json")).read_text()) if
           Path(__file__).with_name("photos_produits_v3_sam.json").exists() else {})
DEUX = {"dot-5-1"}
# étiquette lue quand on garde la photo complète
ETIQ_DEUX = {"dot-5-1": ("BRAKE FLUID DOT 4 (250 ml) et BRAKE FLUID DOT 5 (500 ml) : photo officielle complète, deux flacons",
                          "250 ml + 500 ml"),
             "max-grob-gear": ("MAXGRÖB SAE 80W90 (5 L) et, derrière, SAE 85W140 : photo officielle complète", "5 L"),
             "marineol-trunk-piston": ("MARINEÖL Trunk Piston SAE 50 (5 L) : photo officielle complète, deux bidons", "5 L")}
REM_DEUX = {"dot-5-1": ("L'étiquette DOT 5 est celle du grand flacon (500 ml) ; son bord gauche est caché par le "
                        "flacon DOT 4 : on garde donc la photo officielle complète, sans rien reconstruire. "
                        "L'étiquette porte DOT 5, pas DOT 5.1 : photo la plus proche, non exacte."),
            "max-grob-gear": "Isolé, le bidon de devant gardait un cran sur la poignée : photo officielle complète.",
            "marineol-trunk-piston": "Isolé, le bidon gardait des dents sur la poignée : photo officielle complète."}

def aplat(m, garder=()):
    """Plus grande masse, trous internes comblés (étiquettes, taches), sauf ceux qui contiennent un
    des points `garder` (œillet de la poignée, vrai vide)."""
    m = m.astype(np.uint8)
    n, l, st, _ = cv2.connectedComponentsWithStats(m)
    m = (l == 1 + np.argmax(st[1:, 4])).astype(np.uint8)
    n, l = cv2.connectedComponents(1 - m, connectivity=4)
    fond = l[0, 0]
    tenus = {l[y, x] for x, y in garder if 0 <= y < l.shape[0] and 0 <= x < l.shape[1]}
    for k in range(1, n):
        if k != fond and k not in tenus:
            m[l == k] = 1
    return m

def rogner_pied(al):
    """Retire reflets et ombres sous le produit : on coupe sous la dernière ligne encore large."""
    b = al > 0.95
    w = b.sum(1).astype(float)
    ys = np.where(w > 0)[0]
    y0, y1 = ys.min(), ys.max()
    ref = w[int(y1 - 0.3 * (y1 - y0)):y1 + 1].max()
    large = np.where(w >= 0.4 * ref)[0]
    al = al.copy(); al[large.max() + 2:] = 0
    bas = int(y1 - 0.06 * (y1 - y0))  # languettes d'ombre au pied
    ouv = cv2.morphologyEx((al > 0.5).astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    al[bas:][cv2.dilate(ouv, np.ones((3, 3), np.uint8))[bas:] == 0] = 0
    return al

def alpha_sam(i, S):
    o = SAM[i]
    rel = v2.PRODUITS[i][0]
    im = v2.charger(rel)
    a = np.array(im)
    x0, y0, x1, y1 = o["box"]
    def zone(p):
        return (max(0, x0 - p), max(0, y0 - p), min(800, x1 + p), min(1000, y1 + p))
    M, sc, V = sam_vote(a, o["box"], o["pos"], o["neg"], crops=(None, zone(40)))
    M = M.astype(np.uint8)
    if o.get("l1"):  # le contour du 1 L (gabarit STÄRK recalé) borne large : écarte les débordements sur le 5 L
        sg, tx, ty = v2.recaler_1l(im)
        poly = np.array([(x * sg + tx, y * sg + ty) for x, y in v2.POLY_1L], np.int32)
        pm = np.zeros(M.shape, np.uint8); cv2.fillPoly(pm, [poly], 1)
        cd = o.get("clipD", 31)
        M &= cv2.dilate(pm, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (cd, cd)))
        M[(o["base"] if o.get("base") else int(BASE_1L * sg + ty)) + 3:] = 0  # sous la base : reflet sur le sol
        # poignée : on comble les encoches de la prise (côté droit), bornées par le gabarit (seulement si demandé)
        if o.get("comble"):
          if True:
            zone = np.zeros(M.shape, np.uint8)
            zone[max(0, int(330 * sg + ty)):int(760 * sg + ty), max(0, int(270 * sg + tx)):] = 1
            Mc = cv2.morphologyEx(M, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (45, 45)))
            M |= Mc & zone & cv2.dilate(pm, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    if o.get("xmax"): M[:, o["xmax"]:] = 0
    if o.get("vide"):  # œillet de la poignée : on retire ce que l'on voit à travers (objet de derrière)
        vm = np.zeros(M.shape, np.uint8); cv2.fillPoly(vm, [np.array(o["vide"], np.int32)], 1); M[vm > 0] = 0
    if o.get("arriere"):  # objet de derrière vu à travers la poignée : on le retire de la zone indiquée
        ar = o["arriere"]
        Mb, _, _ = sam_vote(a, ar["box"], ar["pos"], ar["neg"], crops=(None,))
        zx0, zy0, zx1, zy1 = ar["zone"]
        zone_m = np.zeros(M.shape, np.uint8); zone_m[zy0:zy1, zx0:zx1] = 1
        M[(Mb > 0) & (zone_m > 0)] = 0
    if o.get("ymin"): M[:o["ymin"]] = 0
    M = cv2.morphologyEx(M, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13) if o.get("l1") else (9, 9)))  # languettes
    M = cv2.morphologyEx(M, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21) if o.get("l1") else (11, 11)))
    fond = pp.masque_fond(im, S)
    if o.get("cap"):  # le bouchon est une pièce à part pour SAM : on l'ajoute depuis la silhouette (blanc retiré)
        cx0, cy0, cx1, cy1 = o["cap"]
        M[cy0:cy1, cx0:cx1] |= (fond[cy0:cy1, cx0:cx1] > 0.5).astype(np.uint8)
        M = cv2.morphologyEx(M, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    M = aplat(M, o.get("trou", ()))
    if DEBUG:
        dbg = np.array(im).copy(); dbg[M > 0] = (dbg[M > 0] * 0.55 + np.array([0, 200, 255]) * 0.45).astype(np.uint8)
        Image.fromarray(dbg).save(DEBUG / f"{i}.png")
    core = cv2.erode(M, np.ones((3, 3), np.uint8))
    ring = cv2.dilate(M, np.ones((7, 7), np.uint8)) > 0
    ok = (core > 0) | (ring & (fond < 0.97))
    al = cv2.GaussianBlur(ok.astype(np.float32), (0, 0), 0.7) * fond
    al[~(cv2.dilate(M, np.ones((9, 9), np.uint8)) > 0)] = 0
    al = np.where(cv2.erode(M, np.ones((5, 5), np.uint8)) > 0, 1.0, al).astype(np.float32)  # intérieur plein (étiquettes claires)
    nette = cv2.morphologyEx((al > 0.5).astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    al[cv2.dilate(nette, np.ones((3, 3), np.uint8)) == 0] = 0  # points isolés au bord
    # blanc du fond (relié au bord de l'image) : jamais dans l'objet, même si SAM déborde un peu
    nb, lb = cv2.connectedComponents((a.min(2) >= 246).astype(np.uint8), connectivity=4)
    bord_l = set(np.unique(np.concatenate([lb[0], lb[-1], lb[:, 0], lb[:, -1]]))) - {0}
    al[np.isin(lb, list(bord_l))] = 0
    # liseré clair : pixels du bord (moins de 3 px) bien plus clairs que le bord intérieur de l'objet
    dist = cv2.distanceTransform((al > 0.5).astype(np.uint8), cv2.DIST_L2, 3)
    mn = a.min(2).astype(np.float32)
    ref = np.median(mn[(dist >= 6) & (dist <= 14)]) if ((dist >= 6) & (dist <= 14)).any() else 255
    al[(al > 0) & (dist <= 3) & (mn > min(ref + 70, 252))] = 0
    return im, v2.plus_grosse_masse(al), sc

def retouche(i, im, al, S):
    """Contrôle du 04/10 : SAM laissait un cran (max-grob-gear) ou un trou (marineol-trunk-piston)
    sur la poignée. Fermeture du masque, limitée aux pixels d'objet de la photo (et, pour le
    trunk piston, au plastique sombre : pas le jerrican argenté de derrière). Rien d'inventé :
    on ne reprend que des pixels de la photo officielle. La photo complète est coupée à droite
    dans l'original, d'où ce choix plutôt que DEUX."""
    if i not in ("max-grob-gear", "marineol-trunk-piston"):
        return al
    hi = 255 if al.max() > 1 else 1
    m = (al > hi / 2).astype(np.uint8)
    comp = np.asarray(pp.masque_fond(im, S)).astype(np.float32)
    comp = (comp > comp.max() / 2).astype(np.uint8)
    el = lambda k: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    if i == "max-grob-gear":
        m2 = cv2.morphologyEx(m, cv2.MORPH_CLOSE, el(41)) & comp
    else:
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, el(7))
        rgb = np.asarray(im.convert("RGB") if hasattr(im, "convert") else im)[..., :3]
        sombre = (rgb.max(-1) < 95).astype(np.uint8)
        m2 = cv2.morphologyEx(m | (cv2.morphologyEx(m, cv2.MORPH_CLOSE, el(45)) & comp & sombre), cv2.MORPH_OPEN, el(5))
    return (cv2.GaussianBlur(m2.astype(np.float32), (0, 0), 0.8) * hi).astype(al.dtype)

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    seul_doc = '--doc' in sys.argv   # ne refait pas les images, régénère les JSON
    ids = args or list(v2.PRODUITS)
    OUT.mkdir(parents=True, exist_ok=True)
    S = new_session("isnet-general-use")
    doc = json.loads(DOC.read_text(encoding="utf-8")) if DOC.exists() else {}
    for i in ids:
        rel, meth, opt, etiq, cont, var, corr, rem = v2.PRODUITS[i]
        if i in DEUX:
            im = al = None; sc = 0
            etiq, cont = ETIQ_DEUX[i]
            rem = REM_DEUX[i]
        elif i in SAM:
            etiq = re.sub(r" \([^)]*\)\s*$", "", etiq)  # on ne lit plus que l'objet isolé
            if i == "max-grob-gear":
                rem = "Seule l'étiquette 80W90 (bidon de devant) est montrée."
            im, al, sc = (None, None, 0) if seul_doc else alpha_sam(i, S)
        else:
            im, al, sc = (None, None, 0) if seul_doc else (*(lambda m: (m, pp.masque_fond(m, S)))(v2.charger(rel)), 0)
        if i in DEUX and not seul_doc:
            im = v2.charger(rel); al = pp.masque_fond(im, S)
        if not seul_doc:
            al = rogner_pied(al)
            al = retouche(i, im, al, S)
            v2.canevas(im, al).save(OUT / f"{i}.webp", "WEBP", quality=88, method=6)
        e = {"photo": f"{i}.webp", "variantes": {var: f"{i}.webp"} if var else {},
             "source": v2.BASE + rel, "etiquette_lue": etiq, "contenance_montree": cont,
             "correspondance": corr}
        if i in DEUX:
            e["objets"] = "deux flacons (photo officielle complète)"
        if rem:
            e["remarque"] = rem
        doc[i] = e
        print(i, "ok", f"{sc:.2f}", flush=True)
    txt = json.dumps(doc, ensure_ascii=False, indent=2) + "\n"
    DOC.write_text(txt, encoding="utf-8"); DATA.write_text(txt, encoding="utf-8")

if __name__ == "__main__":
    main()
