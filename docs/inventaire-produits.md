# Inventaire exact des produits Petrovöll

Relevé du 2026-10-03, source officielle petrovoll.com (pages rendues dans Chrome piloté, comparées aux pages sauvegardées dans `assets/catalogues/petrovoll/site/` ; les 35 photos sauvegardées sont identiques octet pour octet à celles du site en ligne).

**Résultat : 45 produits distincts, 121 variantes (grade, TBN, NLGI, concentration).** Le site officiel liste exactement 45 fiches dans 11 gammes ; le catalogue du site Astro en a aussi 45, sans doublon. Seules 32 fiches ont une photo qui leur est propre.

## Sources consultées

- https://petrovoll.com/
- https://petrovoll.com/Products
- https://petrovoll.com/GasolineEngineOils
- https://petrovoll.com/DieselEngineOils
- https://petrovoll.com/MotorCycleOils
- https://petrovoll.com/MarineOils
- https://petrovoll.com/IndustrialOils
- https://petrovoll.com/AutomaticTransmissionFluids
- https://petrovoll.com/AutomotiveManualGearOils
- https://petrovoll.com/BrakeFluids
- https://petrovoll.com/CoolantsAndAntiFreeze
- https://petrovoll.com/Greases
- https://petrovoll.com/AdditivesAndCarCare
- https://petrovoll.com/Distribution
- https://petrovoll.com/News
- https://petrovoll.com/AboutUs
- https://www.gconoil.com/
- https://www.gconoil.com/products.html
- https://petrovoll.com/dev/grease.html
- https://www.facebook.com/Petrovoll/ (connexion requise, non consulté)

Aucun catalogue PDF ni fiche technique PDF n'existe sur petrovoll.com (seulement des certificats). Chaque fiche produit est un bloc de la page de sa gamme ; `/Products` et `/Products/View/<Gamme>` renvoient la liste complète des 45. Le site de l'usine, gconoil.com, vend les mêmes familles sous d'autres noms (Titanium, Chronoton, Exocet, Lublit…) et ne cite pas Petrovöll. Les pages Facebook/LinkedIn demandent une connexion.

## Pourquoi « les produits se ressemblent trop »

- Une gamme = un seul habillage : les 4 huiles essence ont le même bidon argenté et la même étiquette bleue ; les 4 diesel le même bidon vert-bleu ; les 5 ATF le même bidon noir et la même étiquette bleue ; les 4 marine la même étiquette turquoise ; les 2 MAX-GRÖB la même étiquette rouge ; les 2 MÖTPRO la même étiquette jaune. Seuls le nom, le grade et la norme API changent.
- Chaque fiche a UNE photo qui n'affiche qu'un grade (ex. STÄRK Fully : 0W40 seulement). Aucune variante n'a sa propre photo.
- 11 fiches n'ont pas de vraie photo (9 huiles industrielles = même tambour générique, 2 additifs = image blanche) et DOT 5.1 / DOT 4 & 3 partagent le même fichier.

## Huiles moteur essence

| Produit | Variantes vendues | Photo du site | Aspect (contenant ; étiquette) | Photo propre à la variante ? |
|---|---|---|---|---|
| STÄRK Fully Synthetic | 5W-20, 5W-30, 0W-30, 5W-40, 0W-40 (5) | …/gasoline/stark.jpg : 1 photo pour les 5 grades ; elle montre SAE 0W40 (1 L et 5 L), API SN | Bidon gris argenté métallisé (poignée rainurée), bouchon rouge, 1 L + 5 L ; Étiquette dégradé bleu clair à motif alvéolaire, bandeau rouge en bas (API + volume) ; texte « Voll Synthetisch », SAE 0W40, API SN | Non |
| STÄRK Semi Synthetic | 5W-30, 10W-30, 10W-40, 15W-40, 20W-50 (5) | …/gasoline/stark_ss.jpg : 1 photo pour les 5 grades ; elle montre SAE 10W40, API SM | Bidon gris argenté métallisé (poignée rainurée), bouchon rouge, 1 L + 5 L ; Étiquette dégradé bleu clair à motif alvéolaire, bandeau rouge en bas (API + volume) ; texte « Teil Synthetisches », SAE 10W40, API SM | Non |
| VÖLEX Multi Grade Mineral | 15W-40, 20W-50 (2) | …/gasoline/volex.jpg : 1 photo pour les 2 grades ; elle montre SAE 20W50 « Premium », API SL | Bidon gris argenté métallisé (poignée rainurée), bouchon rouge, 1 L + 5 L ; Étiquette dégradé bleu clair à motif alvéolaire, bandeau rouge en bas (API + volume) ; « Mineralöl Leistung », SAE 20W50, dessin de moteur | Non |
| VÖNO Mineral | 10W, SAE 30, SAE 40, SAE 50, 15W-40, 20W-50 (6) | …/gasoline/vono.jpg : 1 photo pour les 6 grades ; elle montre SAE 40 « Premium », API SL | Bidon gris argenté métallisé (poignée rainurée), bouchon rouge, 1 L + 5 L ; Étiquette dégradé bleu clair à motif alvéolaire, bandeau rouge en bas (API + volume) ; « Mineralöl Leistung », SAE 40, dessin de moteur (quasi identique à VÖLEX) | Non |

