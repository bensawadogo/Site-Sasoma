# Recherche marque Petrovöll — phase 1 du [brief](../BRIEF-MAITRE.md)

Relevé du site officiel petrovoll.com avec Playwright (2026-09-27) : 60 pages visitées, 0 erreur.

| Fichier | Contenu |
|---|---|
| [catalogue.json](catalogue.json) | 45 produits en 11 catégories : base, viscosités, normes, homologations, usage, mots de l'étiquette, photo officielle correspondante, liens vers 16 certificats PDF |
| [palette.json](palette.json) | Couleurs relevées dans la feuille de style du site et mesurées sur le logo, couleur par catégorie, polices |
| [photos/index.json](photos/index.json) | 76 visuels téléchargés : source, dimensions, statut hero / référence et raison |

Tableaux lisibles du catalogue : [../docs/catalogue-petrovoll.md](../docs/catalogue-petrovoll.md).

## Visuels : utilisable pour le hero ou référence ?

| Groupe | Nombre | Nature | Hero | Autre usage |
|---|---|---|---|---|
| Produits | 35 | Rendus 3D de synthèse, fond blanc, 800×1000 (2 en 3333×4167), bidon 1 L + 4/5 L superposés | ❌ Référence : ce ne sont pas des photos réelles, pas de fond noir, pas de bidon seul, pas de version sans bouchon | Fiches du catalogue, **avec autorisation écrite** |
| Bannières | 30 | Mises en scène web et mobile, avec bidons, texte et logos | ❌ Référence d'ambiance ; interdites comme image d'entrée IA (règle 4) | — |
| Usine | 9 | Cuves, laboratoire, ligne de remplissage | ❌ Hors sujet | Page À propos, avec autorisation |
| Logo | 2 | PNG 220×132 et 70×53 | ❌ Trop petit | Demander le SVG officiel |
| Placeholder | 1 | `plain.jpg`, image vide | Rejet | — |

**Conclusion : aucun visuel officiel ne peut servir de P1 à P4.** Les photos réelles du bidon doivent être prises et déposées dans `assets/photos/` (phase 4).

## Limites
- **Pas de fiche technique en ligne** : le site ne publie que des certificats. D'après la règle 5, les données du catalogue restent une référence tant que `assets/tds/` est vide.
- **Photo manquante** : deux produits n'ont pas de visuel (nettoyant carburateur, rinçage moteur). Les huiles industrielles partagent un fût générique ; DOT 5.1 et DOT 4/3 partagent le même visuel.
- **Droits** : visuels © Petrovöll GmbH. Les images restent en local et ne sont **pas versionnées** (voir [photos/.gitignore](photos/.gitignore)).
- **Polices de la marque** (Azo Sans, Avenir) : licences commerciales, à ne pas auto-héberger sans licence.
- **Réseaux sociaux** : Instagram et Facebook n'ont pas été explorés ; ils demandent une connexion.
