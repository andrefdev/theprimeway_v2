import { useCallback, useMemo, useRef, useEffect } from 'react';
import { View } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Text } from '@/shared/components/ui/text';
import { useColorScheme } from 'nativewind';

interface FormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  snapPoints?: (string | number)[];
  children: React.ReactNode;
}

export function FormSheet({
  isOpen,
  onClose,
  title,
  snapPoints: customSnapPoints,
  children,
}: FormSheetProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => customSnapPoints ?? ['65%'], [customSnapPoints]);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  if (!isOpen) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: isDark ? 'hsl(210, 20%, 11%)' : '#ffffff',
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? 'hsl(210, 10%, 40%)' : '#ccc',
        width: 40,
      }}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 16,
      }}
    >
      {/* Title */}
      {title && (
        <View className="px-4 pb-4">
          <Text className="text-center text-lg font-semibold text-foreground">{title}</Text>
        </View>
      )}

      {/* Scrollable content */}
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