Conditionnements affichés par le site : 1 L, 4 L, 5 L, 20 L, 208 L (fût), identiques pour toute la gamme.

## Huiles moteur diesel

| Produit | Variantes vendues | Photo du site | Aspect (contenant ; étiquette) | Photo propre à la variante ? |
|---|---|---|---|---|
| VIRÖ-TEC Fully Synthetic | 5W-20, 5W-30, 10W-30, 5W-40, 0W-40 (5) | …/diesel/viro_fs.jpg : 1 photo pour les 5 grades ; elle montre 5W40 (5 L) et 10W30 (1 L), API CK-4 | Bidon vert-bleu (teal), bouchon rouge/orange, 1 L + 5 L ; Étiquette gris clair à motif alvéolaire, camion, bandeau rouge (API + volume) ; logo VIRÖ-TEC, SAE 5W40, CK-4 | Non |
| VIRÖ-TEC Semi Synthetic | 10W-40, 15W-40, 20W-50 (3) | …/diesel/viro_ss.jpg : 1 photo pour les 3 grades ; elle montre SAE 15W40, API CI-4/SL | Bidon vert-bleu (teal), bouchon rouge/orange, 1 L + 5 L ; Étiquette gris clair à motif alvéolaire, camion, bandeau rouge (API + volume) ; identique à VIRÖ-TEC FS, seuls le grade et l'API changent (CI-4/SL) | Non |
| D-TEC Mineral | SAE 30, SAE 40, SAE 50, 15W-40, 20W-50 (5) | …/diesel/dtec_mineral.jpg : 1 photo pour les 5 grades ; elle montre SAE 50 (5 L) et 15W40 (1 L), API CF | Bidon vert-bleu (teal), bouchon rouge/orange, 1 L + 5 L ; Étiquette gris clair à motif alvéolaire, camion, bandeau rouge (API + volume) ; logo D-TEC, pistons dessinés | Non |
| CNG-TEC | 15W-40 (1) | …/diesel/cngtec.jpg : Un seul grade, photo correspondante (15W40, API CG-4) | Bidon vert-bleu (teal), bouchon rouge/orange, 1 L + 5 L ; Étiquette gris clair à motif alvéolaire, camion, bandeau rouge (API + volume) ; logo CNG-TEC, mention « CNG » | Non |

Conditionnements affichés par le site : 1 L, 4 L, 5 L, 20 L, 208 L (fût), identiques pour toute la gamme.

## Huiles moto

| Produit | Variantes vendues | Photo du site | Aspect (contenant ; étiquette) | Photo propre à la variante ? |
|---|---|---|---|---|
| MÖTPRO 4T (moteur 4 temps) | 20W-40, 20W-50 (2) | …/motorcycle/motpro_4t.jpg : 1 photo pour les 2 grades ; elle montre SAE 20W50, JASO MA-2, API SN | Bidon noir/gris 1 L, bouchon rouge + boîte métallique jaune 800 ml ; Étiquette jaune-orangé, moto cross dessinée, bandeau rouge ; « 4T » rouge | Non |
| MÖTPRO 2T (moteur 2 temps) | (pas de grade SAE ; huile de couleur bleue) (1) | …/motorcycle/motpro_2t.jpg : Un seul produit, photo correspondante (2T, TC, JASO FC-FD) | Bidon noir/gris 1 L, bouchon rouge + boîte métallique jaune 800 ml ; Étiquette jaune-orangé, « 2T » ; même habillage que MÖTPRO 4T, seul le texte 2T / 4T change | Non |

