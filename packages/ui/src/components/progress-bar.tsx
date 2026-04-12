interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'auto'
  className?: string
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2.5',
}

const colorClasses = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
}

function resolveColor(color: ProgressBarProps['color'], pct: number): string {
  if (color === 'auto') {
    if (pct > 90) return colorClasses.destructive
    if (pct > 70) return colorClasses.warning
    return colorClasses.primary
  }
  return colorClasses[color ?? 'primary']
}

export function ProgressBar({ value, max = 100, size = 'md', color = 'primary', className = '' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0

  return (
    <div className={`w-full rounded-full bg-muted/50 ${sizeClasses[size]} ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full transition-all duration-500 ease-out ${resolveColor(color, pct)}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
