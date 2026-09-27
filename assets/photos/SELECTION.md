# Sélection des photos du bidon (phase 4 du brief)

Contrôles appliqués à chaque photo reçue :
1. **Origine** : certificat C2PA ou informations du fichier ; aucun bidon généré par IA (règle 3).
2. **Taille utile du bidon** : au moins 1500 px de haut pour le palier full. Sur mobile (palier standard), 350 px suffisent : le bidon occupe 176 px CSS à l'écran, ×2 en haute densité.
3. **Cadrage** : bidon seul, de face, facile à détourer.
4. **Étiquette** : textes exacts (pas de mots inventés).

| # | Fichier | Produit visible | Taille du bidon | Origine | Verdict |
|---|---|---|---|---|---|
| 1 | `recues/01-REJET-ia-chatgpt-stark-5w30-5L.png` | STÄRK 5W30, 5 L | 1254×1254 (image entière) | **Générée par ChatGPT** (C2PA OpenAI, `trainedAlgorithmicMedia`, 19/09/2026) ; texte inventé sur l'étiquette (« Hoddisynthetisches », « Euros 5 ») | ❌ **Rejet** (règles 3 et 7). Sert seulement de modèle d'ambiance pour une vraie prise de vue. |
| 2 | `recues/02-stark-5w40-4L-405x540.webp` | STÄRK Voll Synthetisch 5W40, 4 L | 220×284 px, fond blanc | Rendu de packshot sans marquage IA ; étiquette cohérente | ⚠️ **Trop petite** : demander le fichier original. |
| 3 | `recues/03-stark-semi-10w40-1L-500x500.png` | STÄRK Teil Synthetisches 10W40, 1 L | **300×469 px**, déjà détouré (transparent) | Rendu de packshot sans marquage IA ; étiquette exacte (adresse de Bochum, HRB 13558) | ✅ **Retenue en P1 provisoire** → `stark/P1.png`. Suffit pour mobile, trop petite pour le palier full et les écrans d'ordinateur haute densité. |

## Ce qui manque encore
- **P1 en grand** : une version d'au moins 1500 px de haut, même vue.
- **P2 et P3** : le bidon sans bouchon, même cadrage, et le bouchon seul.
- **P4** : la bande de niveau, si le bidon en a une.