Conditionnements affichés par le site : 1 L, 4 L, 5 L, 20 L, 208 L (fût), identiques pour toute la gamme.

## Huiles marine

| Produit | Variantes vendues | Photo du site | Aspect (contenant ; étiquette) | Photo propre à la variante ? |
|---|---|---|---|---|
| MARINEÖL Synthetic Marine Cylinder Oil | SAE 15W-40 / TBN 15, SAE 15W-40 / TBN 20, SAE 15W-40 / TBN 40, SAE 15W-40 / TBN 50 (4) | …/marine/marineol_1.jpg : 1 photo pour les 4 TBN ; elle montre SAE 15W40, TBN 50 (bidon noir 5 L + jerrycan argenté 20 L) | Bidon noir 5 L, bouchon rouge + jerrycan argenté 20 L ; Étiquette bleu turquoise à motif alvéolaire, bateau dessiné, bandeau rouge (TBN) ; « Synthetisches Meeresöl » | Non |
| MARINEÖL Mineral Marine Oil | SAE 40 / TBN 55, SAE 40 / TBN 70, SAE 40 / TBN 85, SAE 40 / TBN 100, SAE 50 / TBN 55, SAE 50 / TBN 70, SAE 50 / TBN 85, SAE 50 / TBN 100 (8) | …/marine/marineol_2.jpg : 1 photo pour les 8 combinaisons ; elle montre SAE 50, TBN 85 | Bidon noir 1 L + 5 L, bouchon rouge ; Étiquette bleu turquoise à motif alvéolaire, bateau dessiné, bandeau rouge (TBN) ; « Mineral Meeresöl », SAE 50 | Non |
| MARINEÖL Trunk Piston Marine Oil | SAE 40 / TBN 15, SAE 40 / TBN 20, SAE 40 / TBN 40, SAE 40 / TBN 50, SAE 40 / TBN 55, SAE 50 / TBN 15, SAE 50 / TBN 20, SAE 50 / TBN 40, SAE 50 / TBN 50, SAE 50 / TBN 55 (10) | …/marine/marineol_3.jpg : 1 photo pour les 10 combinaisons ; elle montre SAE 50, TBN 55 (1 L + 5 L + 20 L) | Bidon noir 1 L et 5 L, bouchon rouge + jerrycan argenté 20 L ; Étiquette bleu turquoise à motif alvéolaire, bateau dessiné, bandeau rouge (TBN) ; « Tauchkolben-Schiffsöl », SAE 50 | Non |
| MARINEÖL 2T Outboard Oil (refroidi par eau) | (pas de grade SAE ; huile de couleur bleue) (1) | …/marine/marineol_4.jpg : Un seul produit, photo correspondante (2 CYCLE, API TC-W3) | Bidon noir 1 L + 5 L, bouchon rouge ; Étiquette bleu turquoise à motif alvéolaire, bateau dessiné, bandeau rouge (TBN) ; moteur hors-bord dessiné, « 2 CYCLE » | Non |

Conditionnements affichés par le site : 1 L, 4 L, 5 L, 20 L, 208 L (fût), identiques pour toute la gamme.

## Huiles industrielles

