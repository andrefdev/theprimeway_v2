import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  description?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function FormField({ label, error, description, required, children, className = '' }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-[13px] font-medium text-foreground/80">
        {label}
        {required && <span className="ml-0.5 text-destructive/70">*</span>}
      </label>
      {children}
      {description && !error && (
        <p className="text-[12px] text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-[12px] text-destructive">{error}</p>
      )}
    </div>
  )
}
