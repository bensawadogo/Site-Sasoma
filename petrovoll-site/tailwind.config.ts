import type { Config } from 'tailwindcss'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TAILWIND CONFIG — DESIGN SYSTEM PETROVOLL
 * ────────────────────────────────────────────────────────────────────────────
 * Direction artistique : industriel / premium / B2B africain (pas de pastel).
 *
 *  • Noir profond  #0A0A0A  → fonds, navbar, sections "premium"
 *  • Rouge-orange  #D4420A  → couleur d'action (CTA, accents, soulignements)
 *  • Or / ambre    #F5A623  → highlights, badges, chiffres clés, hovers
 *
 * Typographies :
 *  • Inter      (corps de texte)     → var(--font-sans)
 *  • Bebas Neue (titres impactants)  → var(--font-display)
 *    Ces variables sont injectées par `next/font/google` dans app/layout.tsx.
 *
 * TODO [design] : ajuster les nuances 50→950 une fois la charte graphique
 * définitive fournie par le client (fichier de marque + logo vectoriel).
 */
const config: Config = {
  // shadcn/ui : 'class' permet de forcer un thème sombre localement
  // (ex. section PETROVOLL mise en avant sur fond noir).
  darkMode: ['class'],

  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './payload/**/*.{ts,tsx}',
  ],

  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.25rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '3rem',
      },
      screens: {
        '2xl': '1440px',
      },
    },
    extend: {
      /* ── Palette de marque ─────────────────────────────────────────────── */
      colors: {
        // Noir profond — couleur dominante de l'identité visuelle
        ink: {
          DEFAULT: '#0A0A0A',
          50: '#F5F5F5',
          100: '#E5E5E5',
          200: '#CCCCCC',
          300: '#A3A3A3',
          400: '#6E6E6E',
          500: '#404040',
          600: '#262626',
          700: '#171717',
          800: '#0F0F0F',
          900: '#0A0A0A',
          950: '#050505',
        },
        // Rouge / orange industriel — couleur d'action
        brand: {
          DEFAULT: '#D4420A',
          50: '#FEF3ED',
          100: '#FDE3D4',
          200: '#FAC2A5',
          300: '#F7986E',
          400: '#EE6A3B',
          500: '#D4420A',
          600: '#B33507',
          700: '#8F2A06',
          800: '#6B2005',
          900: '#4A1604',
          950: '#2A0C02',
        },
        // Or / ambre — accentuation premium
        gold: {
          DEFAULT: '#F5A623',
          50: '#FFFAEB',
          100: '#FEF0C7',
          200: '#FDE08A',
          300: '#FBC94D',
          400: '#F5A623',
          500: '#DC8A0B',
          600: '#B36A08',
          700: '#8A4E09',
          800: '#61380C',
          900: '#3D2308',
          950: '#1F1104',
        },

        /* ── Tokens shadcn/ui (mappés sur les CSS vars de styles/globals.css) */
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      /* ── Typographies ─────────────────────────────────────────────── */
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Bebas Neue', 'Impact', 'sans-serif'],
      },
      letterSpacing: {
        industrial: '0.08em',
      },

      /* ── Rayons / ombres (style industriel : angles peu arrondis) ─────── */
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        industrial: '0 10px 40px -12px rgba(10, 10, 10, 0.55)',
        glow: '0 0 40px -8px rgba(212, 66, 10, 0.55)',
        gold: '0 0 30px -6px rgba(245, 166, 35, 0.45)',
      },

      /* ── Animations (shadcn/ui + micro-interactions maison) ───────────── */
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // TODO [animation] : bandeau de marques / logos partenaires
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        marquee: 'marquee 30s linear infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },

      /* ─ Dégradés réutilisables ───────────────────────────────────────── */
      backgroundImage: {
        'hero-radial':
          'radial-gradient(ellipse 80% 60% at 70% 40%, rgba(212, 66, 10, 0.22), transparent 70%)',
        'petrovoll-gradient': 'linear-gradient(135deg, #0A0A0A 0%, #171717 55%, #2A0C02 100%)',
        'gold-line': 'linear-gradient(90deg, transparent, #F5A623, transparent)',
      },

      // TODO [ux] : valider le rendu mobile-first pour l'Afrique de l'Ouest
      // (majorité du trafic en mobile, réseaux 3G/4G → images optimisées +
      // lazy-loading obligatoires, penser au fallback 2D pour la scène 3D).
    },
  },

  /* ── Plugins ─────────────────────────────────────────────────────────── */
  plugins: [
    // Animations prêtes à l'emploi pour shadcn/ui (accordéon, fade, slide…)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('tailwindcss-animate'),
    // Rendu typographique des richText Payload (`prose` / `prose-invert`)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@tailwindcss/typography'),
    // TODO [plugins] : ajouter @tailwindcss/forms si les formulaires B2B
    // (devis, demande de partenariat) deviennent complexes.
  ],
}

export default config