| Produit | Variantes vendues | Photo du site | Aspect (contenant ; étiquette) | Photo propre à la variante ? |
|---|---|---|---|---|
| HYDKÖN Hydraulic Oil | ISO VG 10, ISO VG 15, ISO VG 22, ISO VG 32, ISO VG 37, ISO VG 46, ISO VG 68, ISO VG 100, ISO VG 150, ISO VG 220 (10) | …/industrial/hydkon.jpg : 1 photo pour les 10 grades ; elle montre ISO VG 68, 20 L | Jerrycan jaune vif 20 L (bouchon rouge) + tambour noir/chromé ; Étiquette crème/jaune, logo HYDKÖN, « Hydraulic 68 », ISO VG 68 | Non |
| LUB-TEC GRÖB Industrial Gear Oils | ISO VG 68, ISO VG 100, ISO VG 150, ISO VG 220, ISO VG 320, ISO VG 460, ISO VG 680, ISO VG 1000 (8) | …/industrial/lube_tec_grob.jpg : Pas de photo propre : La photo du site est un tambour chromé/noir générique « Petrovöll Motor Oil » sans étiquette produit, réutilisé à l'identique par 9 produits | Tambour métal chromé/noir ; Sans étiquette produit (marque Petrovöll Motor Oil seulement) | Non |
| TURBINE Oil | (aucun grade publié) (1) | …/industrial/lube_tec_grob.jpg : Pas de photo propre : La photo du site est un tambour chromé/noir générique « Petrovöll Motor Oil » sans étiquette produit, réutilisé à l'identique par 9 produits | Tambour métal chromé/noir ; Sans étiquette produit | Non |
| SCÖM Compressor Oil | (aucun grade publié) (1) | …/industrial/lube_tec_grob.jpg : Pas de photo propre : La photo du site est un tambour chromé/noir générique « Petrovöll Motor Oil » sans étiquette produit, réutilisé à l'identique par 9 produits | Tambour métal chromé/noir ; Sans étiquette produit | Non |
| SCHNEIDÖL Cutting Oil | (aucun grade publié (huile soluble, dilution 4-8 %)) (1) | …/industrial/lube_tec_grob.jpg : Pas de photo propre : La photo du site est un tambour chromé/noir générique « Petrovöll Motor Oil » sans étiquette produit, réutilisé à l'identique par 9 produits | Tambour métal chromé/noir ; Sans étiquette produit | Non |
| TRANSFORMER Oil | (aucun grade publié) (1) | …/industrial/lube_tec_grob.jpg : Pas de photo propre : La photo du site est un tambour chromé/noir générique « Petrovöll Motor Oil » sans étiquette produit, réutilisé à l'identique par 9 produits | Tambour métal chromé/noir ; Sans étiquette produit | Non |
| REFRIGERATION Oil | (aucun grade publié) (1) | …/industrial/lube_tec_grob.jpg : Pas de photo propre : La photo du site est un tambour chromé/noir générique « Petrovöll Motor Oil » sans étiquette produit, réutilisé à l'identique par 9 produits | Tambour métal chromé/noir ; Sans étiquette produit | Non |
| HEAT TRANSFER Oil | (aucun grade publié) (1) | …/industrial/lube_tec_grob.jpg : Pas de photo propre : La photo du site est un tambour chromé/noir générique « Petrovöll Motor Oil » sans étiquette produit, réutilisé à l'identique par 9 produits | Tambour métal chromé/noir ; Sans étiquette produit | Non |
| CIRCULATION Oil | (aucun grade publié) (1) | …/industrial/lube_tec_grob.jpg : Pas de photo propre : La photo du site est un tambour chromé/noir générique « Petrovöll Motor Oil » sans étiquette produit, réutilisé à l'identique par 9 produits | Tambour métal chromé/noir ; Sans étiquette produit | Non |
| TRANS-TECH Industrial Transmission Oil | SAE 10W, SAE 30, SAE 40, SAE 50 (4) | …/industrial/lube_tec_grob.jpg : Pas de photo propre : La photo du site est un tambour chromé/noir générique « Petrovöll Motor Oil » sans étiquette produit, réutilisé à l'identique par 9 produits | Tambour métal chromé/noir ; Sans étiquette produit | Non |

Conditionnements affichés par le site : 1 L, 4 L, 5 L, 20 L, 208 L (fût), identiques pour toute la gamme.

## Fluides de transmission automatique (ATF)

