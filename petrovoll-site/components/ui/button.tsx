import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Button — primitive shadcn/ui (style « new-york »), adaptée à la charte
 * ────────────────────────────────────────────────────────────────────────────
 * Variantes prêtes pour l'identité PETROVOLL :
 *   • primary    → rouge/orange industriel (#D4420A) : actions principales
 *   • gold       → or/ambre (#F5A623) : actions secondaires de mise en avant
 *   • outline    → contour clair sur fond sombre
 *   • ghost      → sans fond (barres d'outils, liens)
 *   • destructive→ suppressions (admin)
 *
 * NOTE : ce fichier est la version « shadcn/ui » standard. Pour ajouter d'autres
 * primitives, utiliser la CLI (voir components/ui/README.md) plutôt que de les
 * écrire manuellement :
 *
 *   npx shadcn@latest add dialog dropdown-menu checkbox accordion tabs sheet
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-semibold uppercase tracking-industrial transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-brand-500 text-white hover:bg-brand-600',
        gold: 'bg-gold-400 text-ink-900 hover:bg-gold-500',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-white/20 text-white hover:border-gold-400 hover:text-gold-400',
        ghost: 'text-white/70 hover:bg-white/5 hover:text-white',
        link: 'text-brand-500 underline-offset-4 hover:underline',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-9 px-4',
        md: 'h-11 px-6',
        lg: 'h-12 px-8 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Rend le composant enfant à la place d'un <button> (ex. <Link />). */
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }