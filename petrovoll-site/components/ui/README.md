# components/ui — primitives shadcn/ui

Ce dossier contient les primitives d'interface du projet (boutons, cards,
dialogues, champs de formulaire…), générées par la CLI **shadcn/ui**.

## Déjà généré

| Fichier       | Usage                                     |
| ------------- | ----------------------------------------- |
| `button.tsx`  | Boutons (variantes `primary`, `gold`, `outline`, `ghost`, `link`) |
| `card.tsx`    | Cards (secteurs, produits, avantages)     |

Ces deux fichiers ont été écrits directement (et non via la CLI) pour être
immédiatement alignés sur la charte : angles peu arrondis (`--radius`),
typo d'affichage Bebas Neue, palette `brand` / `gold` / `ink`.

## À générer avec la CLI (ne pas écrire à la main)

```bash
# Prérequis : components.json est déjà configuré à la racine du projet
npx shadcn@latest add input textarea label checkbox select form sheet dialog \
  dropdown-menu accordion tabs badge separator skeleton sonner
```

Après génération :

- les composants arrivent dans `components/ui/` avec les bonnes importations
  (`@/lib/utils` → `cn`) ;
- l'alias `@/*` est déjà déclaré dans `tsconfig.json` ;
- `styles/globals.css` contient déjà les variables CSS attendues
  (`--background`, `--primary`, `--ring`, …) : la CLI ne les écrasera pas
  si le fichier est correctement détecté.

## Composants attendus par les autres parties du squelette

| Composant shadcn | Utilisé par                                        | TODO lié          |
| ---------------- | -------------------------------------------------- | ----------------- |
| `Sheet`          | `components/layout/MobileMenu.tsx` (drawer mobile) | TODO [ui] Navbar  |
| `Form` + `Input` + `Textarea` | formulaire de devis (`/contact`)      | TODO [form]       |
| `Checkbox` + `Accordion` | `components/produits/ProduitFiltre.tsx`    | TODO [filtres]    |
| `DropdownMenu`   | barre utilisateur de l'admin                       | TODO [admin]      |
| `Badge`          | badges produits (disponibilité, marque)            | TODO [ui]         |
| `Skeleton`       | états de chargement (`loading.tsx`)                | TODO [perf]       |
| `Toaster`        | retours des formulaires (succès / erreur)          | TODO [form]       |
| `Pagination`     | catalogue `/produits`                              | TODO [ui]         |

## Convention de style

- Palette : `ink` (noir #0A0A0A), `brand` (rouge-orangé #D4420A),
  `gold` (or #F5A623) — définie dans `tailwind.config.ts`.
- Titres : `font-display` (Bebas Neue, majuscules, `tracking-industrial`).
- Ombres : `shadow-industrial`, `shadow-glow`, `shadow-gold`.
- Ne pas introduire de couleur pastel (contrainte de la charte).
