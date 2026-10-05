"""Prépare les photos officielles Petrovöll : détourage (rembg), recadrage,
toile transparente 1200x1200, WebP q85 vers petrovoll-astro/src/assets/produits/<id>.webp.
Usage : python ops/scripts/photos_produits.py [id ...]   (sans argument : tout)
"""
import io, json, sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets/catalogues/petrovoll/photos"
OUT = ROOT / "petrovoll-astro/src/assets/produits"
JSON = ROOT / "petrovoll-astro/src/data/produits-petrovoll.json"
TOILE, HAUT, BAS, LARG_MAX = 1200, 0.08, 0.92, 0.90

# id produit -> photo du fabricant. Les photos génériques (tambour « Motor Oil »
# lube_tec_grob.jpg, additives/plain.jpg vide) sont volontairement absentes.
PHOTOS = {
 "stark-fully-synthetic": "gasoline/stark.jpg", "stark-semi-synthetic": "gasoline/stark_ss.jpg",
 "volex-multigrade-mineral": "gasoline/volex.jpg", "vono-mineral": "gasoline/vono.jpg",
 "viro-tec-fully-synthetic": "diesel/viro_fs.jpg", "viro-tec-semi-synthetic": "diesel/viro_ss.jpg",
 "d-tec-mineral": "diesel/dtec_mineral.jpg", "cng-tec": "diesel/cngtec.jpg",
 "motpro-4t": "motorcycle/motpro_4t.jpg", "motpro-2t": "motorcycle/motpro_2t.jpg",
 "marineol-synthetic-cylinder": "marine/marineol_1.jpg", "marineol-mineral": "marine/marineol_2.jpg",
 "marineol-trunk-piston": "marine/marineol_3.jpg", "marineol-2t-outboard": "marine/marineol_4.jpg",
 "hydkon-hydraulic": "industrial/hydkon.jpg",
 "dexo-atf-cvt": "automatic_transmission/dexo_atf_cvt.jpg", "dexo-atf-dexron-vi": "automatic_transmission/dexo_atf_vi.jpg",
 "dexo-atf-dexron-iii": "automatic_transmission/dexo_atf_iii.jpg", "dexo-atf-dexron-ii": "automatic_transmission/dexo_atf_ii.jpg",
 "dexo-atf-type-a": "automatic_transmission/dexo_atf_typea.jpg",
 "max-grob-synthetic": "automatic_manual_gear/max_grob.jpg", "max-grob-gear": "automatic_manual_gear/max_grob_gear_oil.jpg",
 "dot-5-1": "brake/dot_brakefluid.jpg", "dot-4-3": "brake/dot_brakefluid.jpg",
 "kuhler": "coolants/kuhler.jpg",
 "glat-ep0-ep1-ep2": "greases/glat_ep0.jpg", "glat-ep2-ep3": "greases/glat_ep3.jpg", "glat-multi-purpose": "greases/glat_mp.jpg",
 "fuel-injector-cleaner": "additives/fuel_injector_cleaner.jpg", "diesel-injector-cleaner": "additives/diesel_injector_cleaner.jpg",
 "complete-fuel-system-cleaner": "additives/complete_fuel_system_scanner.jpg", "octane-booster": "additives/octane_booster.jpg",
 "oil-treatment": "additives/oil_treatment.jpg", "oil-stop-leak": "additives/oil_stop_leak.jpg",
}

