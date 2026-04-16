import { Input } from '@/shared/components/ui/input'
import type { ReactNode } from 'react'

interface FilterBarProps {
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  children?: ReactNode
  className?: string
}

export function FilterBar({ search, onSearchChange, searchPlaceholder = 'Search...', children, className = '' }: FilterBarProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${className}`}>
      {onSearchChange !== undefined && (
        <Input
          placeholder={searchPlaceholder}
          value={search ?? ''}
          onChange={(e) => onSearchChange(e.target.value)}
          className="sm:max-w-xs"
        />
      )}
      {children}
    </div>
  )
}
