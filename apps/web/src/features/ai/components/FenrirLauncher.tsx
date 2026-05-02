import { forwardRef } from 'react'
import { cn } from '@/shared/lib/utils'
import { FenrirGlyph } from '@/shared/assets/FenrirGlyph'

interface FenrirLauncherProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export const FenrirLauncher = forwardRef<HTMLButtonElement, FenrirLauncherProps>(
  function FenrirLauncher({ active, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        {...props}
        className={cn(
          'group fixed bottom-20 right-4 z-50 lg:bottom-6',
          'flex h-14 w-14 items-center justify-center',
          'rounded-2xl ring-1 ring-white/10',
          'bg-gradient-to-br from-primary/95 via-primary to-primary/80',
          'text-primary-foreground',
          'shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.55),0_0_0_1px_hsl(var(--primary)/0.2)]',
          'transition-transform duration-200 ease-out',
          'hover:scale-[1.04] active:scale-95',
          'dark:bg-gradient-to-br dark:from-card/90 dark:via-card/80 dark:to-card/70',
          'dark:text-foreground dark:ring-primary/30',
          'dark:shadow-[0_8px_28px_-4px_hsl(var(--primary)/0.65),inset_0_1px_0_0_hsl(var(--primary)/0.25)]',
          'backdrop-blur-sm',
          className,
        )}
      >
        <FenrirGlyph className="h-7 w-7 drop-shadow-sm transition-transform duration-200 group-hover:scale-110" />
        <span
          className={cn(
            'pointer-events-none absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full',
            'bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.8)]',
            active && 'animate-pulse',
          )}
        />
      </button>
    )
  },
)
