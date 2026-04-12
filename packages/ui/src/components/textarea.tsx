import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  description?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, description, id, className = '', ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-[13px] font-medium text-foreground/80">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full rounded-lg border border-border/60 bg-input/50 px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-ring/20 focus:outline-none min-h-[80px] resize-y ${
            error ? 'border-destructive focus:ring-destructive/20' : ''
          } ${className}`}
          aria-invalid={!!error}
          {...props}
        />
        {description && !error && (
          <p className="text-[12px] text-muted-foreground">{description}</p>
        )}
        {error && (
          <p className="text-[12px] text-destructive">{error}</p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
