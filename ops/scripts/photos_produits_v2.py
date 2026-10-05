"""Photos produits v2 : UN seul bidon net par produit, extrait de la photo officielle
Petrovöll (bidon 1 L devant un bidon de 5 L, etc.). Toile transparente 1200x1200, WebP q85,
même cadrage pour tous, vers petrovoll-astro/src/assets/produits/<id>[-<variante>].webp.
N'écrit PAS dans produits-petrovoll.json. Écrit docs/photos-produits.json (correspondance).
Usage : python ops/scripts/photos_produits_v2.py [id ...]   (sans argument : tout)
Méthodes d'extraction (le bidon de devant est entier ; on coupe la ligne de contact) :
  l1      bidon 1 L : recalage par gabarit de contours sur la photo de référence STÄRK, puis
          polygone de coupe (poignée / épaule) ; le bas se sépare tout seul du fond blanc.
  cadre   bidon noir 5 L : plastique sombre rempli, œillet de la poignée retiré.
  poly    polygone de coupe fait main (fond blanc retiré par masque_fond).
  rembg   silhouette rembg bornée par une boîte (pots blancs).
  dot5    flacon DOT 5 : bord gauche caché par le flacon DOT 4, refait par symétrie.
  plein   photo à objet unique, tel quel.
"""
import json, sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove
sys.path.insert(0, str(Path(__file__).resolve().parent))
import photos_produits as pp

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets/catalogues/petrovoll/photos"
OUT = ROOT / "petrovoll-astro/src/assets/produits"
DOC = ROOT / "docs/photos-produits.json"
TOILE, HAUT, BAS, LARG_MAX = 1200, 0.08, 0.92, 0.90
BASE = "https://petrovoll.com/assets/images/products/"

# ---------- recalage du bidon 1 L (gabarit pris sur gasoline/stark.jpg) ----------
POLY_1L = [(0,300),(255,300),(255,400),(270,388),(300,376),(326,371),(338,380),(340,395),(341,500),
           (343,640),(342,690),(322,712),(318,730),(318,880),(318,1000),(0,1000)]
TB = (20, 355, 345, 560)
# œillet de la poignée du bidon noir 5 L, repère marineol_1.jpg
HOLE_5L = [(325,278),(340,292),(358,320),(373,350),(385,385),(393,420),(392,448),(385,462),(370,467),
           (350,462),(325,440),(300,402),(282,368),(276,340),(276,310)]

def charger(rel):
    im = Image.open(SRC / rel).convert("RGB")
    if im.height != 1000:
        im = im.resize((800, 1000), Image.LANCZOS)
    return im

def contours(im):
    g = cv2.GaussianBlur(cv2.cvtColor(np.array(im), cv2.COLOR_RGB2GRAY).astype(np.float32), (0, 0), 1.5)
    return np.sqrt(cv2.Sobel(g, cv2.CV_32F, 1, 0) ** 2 + cv2.Sobel(g, cv2.CV_32F, 0, 1) ** 2)

_REF = None
def recaler_1l(im):
    global _REF
    if _REF is None:
        _REF = contours(charger("gasoline/stark.jpg"))[TB[1]:TB[3], TB[0]:TB[2]]
    E = contours(im)[250:, :480]
    best = (-1,)
    for s in np.arange(0.8, 1.32, 0.01):
        t = cv2.resize(_REF, None, fx=s, fy=s)
        r = cv2.matchTemplate(E, t, cv2.TM_CCOEFF_NORMED)
        _, mv, _, ml = cv2.minMaxLoc(r)
        if mv > best[0]:
            best = (mv, s, ml)
    mv, s, (x, y) = best
    return s, x - TB[0] * s, y + 250 - TB[1] * s

def plus_grosse_masse(al, seuil=0.5):
    n, l, st, _ = cv2.connectedComponentsWithStats((al > seuil).astype(np.uint8))
    k = 1 + np.argmax(st[1:, 4])
    al = al.copy(); al[l != k] = 0
    return al

