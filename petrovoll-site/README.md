# PETROVOLL — Squelette du site (Next.js + Payload CMS)

Squelette structurel complet du site d'entreprise B2B/B2C d'une société de
distribution multi-secteurs basée en Afrique de l'Ouest :

1. **Huile moteur & lubrifiants — marque PETROVOLL** (secteur principal, produit phare)
2. Transport & logistique
3. Distribution & import-export
4. Pneumatiques
5. Fournitures de bureau

> **État du livrable** : arborescence + configuration + composants vides
> documentés par des `// TODO`. **Aucun contenu réel ni donnée métier n'est
> branché** — c'est intentionnel (voir la section « Contenu placeholder »).

---

## 1. Stack technique

| Domaine     | Technologie                                               |
| ----------- | --------------------------------------------------------- |
| Frontend    | Next.js 14 (App Router, TypeScript)                        |
| UI          | Tailwind CSS 3 + shadcn/ui (`components/ui`)               |
| Animations  | Framer Motion + `react-lottie-player`                      |
| 3D          | Three.js + React Three Fiber 8 + `@react-three/drei` 9     |
| Admin       | Payload CMS v3 (headless, self-hosted)                      |
| Données     | Prisma ORM + PostgreSQL 16                                  |
| Médias      | Cloudinary (+ stockage disque local en développement)       |
| Auth admin  | NextAuth.js v5 (provider Credentials)                       |
| Déploiement | Docker Compose (dev) · VPS Linux + PM2 + Nginx (prod)       |

---

## 2. Démarrage rapide

```bash
# 1. Dépendances (le flag est déjà actif via .npmrc → legacy-peer-deps=true)
npm install

# 2. Variables d'environnement
cp .env.local.example .env.local      # puis renseigner les secrets

# 3. Base de données (Docker)
npm run db:up                          # démarre PostgreSQL uniquement
npm run prisma:generate                # génère le client Prisma
npm run prisma:migrate                 # applique les migrations

# 4. Développement
npm run dev                            # http://localhost:3000
```

Application complète en conteneurs :

```bash
docker compose up -d                   # db + web
docker compose --profile tools up -d   # + Adminer sur http://localhost:8080
```

---

## 3. ⚠️ Compatibilité Payload v3 ↔ Next.js — À LIRE EN PREMIER

Deux contraintes techniques rendent la combinaison littérale demandée
**impossible à installer telle quelle** :

| Contrainte                                                            | Conséquence                                              |
| --------------------------------------------------------------------- | -------------------------------------------------------- |
| Payload CMS v3 déclare `peerDependencies: { next: "^15.2.3" }`         | `npm install` échoue (ERESOLVE) avec Next.js 14          |
| `next.config.ts` n'est chargé **qu'à partir de Next.js 15**            | `next dev` refuse de démarrer avec un `.ts` sur Next 14  |

### Choix retenu pour ce squelette

- **Next.js 14.2.x** respecté (comme demandé), avec React 18,
  `@react-three/fiber` **v8** et `@react-three/drei` **v9**
  (R3F v9 exigerait React 19).
- `.npmrc` contient `legacy-peer-deps=true` → `npm install` fonctionne malgré la
  peerDependency stricte de Payload.
- La configuration Next est nommée **`next.config.mjs`** (et non `next.config.ts`,
  incompatible avec Next 14). Le contenu est identique ; la conversion est
  détaillée en tête du fichier.
- Les 5 collections Payload (`payload/`) sont écrites et typées, mais le panel
  **n'est pas encore monté** : `app/(admin)/admin/[...rest]/page.tsx` affiche un
  placeholder qui contient la procédure de montage exacte, étape par étape.

### Rendre Payload opérationnel

```diff
# package.json
-    "next": "^14.2.15",
-    "react": "^18.3.1",
-    "react-dom": "^18.3.1",
-    "@react-three/fiber": "^8.17.10",
-    "@react-three/drei": "^9.114.3",
+    "next": "^15.2.3",
+    "react": "^19.0.0",
+    "react-dom": "^19.0.0",
+    "@react-three/fiber": "^9.0.0",
+    "@react-three/drei": "^10.0.0",
```

