# Relecture de l'optimisation appareils + réseau (06/10/2026)

Méthode : build de production, site servi depuis `dist/` par un petit serveur local (`ops/captures/relecture-optim/serveur.py`, avec gzip et en-têtes proches de Cloudflare), pilotage par Python Playwright (Chromium). `astro preview` ne fonctionne pas avec l'adaptateur Cloudflare du projet. Scripts de test et captures : `ops/captures/relecture-optim/`.

## Ce qui marche (mesuré)

Accueil, mouvement non réduit, après descente jusqu'à la section du bidon, sans cache :

| Niveau | Écran | Requêtes | Poids | Hero (images de séquence) | Atlas moteur | Images du bidon |
|---|---|---|---|---|---|---|
| fort | 1440 | 151 | 7,1 Mo | 74 | 1,5 Mo | 40 |
| fort | 390 | 158 | 5,4 Mo | 76 | 1,5 Mo | 48 |
| moyen | 1440 | 111 | 4,4 Mo | 53 | 0,9 Mo | 24 |
| moyen | 390 | 96 | 3,1 Mo | 41 | 0,9 Mo | 24 |
| faible | 1440 | 44 | 0,77 Mo | 6 | 0 | 1 |
| faible | 390 | 42 | 0,60 Mo | 6 | 0 | 1 |

(Poids hors compression des pages : en production Cloudflare compresse HTML/CSS/JS.)

- Aucune erreur console ni exception, aux 3 niveaux, en 1440 et 390, en mouvement réduit comme en `no-preference`.
- `data-appareil` toujours correct (forçage `?appareil=` et calcul naturel : ce PC, 8 cœurs / 16 Go, donne « fort », y compris avec mouvement réduit).
- Hero et section bidon s'affichent aux 3 niveaux (pas de zone vide). En faible : affiche fixe du moteur, bidon de face + 3 cartes empilées (captures `bidon-*-faible.png`, `faible-bidon-haut.png`).
- Bandes : fort = défilement CSS actif et pause hors écran ; faible = pas d'animation, rail glissable (scrollWidth 3189 > 390), une seule copie, bouton pause masqué.
- Téléphone lent simulé (390x844, CPU x6, réseau 400 kbit/s, latence 400 ms, sans cache), accueil :

| Niveau | Premier affichage (FCP) | LCP | Octets reçus à 15 s | à 40 s |
|---|---|---|---|---|
| faible | 3,5 s | 4,6 s | 0,50 Mo | 0,50 Mo |
| moyen | 4,6 s | 5,0 s | 0,48 Mo | 0,85 Mo |
| fort | 6,1 s | 6,3 s | 0,48 Mo | 0,85 Mo |

  Mesures bruitées (une première série avec HTML non compressé donnait 6,4 s pour tous) ; ordre de grandeur : le niveau faible s'affiche environ 2 s plus tôt et s'arrête à 0,5 Mo. Le goulot restant avant l'affichage est le CSS global bloquant (13 Ko gzip) en concurrence avec les 2 polices préchargées (60 Ko) : sur 50 Ko/s, les polices retardent le CSS de ~1 s. Piste (non faite) : ne précharger que la police du titre, ou différer Inter.
- Service worker (build final) : enregistré et actif ; `/keystatic` et `/api` jamais en cache ; hors ligne, accueil, `/produits` et `/contact` (visités) s'affichent, `/a-propos` et `/secteurs/transport` (non visités) montrent la page « Hors ligne » avec la liste des 3 pages disponibles ; retour en ligne OK (captures `horsligne-accueil.png`, `horsligne-page.png`).

## Défauts corrigés

