import { forwardRef, type InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, id, className = '', ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border/60 accent-primary transition-all duration-150 focus:ring-2 focus:ring-ring/50 focus:ring-offset-1 focus:ring-offset-background"
          {...props}
        />
        {(label || description) && (
          <div>
            {label && (
              <label htmlFor={checkboxId} className="text-[13px] font-medium text-foreground/90 cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-[12px] text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'
