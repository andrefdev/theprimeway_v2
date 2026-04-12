import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { cn } from '@/shared/utils/cn';
import { ChevronRight, ChevronLeft, Wallet, Check, Info } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';

type Currency = {
  code: string;
  symbol: string;
  name: string;
};

const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '\u20AC', name: 'Euro' },
  { code: 'GBP', symbol: '\u00A3', name: 'British Pound' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
  { code: 'JPY', symbol: '\u00A5', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
];

const ACCOUNT_TYPE_KEYS = ['checking', 'savings', 'creditCard', 'cash', 'investment'] as const;

const TOTAL_STEPS = 5;
const CURRENT_STEP = 4;

export default function FinancesScreen() {
  const { t } = useTranslation('features.onboarding.financesSetup');
  const { t: tOnboarding } = useTranslation('features.onboarding');
  const accountTypes = ACCOUNT_TYPE_KEYS.map((key) => ({ key, label: t(`accountTypes.${key}`) }));
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [accountName, setAccountName] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState('');
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header with Back button */}
      <View className="px-6 pb-2 pt-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            <Icon as={ChevronLeft} size={20} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">{tOnboarding('buttons.back')}</Text>
          </Button>
          <Text className="text-sm font-medium text-muted-foreground">
            {t('step')}
          </Text>
        </View>

        {/* Progress bar */}
        <View className="mb-4 h-1.5 w-full rounded-full bg-muted">
          <View
            className="h-1.5 rounded-full bg-primary"
            style={{ width: `${(CURRENT_STEP / TOTAL_STEPS) * 100}%` }}
          />
        </View>

        <Text className="text-3xl font-bold text-foreground">
          {t('title')}
        </Text>
        <Text className="mt-2 text-base text-muted-foreground">
          {t('description')}
        </Text>
      </View>

      {/* Tooltip / Coach mark */}
      {showTooltip && (
        <Pressable
          onPress={() => setShowTooltip(false)}
          className="mx-6 mb-2 flex-row items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3"
        >
          <Icon as={Info} size={18} className="mt-0.5 text-primary" />
          <Text className="flex-1 text-sm leading-5 text-foreground/80">
            {tOnboarding('tooltips.finances')}
          </Text>
        </Pressable>
      )}

      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="gap-6 pb-6 pt-2"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Finance Icon */}
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/15">
            <Icon as={Wallet} size={32} className="text-emerald-400" />
          </View>
        </View>

        {/* Currency Selection */}
        <View>
          <Text className="mb-3 text-sm font-medium text-foreground">
            {t('baseCurrency')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CURRENCIES.map((currency) => (
              <Pressable
                key={currency.code}
                onPress={() => setSelectedCurrency(currency.code)}
                className={cn(
                  'flex-row items-center gap-2 rounded-xl border border-border px-3 py-2.5',
                  selectedCurrency === currency.code &&
                    'border-emerald-400/40 bg-emerald-400/10'
                )}
              >
                <Text className="text-base font-semibold text-foreground">
                  {currency.symbol}
                </Text>
                <Text
                  className={cn(
                    'text-sm text-muted-foreground',
                    selectedCurrency === currency.code && 'text-foreground'
                  )}
                >
                  {currency.code}
                </Text>
                {selectedCurrency === currency.code && (
                  <Icon as={Check} size={14} className="text-emerald-400" />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Account Name Input */}
        <View>
          <Text className="mb-2 text-sm font-medium text-foreground">
            {t('accountName')}
          </Text>
          <TextInput
            value={accountName}
            onChangeText={setAccountName}
            placeholder={t('accountNamePlaceholder')}
            placeholderTextColor="hsl(0 0% 45%)"
            className="rounded-xl border border-border bg-muted/50 px-4 py-3.5 text-base text-foreground"
          />
        </View>

        {/* Account Type */}
        <View>
          <Text className="mb-3 text-sm font-medium text-foreground">
            {t('accountType')}
          </Text>
          <View className="gap-2">
            {accountTypes.map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => setSelectedAccountType(key)}
                className={cn(
                  'flex-row items-center justify-between rounded-xl border border-border px-4 py-3.5',
                  selectedAccountType === key &&
                    'border-emerald-400/40 bg-emerald-400/10'
                )}
              >
                <Text
                  className={cn(
                    'text-base text-muted-foreground',
                    selectedAccountType === key && 'text-foreground'
                  )}
                >
                  {label}
                </Text>
                {selectedAccountType === key && (
                  <Icon as={Check} size={18} className="text-emerald-400" />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="flex-row items-center justify-between border-t border-border px-6 pb-6 pt-4">
        <Button
          variant="ghost"
          onPress={() => router.push('/(onboarding)/notes')}
        >
          <Text className="text-sm text-muted-foreground">{tOnboarding('buttons.skip')}</Text>
        </Button>

        <Button
          size="lg"
          onPress={() => router.push('/(onboarding)/notes')}
          disabled={!selectedCurrency || accountName.trim().length === 0 || !selectedAccountType}
          className="min-w-[140px]"
        >
          <Text className="text-base font-semibold text-primary-foreground">
            {tOnboarding('buttons.next')}
          </Text>
          <Icon as={ChevronRight} size={20} className="text-primary-foreground" />
        </Button>
      </View>
    </SafeAreaView>
  );
}