| Produit | Variantes vendues | Photo du site | Aspect (contenant ; étiquette) | Photo propre à la variante ? |
|---|---|---|---|---|
| DEXÖ ATF CVT | (fluide CVT, pas de grade) (1) | …/automatic_transmission/dexo_atf_cvt.jpg : Un seul grade ; photo propre à ce produit | Bidon noir/anthracite, bouchon rouge, 1 L + 4/5 L ; Étiquette dégradé bleu, logo DEXÖ bleu foncé, bandeau rouge ; seuls la couleur et le texte du grade changent : « ATF CVT » orange, bandeau « DEXRON CVT » (4 L) | Non |
| DEXÖ ATF DEXRON VI | (DEXRON VI) (1) | …/automatic_transmission/dexo_atf_vi.jpg : Un seul grade ; photo propre à ce produit | Bidon noir/anthracite, bouchon rouge, 1 L + 4/5 L ; Étiquette dégradé bleu, logo DEXÖ bleu foncé, bandeau rouge ; seuls la couleur et le texte du grade changent : « ATF VI » blanc/rosé, bandeau « DEXRON VI » (4 L) | Non |
| DEXÖ ATF DEXRON III | (DEXRON III) (1) | …/automatic_transmission/dexo_atf_iii.jpg : Un seul grade ; photo propre à ce produit | Bidon noir/anthracite, bouchon rouge, 1 L + 4/5 L ; Étiquette dégradé bleu, logo DEXÖ bleu foncé, bandeau rouge ; seuls la couleur et le texte du grade changent : « ATF III » rouge-rosé, bandeau « DEXRON III » (4 L) | Non |
| DEXÖ ATF DEXRON II | (DEXRON II) (1) | …/automatic_transmission/dexo_atf_ii.jpg : Un seul grade ; photo propre à ce produit | Bidon noir/anthracite, bouchon rouge, 1 L + 4/5 L ; Étiquette dégradé bleu, logo DEXÖ bleu foncé, bandeau rouge ; seuls la couleur et le texte du grade changent : « ATF II » jaune, bandeau « DEXRON II » (5 L) | Non |
| DEXÖ ATF Type A, Suffix A | (Type A, Suffix A) (1) | …/automatic_transmission/dexo_atf_typea.jpg : Un seul grade ; photo propre à ce produit | Bidon noir/anthracite, bouchon rouge, 1 L + 4/5 L ; Étiquette dégradé bleu, logo DEXÖ bleu foncé, bandeau rouge ; seuls la couleur et le texte du grade changent : « ATF TYPE A » jaune-orangé, bandeau « TYPE A SUFFIX A » (5 L) | Non |

Conditionnements affichés par le site : 1 L, 4 L, 5 L, 20 L, 208 L (fût), identiques pour toute la gamme.

## Huiles de boîte manuelle et pont

| Produit | Variantes vendues | Photo du site | Aspect (contenant ; étiquette) | Photo propre à la variante ? |
|---|---|---|---|---|
| MAX-GRÖB Synthetic Gear Oil | 75W-90, 80W-140 (2) | …/automatic_manual_gear/max_grob.jpg : 1 photo pour les 2 grades ; elle montre SAE 75W90 (1 L + 5 L), API GL-5 | Bidon noir 1 L + 5 L, bouchon rouge ; Étiquette rouge dégradé à motif alvéolaire, bandeau rouge sombre, pictogramme levier de vitesse ; « Synthetic Premium », SAE 75W90 | Non |
| MAX-GRÖB Gear Oil | SAE 90, SAE 140, 80W-90, 85W-140 (4) | …/automatic_manual_gear/max_grob_gear_oil.jpg : 1 photo pour les 4 grades ; elle montre deux bidons 5 L : SAE 80W90 et 85W140 (pas 90/140), GL-5 | Deux bidons noirs 5 L, bouchon rouge ; Étiquette rouge dégradé à motif alvéolaire, bandeau rouge sombre, pictogramme levier de vitesse ; identique au Synthetic, « Automotive », 80W90 / 85W140 | Non |

Conditionnements affichés par le site : 1 L, 4 L, 5 L, 20 L, 208 L (fût), identiques pour toute la gamme.

## Liquides de frein

| Produit | Variantes vendues | Photo du site | Aspect (contenant ; étiquette) | Photo propre à la variante ? |
|---|---|---|---|---|
| DOT 5.1 Brake Fluid | DOT 5.1 (1) | …/brake/dot_brakefluid.jpg : Photo unique partagée avec l'autre liquide de frein : deux flacons jaunes, « DOT 4 » (250 ml) et « DOT 5 » (500 ml) | Flacons jaunes 250 ml et 500 ml (pas de bidon) ; Étiquette blanc-bleu clair, « BRAKE FLUID DOT 4 / DOT 5 » | Non |
| DOT 4 & DOT 3 Brake Fluid | DOT 4, DOT 3 (2) | …/brake/dot_brakefluid.jpg : Photo unique partagée avec l'autre liquide de frein : deux flacons jaunes, « DOT 4 » (250 ml) et « DOT 5 » (500 ml) | Flacons jaunes 250 ml et 500 ml (pas de bidon) ; Étiquette blanc-bleu clair, « BRAKE FLUID DOT 4 / DOT 5 » | Non |

