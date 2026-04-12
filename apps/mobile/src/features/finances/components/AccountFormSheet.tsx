import { useState } from 'react';
import { View, TextInput, Pressable, ScrollView } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { FormSheet } from '@/shared/components/ui/form-sheet';
import { cn } from '@/shared/utils/cn';
import { useCreateAccount } from '../hooks/useFinances';
import { accountSchema } from '../types';
import type { AccountFormData } from '../types';
import type { AccountType } from '@shared/types/models';
import { useTranslation } from '@/shared/hooks/useTranslation';

interface AccountFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCOUNT_TYPES: { value: AccountType; labelKey: string }[] = [
  { value: 'checking', labelKey: 'checking' },
  { value: 'savings', labelKey: 'savings' },
  { value: 'credit', labelKey: 'credit' },
  { value: 'investment', labelKey: 'investment' },
  { value: 'cash', labelKey: 'cash' },
  { value: 'other', labelKey: 'other' },
];

export function AccountFormSheet({ isOpen, onClose }: AccountFormSheetProps) {
  const { t } = useTranslation('features.finances.accountForm');
  const createAccount = useCreateAccount();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [bankName, setBankName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [initialBalance, setInitialBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const formData: AccountFormData = {
      name: name.trim(),
      type,
      bankName: bankName.trim() || undefined,
      currency: currency || 'USD',
      initialBalance: parseFloat(initialBalance) || 0,
      creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
    };

    const result = accountSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    createAccount.mutate(result.data, {
      onSuccess: () => {
        setName('');
        setType('checking');
        setBankName('');
        setCurrency('USD');
        setInitialBalance('');
        setCreditLimit('');
        onClose();
      },
    });
  };

  return (
    <FormSheet isOpen={isOpen} onClose={onClose} title={t('title')}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View className="gap-5 p-4">
          {/* Account Name */}
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

          {/* Account Type */}
          <View>
            <Text className="mb-2 text-sm font-medium text-foreground">{t('type')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {ACCOUNT_TYPES.map((at) => (
                <Pressable
                  key={at.value}
                  onPress={() => setType(at.value)}
                  className={cn(
                    'rounded-lg border px-4 py-2',
                    type === at.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card',
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      type === at.value ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {t(`types.${at.labelKey}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Bank Name */}
          <View>
            <Text className="mb-2 text-sm font-medium text-foreground">{t('bankName')}</Text>
            <TextInput
              value={bankName}
              onChangeText={setBankName}
              placeholder={t('bankNamePlaceholder')}
              className="rounded-lg border border-border bg-card px-4 py-3 text-base text-foreground"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Currency */}
          <View>
            <Text className="mb-2 text-sm font-medium text-foreground">{t('currency')}</Text>
            <View className="flex-row gap-2">
              {['USD', 'EUR', 'PEN', 'MXN'].map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCurrency(c)}
                  className={cn(
                    'rounded-lg border px-4 py-2',
                    currency === c
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card',
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      currency === c ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Initial Balance */}
          <View>
            <Text className="mb-2 text-sm font-medium text-foreground">{t('initialBalance')}</Text>
            <TextInput
              value={initialBalance}
              onChangeText={setInitialBalance}
              placeholder="0.00"
              keyboardType="decimal-pad"
              className="rounded-lg border border-border bg-card px-4 py-3 text-base text-foreground"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Credit Limit (only for credit type) */}
          {type === 'credit' && (
            <View>
              <Text className="mb-2 text-sm font-medium text-foreground">{t('creditLimit')}</Text>
              <TextInput
                value={creditLimit}
                onChangeText={setCreditLimit}
                placeholder="0.00"
                keyboardType="decimal-pad"
                className="rounded-lg border border-border bg-card px-4 py-3 text-base text-foreground"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}

          {/* Submit */}
          <Button
            onPress={handleSubmit}
            disabled={createAccount.isPending}
            className="mt-2"
          >
            <Text className="text-sm font-medium text-primary-foreground">
              {createAccount.isPending ? t('saving') : t('addAccount')}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </FormSheet>
  );
}