```js
// next.config.mjs → renommer en next.config.ts et ajouter :
import { withPayload } from '@payloadcms/next/withPayload'
export default withPayload(nextConfig, { devBundleServerPackages: false })
```

Puis dérouler les étapes détaillées dans
`app/(admin)/admin/[...rest]/page.tsx` (renommage du dossier en `[[...segments]]`,
création des fichiers `page.tsx` / `layout.tsx` / `not-found.tsx` attendus par
Payload, puis `npm run payload:generate-importmap` et
`npm run payload:generate-types`).

> **Migration R3F v8 → v9** : lire le guide officiel de migration
> `@react-three/fiber` avant de sauter le pas — l'API `useFrame`, le typage JSX
> et la gestion des événements ont évolué.

---

## 4. Arborescence livrée

```
petrovoll-site/
├── app/
│   ├── layout.tsx                 # Layout racine (polices Inter + Bebas Neue)
│   ├── (public)/                  # Routes publiques (route group invisible dans l'URL)
│   │   ├── layout.tsx             # Navbar + main + Footer
│   │   ├── page.tsx               # Home : Hero 3D + 5 sections
│   │   ├── produits/              # Catalogue + fiche produit [slug]
│   │   ├── secteurs/[secteur]/    # Page secteur
│   │   ├── a-propos/  contact/
│   ├── (admin)/
│   │   ├── layout.tsx             # Garde admin + noindex
│   │   └── admin/[...rest]/       # Montage Payload (placeholder documenté)
│   └── api/
│       ├── auth/[...nextauth]/    # Handlers NextAuth v5
│       └── produits/              # API catalogue (+ [slug])
├── components/
│   ├── layout/                    # Navbar, Footer, MobileMenu
│   ├── home/                      # Hero, ProduitPhare, SecteursGrid, Stats, CTA
│   ├── 3d/                        # BidonScene, BidonModel, SceneLights
│   ├── produits/                  # Card, Grid, Filtre, Detail, SecteurDetail
│   └── ui/                        # shadcn/ui (button, card + README de la CLI)
├── lib/                           # db (Prisma), cloudinary, auth, utils
├── payload/                       # payload.config.ts + 5 collections
├── prisma/                        # schema.prisma (schémas `app` / `payload`)
├── public/                        # models/ images/ videos/ media/
├── styles/globals.css             # Design tokens + utilities de la charte
├── types/                         # Types métier (+ payload-types générés)
├── deploy/                        # Nginx + PM2 (déploiement VPS)
├── middleware.ts                  # Protection des routes /admin
├── next.config.mjs  Dockerfile  docker-compose.yml
└── .env.local.example  .npmrc  tsconfig.json  tailwind.config.ts  components.json
```

### Ajouts par rapport à l'arborescence demandée (et pourquoi)

| Fichier / dossier                                        | Raison                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| `app/layout.tsx`                                         | Obligatoire dans l'App Router (polices, métadonnées, `<html>`)       |
| `app/(admin)/layout.tsx`                                 | Garde serveur + `noindex` du panel                                   |
| `tsconfig.json`, `postcss.config.mjs`, `components.json`  | Requis par TypeScript, Tailwind et la CLI shadcn/ui                  |
| `next.config.mjs`                                        | `next.config.ts` impossible en Next 14 (voir § 3)                    |
| `components/produits/SecteurDetail.tsx`                   | La route `secteurs/[secteur]` a besoin d'un contenu                  |
| `middleware.ts`                                          | Le panel admin doit être protégé (demande : « panel protégé »)        |
| `Dockerfile`, `.dockerignore`                             | Nécessaires à `docker-compose.yml`                                  |
| `deploy/` (Nginx + PM2)                                   | Demande explicite : « structure prête pour VPS (PM2 + Nginx) »        |
| `.npmrc`                                                  | Rend `npm install` possible (voir § 3)                              |
| `components/ui/README.md`                                 | Liste des primitives à générer via la CLI shadcn/ui                  |
| `public/models/README.md`                                 | Cahier des charges du `.glb` du bidon PETROVOLL                     |

---

## 5. Design system