Conditionnements affichés par le site : 1 L, 4 L, 5 L, 20 L, 208 L (fût), identiques pour toute la gamme.

## Liquides de refroidissement

| Produit | Variantes vendues | Photo du site | Aspect (contenant ; étiquette) | Photo propre à la variante ? |
|---|---|---|---|---|
| KÜHLER Coolant & Anti-Freeze | Concentration 30 %, Concentration 33 %, Concentration 40 %, Concentration 50 %, Concentration 100 % (5) | …/coolants/kuhler.jpg : 1 photo pour les 5 concentrations ; elle montre le 100 % concentré, 5 L | Bidon noir 5 L, bouchon rouge ; Étiquette bleu-vert très clair, « COOLANT ANTIFREEZE », « 100 % concentrate » | Non |

Conditionnements affichés par le site : 1 L, 4 L, 5 L, 20 L, 208 L (fût), identiques pour toute la gamme.

## Graisses

| Produit | Variantes vendues | Photo du site | Aspect (contenant ; étiquette) | Photo propre à la variante ? |
|---|---|---|---|---|
| GLÄT EP0 / EP1 / EP2 (lithium extrême pression) | NLGI 0, NLGI 1, NLGI 2 (3) | …/greases/glat_ep0.jpg : 1 photo pour les 3 grades ; elle montre « GLÄT-EP 1 », seau 20 L | Seau noir 20 L ; Étiquette gris argenté alvéolaire, titre rouge « GLÄT-EP 1 », bandeau rouge | Non |
| GLÄT EP2 / EP3 (lithium complexe) | NLGI 2, NLGI 3 (2) | …/greases/glat_ep3.jpg : 1 photo pour les 2 grades ; elle montre « GLÄT-EP 2 » (pots 500 g et 1 kg, pas de EP3) | Pots à couvercle vert-olive 500 g et 1 kg ; Étiquette gris argenté alvéolaire, « GLÄT-EP 2 », « NLGI-EP2 Lithium Grease » | Non |
| GLÄT Multi-Purpose Grease (base calcium) | NLGI 2, NLGI 3 (2) | …/greases/glat_mp.jpg : 1 photo pour les 2 grades ; elle montre « GLÄT-EP 2 NLGI-EP2 Multi-Purpose Grease », seau 20 L | Seau noir 20 L ; Même habillage que GLÄT EP0/1/2 (seau noir, étiquette grise) ; seul le texte change | Non |

Conditionnements affichés par le site : 1 L, 4 L, 5 L, 20 L, 208 L (fût), identiques pour toute la gamme.

## Additifs et entretien

