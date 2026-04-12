import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { ImageIcon } from 'lucide-react-native';
import { cn } from '@/shared/utils/cn';
import { LinearGradient } from 'expo-linear-gradient';

interface SectionCoverProps {
  imageUrl: string;
  positionY?: number;
  onChangeCover?: () => void;
  className?: string;
}

export function SectionCover({
  imageUrl,
  positionY = 50,
  onChangeCover,
  className,
}: SectionCoverProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <View className={cn('relative h-[140px] w-full overflow-hidden', className)}>
      {/* Placeholder */}
      {!isLoaded && (
        <View className="absolute inset-0 bg-muted" />
      )}

      {/* Cover image */}
      <Image
        source={{ uri: imageUrl }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        contentPosition={{ top: `${positionY}%`, left: '50%' }}
        onLoad={() => setIsLoaded(true)}
        transition={300}
      />

      {/* Gradient overlay at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.03)', 'rgba(0,0,0,0.15)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 60 }}
      />

      {/* Change cover button */}
      {onChangeCover && (
        <Pressable
          onPress={onChangeCover}
          className="absolute right-3 top-3 flex-row items-center gap-1.5 rounded-md bg-black/50 px-2.5 py-1.5"
        >
          <Icon as={ImageIcon} size={14} className="text-white" />
          <Text className="text-xs font-medium text-white">Change</Text>
        </Pressable>
      )}
    </View>
  );
}
