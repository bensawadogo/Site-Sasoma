# Recherche : rendre le moteur du hero réaliste (option B : garder la photo K1) — 05/10/2026

Problème : K1 est une photo IA découpée et posée sur le garage Blender. Lumière, ombres et
couleurs ne viennent pas de la même scène : le moteur paraît « collé » (trop lumineux, blancs
brûlés). Les sites primés (scroll en séquence d'images, cf. awwwards.com/websites/scrolling)
partent d'une scène 3D unique ; sans modèle 3D, la méthode pro est celle du **compositing VFX /
photo produit** : intégrer une image dans un décor.

## Méthode retenue par les pros (forum HF « phone shot → studio shot », guides VFX)
1. Garder les pixels du produit (détails) ; changer seulement la lumière.
2. **Rééclairer le premier plan selon le fond** : IC-Light (lllyasviel, libre, gratuit ; mode
   « foreground + background ») ou Qwen-Image Relight (Space HF gratuit). Puis **séparation
   de fréquences** : basses fréquences (lumière) du rééclairé + hautes fréquences (détails) de
   l'original, et correspondance des couleurs.
3. **Ombre de contact** au sol : Blender « Shadow Catcher » avec une boîte aux dimensions du
   moteur dans le garage (ombre physiquement juste), ou ombre douce tirée du masque.
4. **Light wrap** : la lumière du décor déborde légèrement sur les bords du moteur.
5. **Niveaux** : noirs du moteur = noirs du garage, mêmes hautes lumières, même grain, même
   netteté que le plan du décor.

## Plan de correction (gratuit)
- Étape 1 : garage d'origine remis + moteur mis dans la lumière du garage (moteur_garage.py).
- Étape 2 : rééclairer UNE image de base (plaque K1 propre) avec IC-Light, le garage en fond ;
  carte de gain lissée (rééclairé / original) appliquée aux 96 + 72 images et aux pièces
  mobiles → lumière identique sur toute la séquence, détails intacts.
- Étape 3 : ombre de contact (shadow catcher Blender ou masque) cuite dans decor-*.webp.
- Étape 4 : light wrap, noirs, grain (script).
- Contrôle : Gemini (gratuit) note « le moteur paraît-il collé ? » + une capture vérifiée.

## 05/10 (suite) : la retouche 2D de K1 plafonne — sources pour un vrai rendu studio
Essais rejetés par Ben : métal neutre, fond studio anthracite, moteur « dans la lumière du
garage », rééclairage LBM, rééclairage Qwen (garage sombre). Conclusion : une photo IA
découpée ne donnera pas un rendu studio ; il faut un **objet 3D éclairé dans Blender**.

Modèles gratuits repérés (licence CC-BY = citer l'auteur) :
- Bloc 4 cylindres **scanné en 3D** (Artec 3D, 10 M faces, géométrie réelle) :
  https://sketchfab.com/3d-models/four-cylinder-engine-block-9ded1d8f996a4dcf9fe8faadb944f1ab
- Vilebrequin + bielles + pistons (CAO, animable) :
  https://sketchfab.com/3d-models/4-cylinder-engine-448e9e6fdd0c469ba14573f1a35c2ee0
- Moteur Inline-4 complet (CAO Solid Edge) :
  https://sketchfab.com/3d-models/inline-4-engine-64c16a336bd74b2db337ca03bc156f7a
- GrabCAD (moteurs CAO complets : bloc, culasse, cames, soupapes, distribution) :
  https://grabcad.com/library/four-cylinder-engine-114 , https://grabcad.com/library/tag/engine
Éclairage studio : HDRI studio Poly Haven (CC0) + softboxes (plans émissifs) + liserés,
matériaux PBR métal brossé / fonte ; rendu Cycles ; calcul gratuit SheepIt ou Google Colab.
Planche : ops/captures/modeles/planche-moteurs.jpg

## 05/10 (soir) : cause trouvée — l'étalonnage « studio argent » abîmait K1
K1 est déjà une photo de studio propre. C'est `etalonnage.studio_argent` (clarté + micro-contraste
+ hautes lumières renforcées) qui brûlait l'aluminium et donnait l'aspect « retouché », et le
film d'huile des parois (`huile_v5.film`, trop épais) qui teintait le bloc en brun (« rouillé »).
Correction : `etalonnage.studio_photo` (lumière de K1 gardée, noirs à peine décollés, épaule
sans blanc brûlé), film des parois × 0,45, chapeaux de paliers modelés (aluminium brossé),
poulie recollée étalonnée pareil. Chaîne : pieces_mobiles.py → moteur_v5.py … --fond →
npm run hero:video → remettre_poulie.py (ffmpeg : dossier WinGet Gyan.FFmpeg à mettre dans PATH).
Captures : ops/captures/rendu-photo/.
