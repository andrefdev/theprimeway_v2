import { FormSheet } from '@/shared/components/ui/form-sheet';
import { TransactionForm } from './TransactionForm';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { TransactionType } from '@shared/types/models';

interface TransactionFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
}

export function TransactionFormSheet({ isOpen, onClose, initialType }: TransactionFormSheetProps) {
  const { t } = useTranslation('features.finances.transactionForm');

  return (
    <FormSheet isOpen={isOpen} onClose={onClose} title={t('title')}>
      <TransactionForm onSuccess={onClose} initialType={initialType} />
    </FormSheet>
  );
}
