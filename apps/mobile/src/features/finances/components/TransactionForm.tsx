import { useState } from 'react';
import { View, TextInput, Pressable, ScrollView } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { cn } from '@/shared/utils/cn';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react-native';
import { useAccounts, useCreateTransaction } from '../hooks/useFinances';
import { transactionSchema } from '../types';
import type { TransactionFormData } from '../types';
import type { TransactionType } from '@shared/types/models';
import { useTranslation } from '@/shared/hooks/useTranslation';

interface TransactionFormProps {
  onSuccess?: () => void;
  className?: string;
  initialType?: TransactionType;
}

const TRANSACTION_TYPES: { value: TransactionType; labelKey: string; icon: typeof ArrowUpRight; color: string }[] = [
  { value: 'income', labelKey: 'income', icon: ArrowUpRight, color: 'bg-emerald-500' },
  { value: 'expense', labelKey: 'expense', icon: ArrowDownRight, color: 'bg-red-500' },
  { value: 'transfer', labelKey: 'transfer', icon: ArrowLeftRight, color: 'bg-blue-500' },
];

export function TransactionForm({ onSuccess, className, initialType = 'expense' }: TransactionFormProps) {
  const { t } = useTranslation('features.finances.transactionForm');
  const { data: accounts } = useAccounts();
  const createTransaction = useCreateTransaction();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const today = new Date().toISOString().split('T')[0];

    const formData: TransactionFormData = {
      accountId: selectedAccountId,
      type,
      amount: parseFloat(amount) || 0,
      description: description.trim(),
      notes: notes.trim() || undefined,
      date: today,
      tags: [],
      isRecurring: false,
      currency: accounts?.find((a) => a.id === selectedAccountId)?.currency || 'USD',
    };

    const result = transactionSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    createTransaction.mutate(result.data, {
      onSuccess: () => {
        setAmount('');
        setDescription('');
        setNotes('');
        setSelectedAccountId('');
        onSuccess?.();
      },
    });
  };

  return (
    <ScrollView className={cn('flex-1', className)} keyboardShouldPersistTaps="handled">
      <View className="gap-5 p-4">
        {/* Transaction Type Selector */}
        <View>
          <Text className="mb-2 text-sm font-medium text-foreground">{t('type')}</Text>
          <View className="flex-row gap-2">
            {TRANSACTION_TYPES.map((txType) => (
              <Pressable
                key={txType.value}
                onPress={() => setType(txType.value)}
                className={cn(
                  'flex-1 flex-row items-center justify-center gap-2 rounded-lg border p-3',
                  type === txType.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card',
                )}
              >
                <Icon
                  as={txType.icon}
                  size={16}
                  className={type === txType.value ? 'text-primary' : 'text-muted-foreground'}
                />
                <Text
                  className={cn(
                    'text-xs font-medium',
                    type === txType.value ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {t(txType.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Amount */}
        <View>
          <Text className="mb-2 text-sm font-medium text-foreground">{t('amount')}</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            className={cn(
              'rounded-lg border bg-card px-4 py-3 text-base text-foreground',
              errors.amount ? 'border-destructive' : 'border-border',
            )}
            placeholderTextColor="#9CA3AF"
          />
          {errors.amount && (
            <Text className="mt-1 text-xs text-destructive">{errors.amount}</Text>
          )}
        </View>

        {/* Description */}
        <View>
          <Text className="mb-2 text-sm font-medium text-foreground">{t('description')}</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('descriptionPlaceholder')}
            className={cn(
              'rounded-lg border bg-card px-4 py-3 text-base text-foreground',
              errors.description ? 'border-destructive' : 'border-border',
            )}
            placeholderTextColor="#9CA3AF"
          />
          {errors.description && (
            <Text className="mt-1 text-xs text-destructive">{errors.description}</Text>
          )}
        </View>

        {/* Account Selector */}
        <View>
          <Text className="mb-2 text-sm font-medium text-foreground">{t('account')}</Text>
          {errors.accountId && (
            <Text className="mb-1 text-xs text-destructive">{errors.accountId}</Text>
          )}
          <View className="flex-row flex-wrap gap-2">
            {accounts?.map((account) => (
              <Pressable
                key={account.id}
                onPress={() => setSelectedAccountId(account.id)}
                className={cn(
                  'rounded-lg border px-4 py-2',
                  selectedAccountId === account.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card',
                )}
              >
                <Text
                  className={cn(
                    'text-sm font-medium',
                    selectedAccountId === account.id ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {account.name}
                </Text>
              </Pressable>
            ))}
          </View>
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
          disabled={createTransaction.isPending}
          className="mt-2"
        >
          <Text className="text-sm font-medium text-primary-foreground">
            {createTransaction.isPending ? t('saving') : t('addTransaction')}
          </Text>
        </Button>
      </View>
    </ScrollView>
  );
}
