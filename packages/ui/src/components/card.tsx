import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`rounded-xl border border-border/40 bg-card shadow-sm shadow-black/5 transition-all duration-150 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`flex items-center justify-between px-5 py-3.5 border-b border-border/40 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`px-5 py-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`border-t border-border/40 px-5 py-3.5 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children }: { className?: string; children: ReactNode }) {
  return <h3 className={`text-[15px] font-semibold text-foreground ${className}`}>{children}</h3>
}

export function CardDescription({ className = '', children }: { className?: string; children: ReactNode }) {
  return <p className={`text-[13px] text-muted-foreground ${className}`}>{children}</p>
}