1. `petrovoll-astro/public/sw.js` : le délai réseau de 8 s basculait vers « hors ligne » même quand AUCUNE copie n'existait. En 3G très lente, première visite d'une page = page « Hors ligne » alors que la page arrivait. Maintenant le délai ne s'applique que s'il y a une copie ; sinon on attend le réseau.
2. `sw.js` : le plafond du cache des pages pouvait éjecter `/hors-ligne` (la plus ancienne entrée) après 40 pages, et l'index des titres. Ces deux clés sont désormais exclues du plafonnement.
3. `sw.js` : le cache `static` n'avait aucun plafond : chaque publication ajoute de nouveaux fichiers `/_astro/` hachés, les anciens s'accumulaient pour toujours. Plafond de 200 entrées (`MAX_STATIC`).
4. `sw.js` : fichiers à nom fixe (images, polices, décodeurs) servis depuis le cache sans fin, donc vieille version « pour toujours » si on les remplace (le propriétaire remplace souvent des images). Maintenant : si la copie a plus de 24 h, requête conditionnelle (ETag, 304 de quelques octets) en arrière-plan ; la version fraîche sert à la visite suivante. Les fichiers `/_astro/` (hachés) et les URL à `?v=` (séquences hero/bidon, atlas) ne sont jamais revérifiés : aucune donnée gaspillée.
5. `sw.js` : cache des séquences relevé de 90 à 160 entrées (hero ≈ 100 images + bidon ≤ 48 sur un appareil fort : à 90, le cache tournait en rond et la 2e visite retéléchargeait tout).
6. `src/components/layout/ServiceWorker.astro` : l'enregistrement exigeait `https:` ou le nom `localhost` ; remplacé par `window.isSecureContext` (accepte aussi 127.0.0.1, ne change rien en production).
7. `src/components/home/ProduitScroll.astro` : `IntersectionObserver` utilisé sans test ; sur un très vieux navigateur le script levait une exception avec la section à moitié animée. Maintenant : sans cette API, on garde la disposition statique.
8. `src/lib/capacite-appareil.ts` (+ test, + `docs/optimisation-appareils.md`) : la règle « ≤ 4 cœurs → moyen » est retirée (voir avis ci-dessous).

## Avis sur le seuil « ≤ 4 cœurs »

Mauvais signal et dans les deux sens : un PC de bureau (i3/i5 à 4 threads, 8 Go+) perdait hero complet et bidon à 48 images, alors que les téléphones d'entrée de gamme annoncent 8 cœurs (lents) et sont déjà repérés par la RAM (`deviceMemory` ≤ 4 → moyen, ≤ 2 → faible) et le réseau. Conservé : ≤ 2 cœurs → faible. Le PC du propriétaire reste « fort ». Contrepartie assumée : un Android 4 cœurs avec Firefox (pas de `deviceMemory`) reste « fort » ; très minoritaire sur le public visé.

## Restant à décider (non fait)

- Préchargement de polices : 60 Ko en concurrence avec le CSS bloquant sur 3G (voir ci-dessus).
- Le hero du niveau « moyen » reste lourd à froid sur 3G (0,85 Mo en 40 s) : si le réseau est 3g, `effectiveType` classe déjà faible/moyen ; sur 4G instable, rien ne le fait baisser. Option : mesurer `downlink`.
- Filtre catalogue en React (~140 Ko) : réécriture possible en script natif (déjà signalée par l'agent réseau).
- `noyau.ts` ligne ~796 : `new IntersectionObserver` du hero sans test d'existence (antérieur au travail des agents ; Chrome ≥ 51, risque négligeable).
- Domaine `site` toujours `https://sasoma.example` : les canonical et l'aperçu de partage sont faux tant qu'il n'est pas changé.
- Quand un fichier à nom fixe est remplacé et qu'on veut l'effet immédiat chez tout le monde : changer `VERSION` dans `public/sw.js`.
- Non testé : vrai téléphone Android, vrai Slow 3G de bout en bout avec le service worker (test en émulation seulement), Cloudflare en production (en-têtes `_headers`).

## Vérifications finales

`npm run test` : 83/83 ; `npm run build` : OK ; `dist/sw.js` identique à `public/sw.js`. Serveur de relecture arrêté. Aucun git commit/checkout/stash/reset, aucune suppression.

Captures : `ops/captures/relecture-optim/` (`hero-{desktop,mobile}-{fort,moyen,faible}.png`, `bidon-*.png`, `faible-bidon-haut.png`, `bande-{faible,fort}.png`, `horsligne-*.png`, `lent-*.png`).