def masque_fond(im, session):
    """Fond blanc uni : on enlève le blanc relié au bord de l'image (les blancs
    d'étiquette, enfermés dans le produit, restent), plus les trous d'anse. rembg ne
    sert que de limiteur : il écarte le reflet et l'ombre sous le produit."""
    arr = np.array(im).astype(np.int16)
    mn = arr.min(2)
    blanc = (mn >= 244).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(blanc, connectivity=4)
    bord = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    fond = np.isin(lab, list(bord))
    rb = np.array(remove(im, session=session, only_mask=True)).astype(np.float32) / 255.0
    sil = rb > 0.5
    # trous d'anse : grands blancs purs enfermés, que rembg juge aussi être du fond
    for k in range(1, n):
        if k in bord or stats[k, 4] < 1500:
            continue
        comp = lab == k
        pur = (arr[comp].min(1) >= 250).mean()
        if (comp.sum() >= 5000 and pur > 0.97) or (comp.sum() >= 1500 and pur > 0.9 and (rb[comp] < 0.3).mean() > 0.9):
            fond |= comp
    # silhouette pleine de rembg (étiquettes blanches comprises), un peu dilatée
    plein = cv2.morphologyEx(sil.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    nf, lf = cv2.connectedComponents(1 - plein, connectivity=4)  # remplit les trous intérieurs
    ext = lf[0, 0]
    plein = (lf != ext).astype(np.uint8)
    plein = cv2.dilate(plein, np.ones((9, 9), np.uint8)) > 0
    # transparence douce au bord : plus un pixel est proche du blanc, plus il est transparent
    doux = np.clip((255 - mn) / 40.0, 0, 1)
    fond_proche = cv2.dilate(fond.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    alpha = np.where(fond, 0.0, np.where(fond_proche, doux, 1.0))
    alpha[~plein] = 0.0
    # on garde la plus grande masse (et les composants proches), on retire les miettes
    nb, l2, st, _ = cv2.connectedComponentsWithStats((alpha > 0.5).astype(np.uint8), connectivity=8)
    gros = max(st[1:, 4]) if nb > 1 else 0
    for k in range(1, nb):
        if st[k, 4] < max(300, gros * 0.01):
            alpha[l2 == k] = 0.0
    return alpha

def preparer(chemin, session):
    im = Image.open(chemin).convert("RGB")
    h_orig = im.height
    if im.height > 1600:
        im = im.resize((round(im.width * 1600 / im.height), 1600), Image.LANCZOS)
    al = masque_fond(im, session)
    a = np.array(im).astype(np.float32)
    m = (al > 0.02) & (al < 0.98)
    for c in range(3):  # décontamination du liseré blanc
        ch = a[..., c]
        ch[m] = np.clip((ch[m] - (1 - al[m]) * 255) / al[m], 0, 255)
        a[..., c] = ch
    rgba = Image.fromarray(np.dstack([a, al * 255]).astype(np.uint8), "RGBA")
    bb = Image.fromarray((al > 0.04).astype(np.uint8) * 255).getbbox()
    rgba = rgba.crop(bb)
    ech = min(TOILE * (BAS - HAUT) / rgba.height, TOILE * LARG_MAX / rgba.width)
    rgba = rgba.resize((round(rgba.width * ech), round(rgba.height * ech)), Image.LANCZOS)
    toile = Image.new("RGBA", (TOILE, TOILE), (0, 0, 0, 0))
    toile.alpha_composite(rgba, ((TOILE - rgba.width) // 2, round(TOILE * BAS) - rgba.height))
    return toile, h_orig

def main():
    ids = sys.argv[1:] or list(PHOTOS)
    OUT.mkdir(parents=True, exist_ok=True)
    session = new_session("isnet-general-use")
    for i in ids:
        toile, h = preparer(SRC / PHOTOS[i], session)
        toile.save(OUT / f"{i}.webp", "WEBP", quality=85, method=6)
        print(i, "ok", "(original %d px de haut%s)" % (h, " : TROP PETIT" if h < 300 else ""))
    # champ photo du JSON
    data = json.loads(JSON.read_text(encoding="utf-8"))
    for p in data:
        p["photo"] = f"{p['id']}.webp" if p["id"] in PHOTOS else None
    txt = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    JSON.write_bytes(txt.replace("\n", "\r\n").encode("utf-8"))

if __name__ == "__main__":
    main()