def m_l1(rel, S, **kw):
    im = charger(rel)
    s, tx, ty = recaler_1l(im)
    poly = np.array([(x * s + tx, y * s + ty) for x, y in POLY_1L], np.int32)
    pm = np.zeros((1000, 800), np.uint8); cv2.fillPoly(pm, [poly], 1)
    al = pp.masque_fond(im, S) * cv2.erode(pm, np.ones((9, 9), np.uint8))
    al = plus_grosse_masse(al)
    # reste de l'etiquette coloree du bidon de 5 L derriere la poignee : on la retire depuis la droite
    hsv = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2HSV)
    for y in range(int(380 * s + ty), int(720 * s + ty)):
        xs = np.where(al[y] > 0.05)[0]
        if len(xs) == 0:
            continue
        x = xs.max()
        while x > xs.max() - 45 and 100 <= hsv[y, x, 0] <= 135 and hsv[y, x, 1] > 60 and hsv[y, x, 2] > 60:
            al[y, x] = 0; x -= 1
    al = cv2.morphologyEx(al, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return im, plus_grosse_masse(al)

def m_cadre(rel, S, **kw):
    ref = charger("marine/marineol_1.jpg"); im = charger(rel)
    g = lambda i: cv2.GaussianBlur(cv2.cvtColor(np.array(i), cv2.COLOR_RGB2GRAY).astype(np.float32), (0, 0), 1.5)
    r = cv2.matchTemplate(g(im), g(ref)[230:700, 15:250], cv2.TM_CCOEFF_NORMED)
    _, mv, _, ml = cv2.minMaxLoc(r); dx, dy = ml[0] - 15, ml[1] - 230
    a = np.array(im); D = (a.max(2) < 95).astype(np.uint8)
    for y in range(D.shape[0]):
        D[y, int(np.interp(y - dy, [200, 300, 400, 470, 850], [352, 395, 425, 443, 445]) + dx + 3):] = 0
    D[870 + dy:, :] = 0
    D = cv2.morphologyEx(D, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, l, st, _ = cv2.connectedComponentsWithStats(D); D = (l == 1 + np.argmax(st[1:, 4])).astype(np.uint8)
    n2, l2 = cv2.connectedComponents(1 - D, connectivity=4); F = (l2 != l2[0, 0]).astype(np.uint8)
    hm = np.zeros(F.shape, np.uint8)
    cv2.fillPoly(hm, [np.array([(x + dx, y + dy) for x, y in HOLE_5L], np.int32)], 1); F[hm > 0] = 0
    F = cv2.morphologyEx(F, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    n, l, st, _ = cv2.connectedComponentsWithStats(F); F = (l == 1 + np.argmax(st[1:, 4])).astype(np.uint8)
    return im, cv2.GaussianBlur(F.astype(np.float32), (0, 0), 0.8)

def m_poly(rel, S, poly=None, **kw):
    im = charger(rel); al = pp.masque_fond(im, S)
    pm = np.zeros((1000, 800), np.uint8); cv2.fillPoly(pm, [np.array(poly, np.int32)], 1)
    return im, plus_grosse_masse(al * cv2.erode(pm, np.ones((5, 5), np.uint8)))

def m_rembg(rel, S, box=None, **kw):
    im = charger(rel)
    rb = np.array(remove(im, session=S, only_mask=True)).astype(np.float32) / 255.0
    x0, y0, x1, y1 = box; bm = np.zeros(rb.shape, np.float32); bm[y0:y1, x0:x1] = 1
    al = cv2.GaussianBlur(((rb > 0.5) * bm).astype(np.float32), (0, 0), 1.0)
    return im, plus_grosse_masse(al)

def m_dot5(rel, S, **kw):
    """Flacon DOT 5 (droite). Le flacon DOT 4 cache ~30 px de son bord gauche : on le
    refait par symétrie (axe x=511) avec les pixels du côté droit, visibles."""
    im = charger(rel); a = np.array(im)
    al = pp.masque_fond(im, S)
    pm = np.zeros((1000, 800), np.uint8)
    cv2.fillPoly(pm, [np.array([(393,0),(800,0),(800,1000),(426,1000),(426,410),(393,352)], np.int32)], 1)
    al = plus_grosse_masse(al * pm)
    cx = 511.0
    for y in range(330, 780):
        for x in range(392, 426):
            xs = int(round(2 * cx - x))
            if al[y, x] < 0.5 and al[y, xs] > 0.5:
                a[y, x] = a[y, xs]; al[y, x] = al[y, xs]
    return Image.fromarray(a), plus_grosse_masse(al)

def m_plein(rel, S, **kw):
    im = charger(rel); return im, pp.masque_fond(im, S)

METH = {"l1": m_l1, "cadre": m_cadre, "poly": m_poly, "rembg": m_rembg, "dot5": m_dot5, "plein": m_plein}

def canevas(im, al):
    a = np.array(im).astype(np.float32); m = (al > 0.02) & (al < 0.98)
    for c in range(3):
        ch = a[..., c]; ch[m] = np.clip((ch[m] - (1 - al[m]) * 255) / al[m], 0, 255); a[..., c] = ch
    rgba = Image.fromarray(np.dstack([a, al * 255]).astype(np.uint8), "RGBA")
    rgba = rgba.crop(Image.fromarray((al > 0.04).astype(np.uint8) * 255).getbbox())
    ech = min(TOILE * (BAS - HAUT) / rgba.height, TOILE * LARG_MAX / rgba.width)
    rgba = rgba.resize((round(rgba.width * ech), round(rgba.height * ech)), Image.LANCZOS)
    toile = Image.new("RGBA", (TOILE, TOILE), (0, 0, 0, 0))
    toile.alpha_composite(rgba, ((TOILE - rgba.width) // 2, round(TOILE * BAS) - rgba.height))
    return toile

P_MOTPRO = [(0,0),(449,0),(449,470),(442,500),(442,1000),(0,1000)]
# id: (photo source, méthode, options, étiquette lue, contenance, variante fiche, correspondance, remarque)
PRODUITS = {
 "stark-fully-synthetic": ("gasoline/stark.jpg","l1",{},"STÄRK Voll Synthetisch, SAE 0W40, API SN, 1 Ltr","1 L","0W-40","variante",
   "La photo montre 0W40 et non 5W-30 (valeur par défaut de la fiche)."),
 "stark-semi-synthetic": ("gasoline/stark_ss.jpg","l1",{},"STÄRK Teil Synthetisches, SAE 10W40, API SM, 1 Ltr","1 L","10W-40","variante",""),
 "volex-multigrade-mineral": ("gasoline/volex.jpg","l1",{},"VÖLEX Mineralöl Leistung, SAE 20W50, API SL, 1 Ltr","1 L","20W-50","variante",""),
 "vono-mineral": ("gasoline/vono.jpg","l1",{},"VÖNO Mineralöl Leistung, SAE 40, API SL, 1 Ltr","1 L","SAE 40","variante",""),
 "viro-tec-fully-synthetic": ("diesel/viro_fs.jpg","l1",{},"VIRÖ-TEC Schwerlast-Motoröl, SAE 10W30, API CK-4, 1 Ltr (le 5 L de la même photo porte SAE 5W40)","1 L","10W-30","variante",""),
 "viro-tec-semi-synthetic": ("diesel/viro_ss.jpg","l1",{},"VIRÖ-TEC Schwerlast-Motoröl, SAE 15W40, API CI-4/SL, 1 Ltr","1 L","15W-40","variante",""),
 "d-tec-mineral": ("diesel/dtec_mineral.jpg","l1",{},"D-TEC Schwerlast-Motoröl, SAE 15W40, API CF, 1 Ltr (le 5 L porte SAE 50)","1 L","15W-40","variante",""),
 "cng-tec": ("diesel/cngtec.jpg","l1",{},"CNG-TEC Schwerlast-Motoröl, CNG SAE 15W40, API CG-4, 1 Ltr","1 L","15W-40","variante",""),
 "motpro-4t": ("motorcycle/motpro_4t.jpg","poly",{"poly":P_MOTPRO},"MÖTPRO 4T-Stroke Oil, SAE 20W50, JASO MA-2, API SN, 1 Ltr","1 L","20W-50","variante",""),
 "motpro-2t": ("motorcycle/motpro_2t.jpg","poly",{"poly":P_MOTPRO},"MÖTPRO 2T-Stroke Oil, TC JASO FC-FD, 1 Ltr","1 L","2T","exacte",""),
 "marineol-synthetic-cylinder": ("marine/marineol_1.jpg","cadre",{},"MARINEÖL Synthetisches Meeresöl, SAE 15W40, TBN 50, 5 Ltr","5 L","15W-40","variante",""),
 "marineol-mineral": ("marine/marineol_2.jpg","l1",{},"MARINEÖL Mineral Meeresöl, SAE 50, TBN 85, 1 Ltr","1 L","SAE 50","variante",""),
 "marineol-trunk-piston": ("marine/marineol_3.jpg","cadre",{},"MARINEÖL Tauchkolben-Schiffsöl, SAE 50, TBN 55, 5 Ltr","5 L","SAE 50","variante",""),
 "marineol-2t-outboard": ("marine/marineol_4.jpg","l1",{},"MARINEÖL Mineral Meeresöl, 2 CYCLE OUTBOARD OIL, API TC-W3, 1 Ltr","1 L","2T","exacte",""),
 "hydkon-hydraulic": ("industrial/hydkon.jpg","poly",{"poly":[(0,290),(484,290),(484,1000),(0,1000)]},"HYDKÖN Hydraulik Öl, HYDRAULIC 68, ISO VG 68, 20 Ltr","20 L","ISO VG 68","variante",""),
 "dexo-atf-cvt": ("automatic_transmission/dexo_atf_cvt.jpg","l1",{},"DEXÖ ATF CVT, DEXRON CVT, 1 Ltr","1 L",None,"exacte",""),
 "dexo-atf-dexron-vi": ("automatic_transmission/dexo_atf_vi.jpg","l1",{},"DEXÖ ATF VI, DEXRON VI, 1 Ltr","1 L",None,"exacte",""),
 "dexo-atf-dexron-iii": ("automatic_transmission/dexo_atf_iii.jpg","l1",{},"DEXÖ ATF III, DEXRON III, 1 Ltr","1 L",None,"exacte",""),
 "dexo-atf-dexron-ii": ("automatic_transmission/dexo_atf_ii.jpg","l1",{},"DEXÖ ATF II, DEXRON II, 1 Ltr","1 L",None,"exacte",""),
 "dexo-atf-type-a": ("automatic_transmission/dexo_atf_typea.jpg","l1",{},"DEXÖ ATF TYPE A, TYPE A SUFFIX A, 1 Ltr","1 L",None,"exacte",""),
 "max-grob-synthetic": ("automatic_manual_gear/max_grob.jpg","l1",{},"MAXGRÖB Manuelles Getriebeöl, SAE 75W90 Synthetic Premium, API GL-5, 1 Ltr","1 L","75W-90","variante",""),
 "max-grob-gear": ("automatic_manual_gear/max_grob_gear_oil.jpg","cadre",{},"MAXGRÖB Manuelles Getriebeöl, SAE 80W90 Automotive Gear Oil, API GL-5, 5 Ltr (la photo montre aussi 85W140 derrière)","5 L","80W-90","a_verifier",
   "La photo montre 80W90 et 85W140 ; seule l'étiquette 80W90 est isolée."),
 "dot-5-1": ("brake/dot_brakefluid.jpg","dot5",{},"BRAKE FLUID DOT 5, 500 ml","500 ml",None,"inexacte",
   "L'étiquette porte DOT 5, pas DOT 5.1 : photo la plus proche, non exacte. Bord gauche du flacon refait par symétrie."),
 "dot-4-3": ("brake/dot_brakefluid.jpg","poly",{"poly":[(0,0),(393,0),(393,352),(426,410),(426,1000),(0,1000)]},"BRAKE FLUID DOT 4, 250 ml","250 ml",None,"exacte",""),
 "kuhler": ("coolants/kuhler.jpg","plein",{},"KÜHLER Coolant Antifreeze, 100% concentrate, anti-rust formula, 5 Ltr","5 L",None,"exacte",""),
 "glat-ep0-ep1-ep2": ("greases/glat_ep0.jpg","plein",{},"GLÄT-EP1 NLGI-EP1 Lithium Grease, 20 Ltr","20 L","EP1","variante",
   "Étiquette EP1 : correspond à l'un des trois grades EP0/EP1/EP2 de la fiche."),
 "glat-ep2-ep3": ("greases/glat_ep3.jpg","poly",{"poly":[(60,412),(365,412),(372,432),(430,432),(430,478),(414,478),(414,870),(60,870)]},"GLÄT-EP2 NLGI-EP2 Lithium Grease, 500 g (pot de 1 kg derrière : GLÄT-EP2)","500 g","EP2","inexacte",
   "Le fichier officiel s'appelle glat_ep3 mais l'étiquette porte EP2 ; aucune photo EP3 n'existe."),
 "glat-multi-purpose": ("greases/glat_mp.jpg","plein",{},"GLÄT-EP2 NLGI-EP2 Multi-Purpose Grease, 20 Ltr","20 L",None,"inexacte",
   "L'étiquette porte EP2 (graisse lithium), alors que la fiche décrit une graisse multi-usage au calcium."),
 "fuel-injector-cleaner": ("additives/fuel_injector_cleaner.jpg","plein",{},"Fuel Injector Cleaner, 250 ml","250 ml",None,"exacte",""),
 "diesel-injector-cleaner": ("additives/diesel_injector_cleaner.jpg","plein",{},"Diesel Injector Cleaner, 250 ml","250 ml",None,"exacte",""),
 "complete-fuel-system-cleaner": ("additives/complete_fuel_system_scanner.jpg","plein",{},"Complete Fuel System Cleaner, 250 ml","250 ml",None,"exacte",""),
 "octane-booster": ("additives/octane_booster.jpg","plein",{},"Octane Booster, 250 ml","250 ml",None,"exacte",""),
 "oil-treatment": ("additives/oil_treatment.jpg","plein",{},"Oil Treatment, 444 ml","444 ml",None,"exacte",""),
 "oil-stop-leak": ("additives/oil_stop_leak.jpg","plein",{},"Oil Stop Leak, 444 ml","444 ml",None,"exacte",""),
}

def main():
    ids = sys.argv[1:] or list(PRODUITS)
    OUT.mkdir(parents=True, exist_ok=True)
    S = new_session("isnet-general-use")
    doc = json.loads(DOC.read_text(encoding="utf-8")) if DOC.exists() else {}
    for i in ids:
        rel, meth, opt, etiq, cont, var, corr, rem = PRODUITS[i]
        im, al = METH[meth](rel, S, **opt)
        canevas(im, al).save(OUT / f"{i}.webp", "WEBP", quality=85, method=6)
        entree = {"photo": f"{i}.webp", "variantes": {var: f"{i}.webp"} if var else {},
                  "source": BASE + rel, "etiquette_lue": etiq, "contenance_montree": cont,
                  "correspondance": corr}
        if rem:
            entree["remarque"] = rem
        doc[i] = entree
        print(i, "ok")
    DOC.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