| Produit | Variantes vendues | Photo du site | Aspect (contenant ; étiquette) | Photo propre à la variante ? |
|---|---|---|---|---|
| Petrovöll Fuel Injector Cleaner | (pas de grade) (1) | …/additives/fuel_injector_cleaner.jpg : Un seul produit, photo propre (250 ml) | Flacon fuselé noir-violet 250 ml, bouchon noir ; Étiquette noire/rouge à motif alvéolaire, mention « Made in Netherlands » ; titre « FUEL INJECTOR CLEANER » jaune | Non |
| Petrovöll Diesel Injector Cleaner | (pas de grade) (1) | …/additives/diesel_injector_cleaner.jpg : Un seul produit, photo propre (250 ml) | Flacon fuselé noir-violet 250 ml, bouchon noir ; Étiquette noire/rouge à motif alvéolaire, mention « Made in Netherlands » ; titre « DIESEL INJECTOR CLEANER » orange | Non |
| Petrovöll Complete Fuel System Cleaner | (pas de grade) (1) | …/additives/complete_fuel_system_scanner.jpg : Un seul produit, photo propre (250 ml) | Flacon fuselé noir-violet 250 ml, bouchon noir ; Étiquette noire/rouge à motif alvéolaire, mention « Made in Netherlands » ; titre « COMPLETE FUEL SYSTEM CLEANER » bleu | Non |
| Petrovöll Octane Booster | (pas de grade) (1) | …/additives/octane_booster.jpg : Un seul produit, photo propre (250 ml) | Flacon fuselé noir-violet 250 ml, bouchon noir ; Étiquette noire/rouge à motif alvéolaire, mention « Made in Netherlands » ; titre « OCTANE BOOSTER » bleu/jaune | Non |
| Petrovöll Engine Oil Treatment | (pas de grade) (1) | …/additives/oil_treatment.jpg : Un seul produit, photo propre (boîte 444 ml) | Boîte métallique noire 444 ml ; Étiquette noire/rouge à motif alvéolaire, mention « Made in Netherlands » ; titre « OIL TREATMENT » jaune, piston | Non |
| Petrovöll Oil Stop Leak | (pas de grade) (1) | …/additives/oil_stop_leak.jpg : Un seul produit, photo propre (boîte 444 ml) | Boîte métallique noire 444 ml ; Étiquette noire/rouge à motif alvéolaire, mention « Made in Netherlands » ; titre « OIL STOP LEAK » rouge/jaune | Non |
| Petrovöll Carburetor and Choke Cleaner | (pas de grade) (1) | …/additives/plain.jpg : Pas de photo : image blanche vide 800x500 (la page « Products » affiche à la place la photo de Oil Stop Leak) | Inconnu (aérosol d'après le texte) ; Inconnue | Non |
| Petrovöll Engine Flush | (pas de grade) (1) | …/additives/plain.jpg : Pas de photo : image blanche vide 800x500 (la page « Products » affiche à la place la photo de Oil Stop Leak) | Inconnu ; Inconnue | Non |

Conditionnements affichés par le site : 1 L, 4 L, 5 L, 20 L, 208 L (fût), identiques pour toute la gamme.

## Écarts avec le site

Comparaison de `petrovoll-astro/src/data/produits-petrovoll.json` (45 entrées) avec le site officiel (45 fiches) :

1. **Doublons : aucun.** 45 identifiants et 45 noms distincts, correspondance 1 pour 1 avec la liste « Products » du site.
2. **Produits manquants ou en trop : aucun.**
3. **Noms : corrects.** Le JSON ajoute seulement des précisions (« Mineral », « moteur 4 temps »), sans erreur d'orthographe ni de tréma.
4. **Regroupements : conformes au site.** Une fiche = un produit avec plusieurs grades (STÄRK Fully 0W-40 et 5W-30 sont UN produit). Points sensibles, mais tels que publiés par le site : (a) GLÄT EP2 apparaît dans deux fiches (lithium EP et lithium complexe) ; (b) DOT 4 et DOT 3 sont dans une seule fiche ; (c) MARINEÖL Mineral et Trunk Piston ont des tableaux d'essais presque identiques, et les descriptions de « Synthetic Cylinder » et « Mineral » semblent inversées sur le site ; (d) le texte de MÖTPRO 4T est copié de STÄRK Fully.
5. **Photos :** 34 fiches du JSON ont une photo, 11 n'en ont pas (9 industrielles, carburateur, engine flush), ce qui correspond au site. Les deux fiches de frein utilisent le même fichier, donc 33 photos distinctes dans le JSON. Aucune photo par variante, comme sur le site.
6. **Photo contredisant la fiche :** GLÄT EP2/EP3 : photo EP2 seulement ; GLÄT Multi-Purpose : photo étiquetée « EP2 … Multi-Purpose », sans mention de calcium ; DOT 5.1 : la photo montre « DOT 4 » et « DOT 5 » ; MAX-GRÖB Gear Oil : photo 80W90 et 85W140 seulement.
7. **Conditionnements :** le JSON reprend « 1 L, 4 L, 5 L, 20 L, 208 L » pour 45/45 produits, comme le site, mais c'est un gabarit : les photos montrent des flacons de frein de 250 et 500 ml, des additifs de 250 ml et 444 ml, des graisses en pots 500 g / 1 kg et seau 20 L, une boîte moto de 800 ml, ATF CVT et III en 4 L. À confirmer auprès du fabricant.
8. **Grades génériques :** le site affiche « Grades : 5W-30, 5W-40, 10W-30, 10W-40, 20W-30 et 20W-40 » sur de nombreux produits qui ne sont pas des huiles moteur (freins, additifs, turbine, transformateur…). Le JSON les ignore, correctement. Les grades retenus viennent des tableaux d'essais, cohérents avec ce document.
9. **Variantes :** le JSON les a toutes (TBN pour MARINEÖL, concentration pour KÜHLER). Rien à corriger côté données ; la ressemblance vient des visuels.
