import { Pressable, View } from 'react-native';
import { useEffect } from 'react';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react-native';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import { cn } from '@/shared/utils/cn';
import { useToastStore, type ToastItem, type ToastVariant } from '@/shared/lib/toast';

const VARIANT_STYLES: Record<ToastVariant, { container: string; icon: any }> = {
  success: { container: 'bg-emerald-600', icon: CheckCircle2 },
  error: { container: 'bg-destructive', icon: AlertCircle },
  warning: { container: 'bg-amber-500', icon: AlertTriangle },
  info: { container: 'bg-primary', icon: Info },
};

function ToastRow({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const styles = VARIANT_STYLES[item.variant];

  useEffect(() => {
    const t = setTimeout(() => dismiss(item.id), item.durationMs);
    return () => clearTimeout(t);
  }, [item.id, item.durationMs, dismiss]);

  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOutUp.duration(180)}
      className="mb-2"
    >
      <Pressable onPress={() => dismiss(item.id)}>
        <View
          className={cn(
            'flex-row items-start gap-3 rounded-xl px-4 py-3 shadow-lg',
            styles.container
          )}
        >
          <Icon as={styles.icon} size={18} className="mt-0.5 text-white" />
          <View className="flex-1">
            {item.title ? (
              <Text className="text-sm font-semibold text-white">{item.title}</Text>
            ) : null}
            <Text className="text-sm text-white">{item.message}</Text>
          </View>
          <Icon as={X} size={16} className="mt-0.5 text-white/80" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function Toaster() {
  const items = useToastStore((s) => s.items);
  if (items.length === 0) return null;
  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 top-12 z-50 px-4"
    >
      {items.map((item) => (
        <ToastRow key={item.id} item={item} />
      ))}
    </View>
  );
}
