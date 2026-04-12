import { useState } from 'react';
import { View, TextInput, Pressable, ScrollView } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { FormSheet } from '@/shared/components/ui/form-sheet';
import { cn } from '@/shared/utils/cn';
import { useCreateInvestment } from '../hooks/useInvestments';
import type { InvestmentFormData } from '../services/investmentsService';
import { useTranslation } from '@/shared/hooks/useTranslation';

interface InvestmentFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

type InvestmentType = InvestmentFormData['investmentType'];

const INVESTMENT_TYPES: { value: InvestmentType; labelKey: string }[] = [
  { value: 'stocks', labelKey: 'stocks' },
  { value: 'bonds', labelKey: 'bonds' },
  { value: 'etf', labelKey: 'etf' },
  { value: 'crypto', labelKey: 'crypto' },
  { value: 'real_estate', labelKey: 'real_estate' },
  { value: 'mutual_fund', labelKey: 'mutual_fund' },
  { value: 'other', labelKey: 'other' },
];

export function InvestmentFormSheet({ isOpen, onClose }: InvestmentFormSheetProps) {
  const { t } = useTranslation('features.finances.investmentForm');
  const createInvestment = useCreateInvestment();

  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [investmentType, setInvestmentType] = useState<InvestmentType>('stocks');
  const [platform, setPlatform] = useState('');
  const [totalInvested, setTotalInvested] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const fieldErrors: Record<string, string> = {};
    if (!name.trim()) fieldErrors.name = 'Required';
    const invested = parseFloat(totalInvested);
    if (!invested || invested <= 0) fieldErrors.totalInvested = 'Must be greater than 0';
    const current = parseFloat(currentValue);
    if (!current || current <= 0) fieldErrors.currentValue = 'Must be greater than 0';

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    const formData: InvestmentFormData = {
      name: name.trim(),
      ticker: ticker.trim() || undefined,
      investmentType,
      platform: platform.trim() || undefined,
      currency: 'USD',
      totalInvested: invested,
      currentValue: current,
      notes: notes.trim() || undefined,
      isActive: true,
    };

    setErrors({});
    createInvestment.mutate(formData, {
      onSuccess: () => {
        setName('');
        setTicker('');
        setInvestmentType('stocks');
        setPlatform('');
        setTotalInvested('');
        setCurrentValue('');
        setNotes('');
        onClose();
      },
    });
  };

  return (
    <FormSheet isOpen={isOpen} onClose={onClose} title={t('title')}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View className="gap-5 p-4">
          {/* Investment Name */}
          <View>
            <Text className="mb-2 text-sm font-medium text-foreground">{t('name')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('namePlaceholder')}
              className={cn(
                'rounded-lg border bg-card px-4 py-3 text-base text-foreground',
                errors.name ? 'border-destructive' : 'border-border',
              )}
              placeholderTextColor="#9CA3AF"
            />
            {errors.name && (
              <Text className="mt-1 text-xs text-destructive">{errors.name}</Text>
            )}
          </View>

          {/* Ticker */}
          <View>
            <Text className="mb-2 text-sm font-medium text-foreground">{t('ticker')}</Text>
            <TextInput
              value={ticker}
              onChangeText={setTicker}
              placeholder={t('tickerPlaceholder')}
              autoCapitalize="characters"
              className="rounded-lg border border-border bg-card px-4 py-3 text-base text-foreground"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Investment Type */}
          <View>
            <Text className="mb-2 text-sm font-medium text-foreground">{t('type')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {INVESTMENT_TYPES.map((it) => (
                <Pressable
                  key={it.value}
                  onPress={() => setInvestmentType(it.value)}
                  className={cn(
                    'rounded-lg border px-3 py-2',
                    investmentType === it.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card',
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs font-medium',
                      investmentType === it.value ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {t(`types.${it.labelKey}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Platform */}
          <View>
            <Text className="mb-2 text-sm font-medium text-foreground">{t('platform')}</Text>
            <TextInput
              value={platform}
              onChangeText={setPlatform}
              placeholder={t('platformPlaceholder')}
              className="rounded-lg border border-border bg-card px-4 py-3 text-base text-foreground"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Total Invested */}
          <View>
            <Text className="mb-2 text-sm font-medium text-foreground">{t('totalInvested')}</Text>
            <TextInput
              value={totalInvested}
              onChangeText={setTotalInvested}
              placeholder="0.00"
              keyboardType="decimal-pad"
              className={cn(
                'rounded-lg border bg-card px-4 py-3 text-base text-foreground',
                errors.totalInvested ? 'border-destructive' : 'border-border',
              )}
              placeholderTextColor="#9CA3AF"
            />
            {errors.totalInvested && (
              <Text className="mt-1 text-xs text-destructive">{errors.totalInvested}</Text>
            )}
          </View>

          {/* Current Value */}
          <View>
            <Text className="mb-2 text-sm font-medium text-foreground">{t('currentValue')}</Text>
            <TextInput
              value={currentValue}
              onChangeText={setCurrentValue}
              placeholder="0.00"
              keyboardType="decimal-pad"
              className={cn(
                'rounded-lg border bg-card px-4 py-3 text-base text-foreground',
                errors.currentValue ? 'border-destructive' : 'border-border',
              )}
              placeholderTextColor="#9CA3AF"
            />
            {errors.currentValue && (
              <Text className="mt-1 text-xs text-destructive">{errors.currentValue}</Text>
            )}
          </View>

          {/* Notes */}
          <View>
            <Text className="mb-2 text-sm font-medium text-foreground">{t('notes')}</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t('notesPlaceholder')}
              multiline
              numberOfLines={3}
              className="rounded-lg border border-border bg-card px-4 py-3 text-base text-foreground"
              placeholderTextColor="#9CA3AF"
              textAlignVertical="top"
            />
          </View>

          {/* Submit */}
          <Button
            onPress={handleSubmit}
            disabled={createInvestment.isPending}
            className="mt-2"
          >
            <Text className="text-sm font-medium text-primary-foreground">
              {createInvestment.isPending ? t('saving') : t('addInvestment')}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </FormSheet>
  );
}
