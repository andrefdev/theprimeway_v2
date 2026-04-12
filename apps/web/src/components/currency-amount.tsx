/**
 * CurrencyAmount Component
 *
 * Displays monetary amounts with currency formatting, conversion info,
 * and various display modes for the multi-currency system.
 */

import { ArrowRightLeft, Info, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CurrencyDisplay } from './currency-selector'
import { useCurrencyFormatter } from '@/features/settings/hooks/use-currency-settings'

export interface CurrencyAmountProps {
  // Basic amount and currency
  amount: number
  currency: string

  // Conversion data
  convertedAmount?: number
  convertedCurrency?: string
  exchangeRate?: number
  isConverted?: boolean
  isManualRate?: boolean

  // Display options
  showConverted?: boolean
  showExchangeRate?: boolean
  showConversionBadge?: boolean
  compact?: boolean
  size?: 'sm' | 'md' | 'lg'

  // Styling
  className?: string
  amountClassName?: string
  convertedClassName?: string

  // Interaction
  onClick?: () => void
  tooltip?: string
}

interface CurrencyAmountDisplayProps {
  amount: number
  currency: string
  size: 'sm' | 'md' | 'lg'
  className?: string
  compact?: boolean
}

function CurrencyAmountDisplay({
  amount,
  currency,
  size,
  className,
  compact = false,
}: CurrencyAmountDisplayProps) {
  const { formatCurrency } = useCurrencyFormatter()

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold',
  }

  if (compact) {
    return (
      <span className={cn(sizeClasses[size], 'font-mono', className)}>
        {formatCurrency(amount, currency)}
      </span>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn(sizeClasses[size], 'font-mono font-medium')}>
        {formatCurrency(amount, currency)}
      </span>
      <CurrencyDisplay
        currency={currency}
        showName={false}
        className="text-muted-foreground text-xs"
      />
    </div>
  )
}

export function CurrencyAmount({
  amount,
  currency,
  convertedAmount,
  convertedCurrency,
  exchangeRate,
  isConverted = false,
  isManualRate = false,
  showConverted = true,
  showExchangeRate = false,
  showConversionBadge = true,
  compact = true,
  size = 'md',
  className,
  amountClassName,
  convertedClassName,
  onClick,
  tooltip,
}: CurrencyAmountProps) {
  const hasConversion = isConverted && convertedAmount && convertedCurrency
  const isClickable = Boolean(onClick)

  const content = (
    <div
      className={cn(
        'flex flex-col gap-1',
        isClickable && 'cursor-pointer transition-opacity hover:opacity-80',
        className,
      )}
      onClick={onClick}
    >
      {/* Original Amount */}
      <CurrencyAmountDisplay
        amount={amount}
        currency={currency}
        size={size}
        compact={compact}
        className={amountClassName}
      />

      {/* Converted Amount */}
      {hasConversion && showConverted && (
        <div className={cn('flex items-center gap-2', convertedClassName)}>
          <ArrowRightLeft className="text-muted-foreground h-3 w-3" />
          <CurrencyAmountDisplay
            amount={convertedAmount}
            currency={convertedCurrency}
            size={size === 'lg' ? 'md' : 'sm'}
            compact={compact}
            className="text-muted-foreground"
          />

          {/* Conversion Badge */}
          {showConversionBadge && (
            <Badge
              variant={isManualRate ? 'secondary' : 'outline'}
              className="px-1 py-0 text-xs"
            >
              {isManualRate ? 'Manual' : 'Auto'}
            </Badge>
          )}
        </div>
      )}

      {/* Exchange Rate Info */}
      {showExchangeRate && exchangeRate && hasConversion && (
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <Info className="h-3 w-3" />
          <span>
            1 {currency} = {exchangeRate.toFixed(6)} {convertedCurrency}
          </span>
        </div>
      )}
    </div>
  )

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

// Compact version for tables and lists
export function CurrencyAmountCompact(
  props: Omit<CurrencyAmountProps, 'compact' | 'size'>,
) {
  return (
    <CurrencyAmount
      {...props}
      compact={true}
      size="sm"
      showConversionBadge={false}
      showExchangeRate={false}
    />
  )
}

// Large version for headers and totals
export function CurrencyAmountLarge(props: Omit<CurrencyAmountProps, 'size'>) {
  return <CurrencyAmount {...props} size="lg" showExchangeRate={true} />
}

// Comparison component for showing currency changes
export function CurrencyAmountComparison({
  currentAmount,
  currentCurrency,
  previousAmount,
  showPercentage = true,
  className,
}: {
  currentAmount: number
  currentCurrency: string
  previousAmount: number
  previousCurrency?: string
  showPercentage?: boolean
  className?: string
}) {
  const difference = currentAmount - previousAmount
  const percentageChange =
    previousAmount !== 0 ? (difference / previousAmount) * 100 : 0
  const isPositive = difference > 0
  const isNegative = difference < 0

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <CurrencyAmount
        amount={currentAmount}
        currency={currentCurrency}
        size="md"
      />

      <div className="flex items-center gap-2">
        {isPositive && <TrendingUp className="h-4 w-4 text-green-500" />}
        {isNegative && <TrendingDown className="h-4 w-4 text-red-500" />}

        <CurrencyAmount
          amount={Math.abs(difference)}
          currency={currentCurrency}
          size="sm"
          compact={true}
          className={cn(
            'text-sm',
            isPositive && 'text-green-600',
            isNegative && 'text-red-600',
          )}
        />

        {showPercentage && (
          <span
            className={cn(
              'text-sm font-medium',
              isPositive && 'text-green-600',
              isNegative && 'text-red-600',
            )}
          >
            ({isPositive ? '+' : ''}
            {percentageChange.toFixed(1)}%)
          </span>
        )}
      </div>
    </div>
  )
}

export default CurrencyAmount
