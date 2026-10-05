"""Segmentation par instance avec SAM (ViT-B, ONNX via rembg) : boîte + points positifs/négatifs.
Le décodeur de SAM est instable sur une seule consigne ; on lance donc plusieurs consignes voisines
(boîte et points légèrement décalés, plusieurs zones envoyées à l'encodeur) et on garde le vote
majoritaire. Les masques sont rendus aux coordonnées de l'image d'origine (aucun recadrage final)."""
import itertools
import cv2, numpy as np
from rembg import new_session

_S = None
def session():
    global _S
    if _S is None:
        _S = new_session("sam")
    return _S

def _embed(rgb, crop):
    s = session()
    H, W = rgb.shape[:2]
    cx0, cy0, cx1, cy1 = crop or (0, 0, W, H)
    sub = rgb[cy0:cy1, cx0:cx1]
    h, w = sub.shape[:2]
    sc = min(1024 / w, 684 / h)
    M = np.array([[sc, 0, 0], [0, sc, 0]], np.float32)
    canvas = cv2.warpAffine(sub, M, (1024, 684), flags=cv2.INTER_AREA if sc < 1 else cv2.INTER_CUBIC)
    emb = s.encoder.run(None, {s.encoder.get_inputs()[0].name: canvas.astype(np.float32)})[0]
    return emb, M, (cx0, cy0, cx1, cy1), (H, W)

def _decode(emb, M, zone, size, box, pos, neg):
    s = session()
    cx0, cy0, cx1, cy1 = zone
    H, W = size
    sc = M[0, 0]
    pts, lab = [[(box[0] - cx0) * sc, (box[1] - cy0) * sc], [(box[2] - cx0) * sc, (box[3] - cy0) * sc]], [2, 3]
    for p in pos: pts.append([(p[0] - cx0) * sc, (p[1] - cy0) * sc]); lab.append(1)
    for p in neg: pts.append([(p[0] - cx0) * sc, (p[1] - cy0) * sc]); lab.append(0)
    pts.append([0, 0]); lab.append(-1)
    res = s.decoder.run(None, {
        "image_embeddings": emb, "point_coords": np.array(pts, np.float32)[None],
        "point_labels": np.array(lab, np.float32)[None],
        "mask_input": np.zeros((1, 1, 256, 256), np.float32),
        "has_mask_input": np.zeros(1, np.float32),
        "orig_im_size": np.array([684, 1024], np.float32)})
    w, h = cx1 - cx0, cy1 - cy0
    back = cv2.warpAffine(res[0][0][0].astype(np.float32), cv2.invertAffineTransform(M), (w, h), flags=cv2.INTER_LINEAR)
    full = np.zeros((H, W), np.float32)
    full[cy0:cy1, cx0:cx1] = back
    return (full > 0).astype(np.float32), float(res[1][0][0])

def sam_vote(rgb, box, pos=(), neg=(), crops=(None,), seuil=0.35):
    """Retourne (masque 0/1, score IoU moyen, carte des votes). Les consignes voisines : points positifs
    et négatifs décalés (3x3), boîte fixe."""
    DP = [(0, 0), (20, 30), (-20, -40)]
    DN = [(0, 0), (-50, -50), (50, 50)]
    votes, scores = [], []
    for crop in crops:
        emb, M, zone, size = _embed(rgb, crop)
        for dp, dn in itertools.product(DP, DN):
            p = [(x + dp[0], y + dp[1]) for x, y in pos]
            n = [(neg[0][0] + dn[0], neg[0][1] + dn[1])] + list(neg[1:]) if neg else []  # seul le 1er point négatif est décalé
            m, sc = _decode(emb, M, zone, size, box, p, n)
            votes.append(m); scores.append(sc)
    V = np.mean(votes, 0)
    return (V >= seuil).astype(np.float32), float(np.mean(scores)), V
