import { cn } from '@/shared/utils/cn';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { Compass, Pencil } from 'lucide-react-native';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '@/shared/hooks/useTranslation';
import type { PrimeVision } from '@shared/types/models';

interface VisionCardProps {
  vision: PrimeVision;
  className?: string;
}

export function VisionCard({ vision, className }: VisionCardProps) {
  const { t } = useTranslation('features.goals');
  const handleEdit = () => {
    router.push('/(app)/(tabs)/goals/vision');
  };

  return (
    <View
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card',
        className
      )}
    >
      {/* Primary gradient top border */}
      <View className="h-1 bg-primary" />
      <View className="p-5">
      {/* Header */}
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon as={Compass} size={18} className="text-primary" />
          </View>
          <Text className="text-base font-semibold text-card-foreground">{t('primeVision')}</Text>
        </View>
        <Button variant="ghost" size="icon" onPress={handleEdit}>
          <Icon as={Pencil} size={16} className="text-muted-foreground" />
        </Button>
      </View>

      {/* Title */}
      <Text className="mb-1 text-lg font-bold text-card-foreground" numberOfLines={2}>
        {vision.title}
      </Text>

      {/* Narrative */}
      {vision.narrative ? (
        <Text className="text-sm leading-5 text-muted-foreground" numberOfLines={3}>
          {vision.narrative}
        </Text>
      ) : (
        <Text className="text-sm italic text-muted-foreground">
          {t('vision.form.edit')}
        </Text>
      )}
      </View>
    </View>
  );
}
