/**
 * CurrencyInput Component
 *
 * An input field specifically designed for currency amounts with
 * real-time conversion preview and validation.
 */

import { useState, useEffect, useCallback } from 'react'
import { AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { CurrencySelector } from './currency-selector'
import { useCurrencySettings } from '@/features/settings/hooks/use-currency-settings'

interface CurrencyInputProps {
  // Value and change handlers
  value?: number
  currency?: string
  onValueChange: (amount: number) => void
  onCurrencyChange: (currency: string) => void

  // Manual rate override
  manualRate?: number
  onManualRateChange?: (rate: number | undefined) => void
  allowManualRate?: boolean

  // Display options
  label?: string
  placeholder?: string
  showConversion?: boolean
  showRatePreview?: boolean

  // Validation
  min?: number
  max?: number
  required?: boolean
  disabled?: boolean

  // Styling
  className?: string
  inputClassName?: string

  // Error handling
  error?: string
}

export function CurrencyInput({
  value = 0,
  currency = 'USD',
  onValueChange,
  onCurrencyChange,
  manualRate,
  onManualRateChange,
  allowManualRate = false,
  label,
  placeholder = '0.00',
  showConversion: _showConversion = true,
  showRatePreview: _showRatePreview = true,
  min = 0,
  max,
  required = false,
  disabled = false,
  className,
  inputClassName,
  error,
}: CurrencyInputProps) {
  const [inputValue, setInputValue] = useState(value.toString())
  const [useManualRate, setUseManualRate] = useState(Boolean(manualRate))
  const [manualRateInput, setManualRateInput] = useState(
    manualRate?.toString() || '',
  )

  const { settings } = useCurrencySettings()
  const baseCurrency = settings?.baseCurrency || 'USD'


  // Handle input value changes
  const handleInputChange = useCallback(
    (inputValue: string) => {
      setInputValue(inputValue)

      // Parse the input value
      const numValue = parseFloat(inputValue) || 0

      // Validate range
      if (numValue < min) return
      if (max && numValue > max) return

      onValueChange(numValue)
    },
    [min, max, onValueChange],
  )

  // Handle manual rate changes
  const handleManualRateChange = useCallback(
    (rateInput: string) => {
      setManualRateInput(rateInput)

      const rateValue = parseFloat(rateInput) || undefined
      onManualRateChange?.(rateValue)
    },
    [onManualRateChange],
  )

  // Toggle manual rate
  const handleManualRateToggle = useCallback(
    (enabled: boolean) => {
      setUseManualRate(enabled)

      if (!enabled) {
        setManualRateInput('')
        onManualRateChange?.(undefined)
      }
    },
    [onManualRateChange],
  )

  // Sync input value with prop
  useEffect(() => {
    if (value.toString() !== inputValue) {
      setInputValue(value.toString())
    }
  }, [value, inputValue])

  const hasError = Boolean(error)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Label */}
      {label && (
        <Label
          className={cn(
            required && 'after:ml-1 after:text-red-500 after:content-["*"]',
          )}
        >
          {label}
        </Label>
      )}

      {/* Main Input Row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="number"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            min={min}
            max={max}
            step="0.01"
            disabled={disabled}
            className={cn(
              'font-mono',
              hasError && 'border-red-500 focus-visible:ring-red-500',
              inputClassName,
            )}
          />
        </div>

        <CurrencySelector
          value={currency}
          onChange={onCurrencyChange}
          disabled={disabled}
          size="md"
          className="min-w-30"
        />
      </div>

      {/* Error Message */}
      {hasError && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}


      {/* Manual Rate Override */}
      {allowManualRate && onManualRateChange && currency !== baseCurrency && (
        <div className="bg-muted/50 space-y-3 rounded-md p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="manual-rate" className="text-sm font-medium">
              Use manual exchange rate
            </Label>
            <Switch
              id="manual-rate"
              checked={useManualRate}
              onCheckedChange={handleManualRateToggle}
              disabled={disabled}
            />
          </div>

          {useManualRate && (
            <div className="flex gap-2">
              <Input
                type="number"
                value={manualRateInput}
                onChange={(e) => handleManualRateChange(e.target.value)}
                placeholder="0.000000"
                step="0.000001"
                min="0"
                disabled={disabled}
                className="font-mono"
              />
              <div className="text-muted-foreground flex items-center px-3 text-sm whitespace-nowrap">
                1 {currency} = ? {baseCurrency}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

// Simplified version for basic currency input
export function CurrencyInputSimple({
  value,
  currency,
  onValueChange,
  onCurrencyChange,
  placeholder = '0.00',
  disabled = false,
  className,
}: {
  value: number
  currency: string
  onValueChange: (amount: number) => void
  onCurrencyChange: (currency: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex gap-2', className)}>
      <Input
        type="number"
        value={value.toString()}
        onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
        placeholder={placeholder}
        min="0"
        step="0.01"
        disabled={disabled}
        className="flex-1 font-mono"
      />
      <CurrencySelector
        value={currency}
        onChange={onCurrencyChange}
        disabled={disabled}
        size="md"
        className="min-w-30"
      />
    </div>
  )
}

export default CurrencyInput
