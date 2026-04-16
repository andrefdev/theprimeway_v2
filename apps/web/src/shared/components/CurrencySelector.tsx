/**
 * CurrencySelector Component
 *
 * A reusable dropdown component for selecting currencies.
 * Supports flags, symbols, and full currency names.
 */


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { cn } from '@/shared/lib/utils'

export interface Currency {
  code: string
  name: string
  symbol: string
  flag?: string
}

interface CurrencySelectorProps {
  value?: string
  onChange: (currency: string) => void
  currencies?: Currency[]
  placeholder?: string
  disabled?: boolean
  showFlag?: boolean
  showSymbol?: boolean
  showName?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Default supported currencies for MVP
const DEFAULT_CURRENCIES: Currency[] = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '\u{1F1FA}\u{1F1F8}',
  },
  {
    code: 'PEN',
    name: 'Peruvian Sol',
    symbol: 'S/.',
    flag: '\u{1F1F5}\u{1F1EA}',
  },
]

export function CurrencySelector({
  value,
  onChange,
  currencies = DEFAULT_CURRENCIES,
  placeholder = 'Select currency',
  disabled = false,
  showFlag = true,
  showSymbol = true,
  showName = true,
  size = 'md',
  className,
}: CurrencySelectorProps) {
  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-9 text-sm',
    lg: 'h-11 text-base',
  }

  const formatCurrencyOption = (
    currency: Currency,
    compact: boolean = false,
  ) => {
    const parts: string[] = []

    if (showFlag && currency.flag) {
      parts.push(currency.flag)
    }

    if (showSymbol && currency.symbol) {
      parts.push(currency.symbol)
    }

    parts.push(currency.code)

    if (showName && !compact) {
      parts.push(`- ${currency.name}`)
    }

    return parts.join(' ')
  }

  const selectedCurrency = currencies.find((c) => c.code === value)

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn(sizeClasses[size], 'min-w-30', className)}>
        <SelectValue placeholder={placeholder}>
          {selectedCurrency && (
            <span className="flex items-center gap-1">
              {formatCurrencyOption(selectedCurrency, true)}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem
            key={currency.code}
            value={currency.code}
            className="flex items-center"
          >
            <span className="flex items-center gap-2">
              {formatCurrencyOption(currency)}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Compact version for tight spaces
export function CurrencySelectorCompact(
  props: Omit<CurrencySelectorProps, 'showName' | 'size'>,
) {
  return (
    <CurrencySelector
      {...props}
      showName={false}
      size="sm"
      className={cn('min-w-20', props.className)}
    />
  )
}

// Currency display without selection (read-only)
export function CurrencyDisplay({
  currency,
  showFlag = true,
  showSymbol = true,
  showName = false,
  className,
}: {
  currency: string
  showFlag?: boolean
  showSymbol?: boolean
  showName?: boolean
  className?: string
}) {
  const currencyData = DEFAULT_CURRENCIES.find((c) => c.code === currency)

  if (!currencyData) {
    return <span className={className}>{currency}</span>
  }

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {showFlag && currencyData.flag && (
        <span className="text-sm">{currencyData.flag}</span>
      )}
      {showSymbol && <span className="font-medium">{currencyData.symbol}</span>}
      <span className="font-medium">{currencyData.code}</span>
      {showName && (
        <span className="text-muted-foreground text-sm">
          ({currencyData.name})
        </span>
      )}
    </span>
  )
}

export default CurrencySelector
