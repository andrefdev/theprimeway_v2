/**
 * CurrencyConfigPanel Component
 *
 * A configuration panel for user currency settings.
 * Allows users to set their base currency and preferences.
 */

import React, { useState } from 'react'
import {
  Save,
  RefreshCw,
  RotateCcw,
  Settings,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { CurrencySelector, CurrencyDisplay } from './CurrencySelector'
import { CurrencyAmount } from './CurrencyAmount'
import {
  useCurrencySettings,
  useSupportedCurrencies,
} from '@/features/settings/hooks/use-currency-settings'


interface CurrencyConfigPanelProps {
  className?: string
  onSave?: () => void
  showTitle?: boolean
  compact?: boolean
}

export function CurrencyConfigPanel({
  className,
  onSave,
  showTitle = true,
  compact = false,
}: CurrencyConfigPanelProps) {
  const { settings, loading, error, updateSettings, resetSettings } =
    useCurrencySettings()
  const supportedCurrencies = useSupportedCurrencies()
  const [localSettings, setLocalSettings] = useState({
    baseCurrency: settings?.baseCurrency || 'USD',
    preferredCurrencies: settings?.preferredCurrencies || ['USD', 'PEN'],

  })

  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Check if there are unsaved changes
  React.useEffect(() => {
    if (settings) {
      const changed =
        localSettings.baseCurrency !== settings.baseCurrency ||
        JSON.stringify(localSettings.preferredCurrencies) !==
        JSON.stringify(settings.preferredCurrencies)

      setHasChanges(changed)
    }
  }, [localSettings, settings])

  const handleBaseCurrencyChange = (currency: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      baseCurrency: currency,
      // Add the new base currency to preferred currencies if not already there
      preferredCurrencies: prev.preferredCurrencies.includes(currency)
        ? prev.preferredCurrencies
        : [...prev.preferredCurrencies, currency],
    }))
  }

  const handlePreferredCurrencyToggle = (currency: string) => {
    setLocalSettings((prev) => {
      const isSelected = prev.preferredCurrencies.includes(currency)
      let newPreferred

      if (isSelected) {
        // Don't allow removing the base currency
        if (currency === prev.baseCurrency) return prev
        newPreferred = prev.preferredCurrencies.filter(
          (c: string) => c !== currency,
        )
      } else {
        newPreferred = [...prev.preferredCurrencies, currency]
      }

      return {
        ...prev,
        preferredCurrencies: newPreferred,
      }
    })
  }



  const handleSave = async () => {
    setIsSaving(true)
    try {
      const success = await updateSettings(localSettings)
      if (success) {
        setHasChanges(false)
        onSave?.()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    const success = await resetSettings()
    if (success) {
      setLocalSettings({
        baseCurrency: 'USD',
        preferredCurrencies: ['USD', 'PEN'],
      })
      setHasChanges(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading currency settings...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className={cn(compact && 'pb-4')}>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Currency Settings</CardTitle>
            {hasChanges && (
              <Badge variant="outline" className="ml-auto">
                Unsaved changes
              </Badge>
            )}
          </div>
          <CardDescription>
            Configure your preferred currencies and conversion settings
          </CardDescription>
        </CardHeader>
      )}

      <CardContent className={cn('space-y-6', compact && 'space-y-4')}>
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {/* Base Currency Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Base Currency</Label>
          <div className="space-y-2">
            <CurrencySelector
              value={localSettings.baseCurrency}
              onChange={handleBaseCurrencyChange}
              currencies={supportedCurrencies}
              disabled={isSaving}
            />
            <p className="text-muted-foreground text-xs">
              Your base currency is used for financial reporting and
              consolidation.
            </p>
          </div>
        </div>

        <Separator />

        {/* Preferred Currencies */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Preferred Currencies</Label>
          <div className="grid grid-cols-1 gap-2">
            {supportedCurrencies.map((currency) => {
              const isSelected = localSettings.preferredCurrencies.includes(
                currency.code,
              )
              const isBaseCurrency =
                currency.code === localSettings.baseCurrency

              return (
                <div
                  key={currency.code}
                  className={cn(
                    'flex items-center justify-between rounded-md border p-3',
                    'hover:bg-muted/50 transition-colors',
                    isSelected && 'border-primary bg-primary/5',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <CurrencyDisplay
                      currency={currency.code}
                      showFlag={true}
                      showSymbol={true}
                      showName={true}
                    />
                    {isBaseCurrency && (
                      <Badge variant="secondary" className="text-xs">
                        Base
                      </Badge>
                    )}
                  </div>

                  <Switch
                    checked={isSelected}
                    onCheckedChange={() =>
                      handlePreferredCurrencyToggle(currency.code)
                    }
                    disabled={isSaving || isBaseCurrency}
                  />
                </div>
              )
            })}
          </div>
          <p className="text-muted-foreground text-xs">
            Select the currencies you commonly work with.
          </p>
        </div>



        <Separator />

        {/* Example Display */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Preview</Label>
          <div className="bg-muted/30 space-y-2 rounded-md p-3">
            <div className="text-muted-foreground text-sm">
              Example transaction:
            </div>
            <CurrencyAmount
              amount={1000}
              currency={localSettings.baseCurrency === 'USD' ? 'PEN' : 'USD'}
              convertedAmount={
                localSettings.baseCurrency === 'USD' ? 270 : 3700
              }
              convertedCurrency={localSettings.baseCurrency}
              isConverted={true}
              exchangeRate={localSettings.baseCurrency === 'USD' ? 0.27 : 3.7}
              showConverted={false}
              showConversionBadge={true}
              size="sm"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>

          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>


        </div>

        {/* Success Message */}
        {!hasChanges && settings && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for modals or sidebars
export function CurrencyConfigPanelCompact(
  props: Omit<CurrencyConfigPanelProps, 'compact' | 'showTitle'>,
) {
  return <CurrencyConfigPanel {...props} compact={true} showTitle={false} />
}

export default CurrencyConfigPanel
