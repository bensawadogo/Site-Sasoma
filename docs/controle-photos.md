# Contrôle des photos produits v3

Contrôle fait en pleine taille (1200x1200 sur fond gris) : bouchon, contour des 4 côtés, poignée, aucun pixel d'un autre objet, liseré, étiquette. Méthode : SAM ViT-B (boîte + points), sans recadrage ni symétrie.

| id | résultat |
|---|---|
| stark-fully-synthetic | OK (une minuscule pointe bleue sur le flanc droit) |
| stark-semi-synthetic | OK |
| volex-multigrade-mineral | OK |
| vono-mineral | OK |
| viro-tec-fully-synthetic | OK |
| viro-tec-semi-synthetic | OK |
| d-tec-mineral | OK |
| cng-tec | OK |
| motpro-4t | OK |
| motpro-2t | OK |
| marineol-synthetic-cylinder | Défaut mineur : petite pointe claire près du col (reste du fond) ; sinon OK |
| marineol-mineral | OK |
| marineol-trunk-piston | Défaut mineur : quelques dents irrégulières sur la poignée côté droit ; sinon OK |
| marineol-2t-outboard | OK |
| hydkon-hydraulic | OK (bord droit entier ; léger crénelage de la poignée supérieure) |
| dexo-atf-cvt | OK |
| dexo-atf-dexron-vi | OK |
| dexo-atf-dexron-iii | OK (fin filet clair très ténu sur le flanc gauche) |
| dexo-atf-dexron-ii | OK |
| dexo-atf-type-a | OK |
| max-grob-synthetic | OK |
| max-grob-gear | Défaut mineur : œillet de la poignée avec un petit cran au bord haut (reste du bidon de derrière retiré) ; sinon bouchon, contour et étiquette OK |
| dot-5-1 | OK, photo complète à deux flacons (DOT 4 + DOT 5) : le DOT 5 est caché en partie par le DOT 4, rien reconstruit ; bouchons présents |
| dot-4-3 | OK |
| kuhler | Défaut mineur : fine trace claire au pied droit |
| glat-ep0-ep1-ep2 | OK |
| glat-ep2-ep3 | Défaut de la source : le texte de l'étiquette (NLGI-EP2 / LITHIUM) est rogné à gauche dans la photo officielle ; pot entier, couvercle et bords OK |
| glat-multi-purpose | OK |
| fuel-injector-cleaner | OK |
| diesel-injector-cleaner | Défaut mineur : petit reste d'ombre grise au pied droit |
| complete-fuel-system-cleaner | Défaut mineur : petit reste d'ombre grise au pied droit |
| octane-booster | OK |
| oil-treatment | OK |
| oil-stop-leak | OK |