| Token          | Valeur    | Usage                                      |
| -------------- | --------- | ------------------------------------------ |
| `ink-900`      | `#0A0A0A` | Fond principal (noir profond)              |
| `brand-500`    | `#D4420A` | Actions, accents, CTA                      |
| `gold-400`     | `#F5A623` | Highlights, chiffres clés, badges          |
| `font-sans`    | Inter     | Corps de texte                             |
| `font-display` | Bebas Neue| Titres (majuscules, `tracking-industrial`) |

Détails : `tailwind.config.ts` (thème, ombres, animations) et
`styles/globals.css` (variables CSS shadcn/ui, utilitaire `.navbar-scrolled`
en glassmorphism, respect de `prefers-reduced-motion`).

Contraintes tenues : navbar sticky glassmorphism au scroll, hero plein écran
avec le bidon 3D à droite, animations `fadeInUp` / `staggerChildren`,
section PETROVOLL visuellement plus imposante que les autres produits.

---

## 6. Contenu placeholder — à ne pas oublier

Aucune donnée métier n'est branchée. Points d'entrée des `// TODO` :

- **3D** : `components/3d/BidonScene.tsx` → procédure complète de câblage du `.glb`
- **Catalogue** : `app/(public)/produits/page.tsx` → requêtes Payload à écrire
- **Produit phare** : `app/(public)/page.tsx` → `where: { estProduitPhare: { equals: true } }`
- **Auth** : `lib/auth.ts` → l'implémentation de `authorize()` est volontairement
  absente : personne ne peut se connecter en l'état
- **Stats** : `components/home/StatsSection.tsx` → valeurs à **zéro** tant que le
  client n'a pas validé ses chiffres
- **Coordonnées** : Footer, `/contact`, CTA WhatsApp → à faire confirmer par le client

### Points de vigilance métier / conformité

- **Deux migrations sur une seule base** : Payload et Prisma gèrent chacun leurs
  migrations. Isoler les tables applicatives (leads, newsletter) dans un schéma
  PostgreSQL dédié (`app`) des collections Payload (`payload`) — détail dans
  l'en-tête de `prisma/schema.prisma`.
- **Mentions légales** : RCCM / IFU / licence d'importateur selon les pays
  d'exercice (à insérer dans le footer).
- **Protection des données** : consentement explicite sur le formulaire de devis,
  droit à l'effacement, bandeau cookies si audience européenne.
- **Performance mobile** : marché majoritairement mobile 3G/4G → surveiller le
  poids du `.glb`, activer `AdaptiveDpr` / `PerformanceMonitor` (drei), limiter
  les animations coûteuses.
- **SEO** : fiches produits et pages secteurs indexables (`generateStaticParams`,
  ISR, JSON-LD `Product`).

---

## 7. Scripts npm

| Script                            | Rôle                                                |
| --------------------------------- | --------------------------------------------------- |
| `dev` / `build` / `start`         | Cycle Next.js classique                             |
| `typecheck`                       | `tsc --noEmit` (à lancer en CI)                     |
| `lint` / `format`                 | ESLint / Prettier                                    |
| `db:up` / `db:down`               | PostgreSQL via Docker Compose                        |
| `prisma:generate`                 | Génère le client Prisma (**requis après install**)   |
| `prisma:migrate` / `prisma:studio`| Migrations / exploration de la base                 |
| `payload` / `payload:generate-*`  | CLI Payload (migrations, import map, types)          |

---

## 8. Déploiement (VPS Linux)

1. `npm ci --legacy-peer-deps && npm run build`
2. `pm2 start deploy/ecosystem.config.js --env production`
3. Nginx : copier `deploy/nginx/petrovoll.conf` dans `/etc/nginx/sites-available/`,
   remplacer les placeholders (domaine, chemin), puis
   `nginx -t && systemctl reload nginx`
4. TLS : `certbot --nginx -d petrovoll.example -d www.petrovoll.example`
5. Sauvegardes PostgreSQL planifiées + rotation des logs PM2 (`pm2-logrotate`)

> Alternative conteneurisée : `docker compose up -d` sur le VPS
> (image construite par le `Dockerfile` multi-étapes, sortie `standalone`).



