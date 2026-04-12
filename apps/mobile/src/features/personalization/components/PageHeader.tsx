import { View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { DEFAULT_SECTION_ICONS } from '../model/constants';
import type { SectionId } from '../model/types';

interface PageHeaderProps {
  sectionId: SectionId;
  title: string;
  actions?: React.ReactNode;
}

export function PageHeader({ sectionId, title, actions }: PageHeaderProps) {
  const SectionIcon = DEFAULT_SECTION_ICONS[sectionId];

  return (
    <View className="px-4 pb-1 pt-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-lg">
            <Icon as={SectionIcon} size={22} className="text-foreground" />
          </View>
          <Text className="flex-1 text-2xl font-bold text-foreground" numberOfLines={1}>
            {title}
          </Text>
        </View>
        {actions && <View className="flex-row items-center gap-2">{actions}</View>}
      </View>
    </View>
  );
}
