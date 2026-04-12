import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  description?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, description, id, className = '', ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-[13px] font-medium text-foreground/80">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-8 w-full rounded-lg border bg-input/50 px-3 text-[13px] text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:bg-background focus:outline-none ${
            error
              ? 'border-destructive/60 focus:border-destructive/60 focus:ring-2 focus:ring-destructive/20'
              : 'border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-ring/20'
          } ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : description ? `${inputId}-desc` : undefined}
          {...props}
        />
        {description && !error && (
          <p id={`${inputId}-desc`} className="text-xs text-muted-foreground">{description}</p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-destructive">{error}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
