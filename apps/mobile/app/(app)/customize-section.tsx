import { useState, useMemo, useCallback } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Text } from '@/shared/components/ui/text';
import { Icon } from '@/shared/components/ui/icon';
import {
  ArrowLeft, X, Lock, RotateCcw, ImageIcon,
} from 'lucide-react-native';
import { cn } from '@/shared/utils/cn';
import { PillTabs } from '@/shared/components/ui/pill-tabs';
import { useSectionCustomization } from '@features/personalization/hooks/useSectionCustomization';
import { useUpdateSectionCustomization } from '@features/personalization/hooks/useUpdateSectionCustomization';
import {
  DEFAULT_SECTION_ICONS,
  EMOJI_CATEGORIES,
  COVER_GALLERY,
  GALLERY_CATEGORIES,
  type GalleryCategory,
} from '@features/personalization/model/constants';
import type { SectionId } from '@features/personalization/model/types';

export default function CustomizeSectionScreen() {
  const { sectionId } = useLocalSearchParams<{ sectionId: string }>();
  const id = sectionId as SectionId;
  const customization = useSectionCustomization(id);
  const { upsert } = useUpdateSectionCustomization();

  const [tab, setTab] = useState<'cover' | 'icon'>('cover');
  const [coverCategory, setCoverCategory] = useState<GalleryCategory | 'all'>('all');

  const hasCover =
    customization?.coverImageType !== 'none' &&
    customization?.coverImageType !== undefined &&
    !!customization?.coverImageUrl;

  // Cover gallery
  const filteredImages = useMemo(
    () =>
      coverCategory === 'all'
        ? COVER_GALLERY
        : COVER_GALLERY.filter((img) => img.category === coverCategory),
    [coverCategory]
  );

  const categoryTabs = useMemo(
    () => GALLERY_CATEGORIES.map((cat) => ({ key: cat.id, label: cat.label })),
    []
  );

  const handleSelectCover = useCallback(
    (url: string) => {
      upsert({ sectionId: id, coverImageUrl: url, coverImageType: 'gallery' });
    },
    [id, upsert]
  );

  const handleRemoveCover = useCallback(() => {
    upsert({ sectionId: id, coverImageUrl: null, coverImageType: 'none' });
  }, [id, upsert]);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      upsert({ sectionId: id, iconType: 'emoji', iconValue: emoji });
    },
    [id, upsert]
  );

  const handleResetIcon = useCallback(() => {
    upsert({ sectionId: id, iconType: 'default', iconValue: null });
  }, [id, upsert]);

  const DefaultIcon = DEFAULT_SECTION_ICONS[id];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={8} className="flex-row items-center gap-2">
          <Icon as={ArrowLeft} size={20} className="text-foreground" />
          <Text className="text-lg font-semibold text-foreground">Customize</Text>
        </Pressable>
      </View>

      {/* Preview */}
      <View className="mx-4 mb-4 overflow-hidden rounded-xl border border-border">
        {hasCover && customization?.coverImageUrl ? (
          <Image
            source={{ uri: customization.coverImageUrl }}
            style={{ width: '100%', height: 80 }}
            contentFit="cover"
            contentPosition={{ top: `${customization.coverPositionY ?? 50}%`, left: '50%' }}
          />
        ) : (
          <View className="h-16 items-center justify-center bg-muted">
            <Text className="text-xs text-muted-foreground">No cover</Text>
          </View>
        )}
        <View className="flex-row items-center gap-3 px-3 py-2">
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-muted">
            {customization?.iconType === 'emoji' && customization.iconValue ? (
              <Text className="text-xl">{customization.iconValue}</Text>
            ) : (
              <Icon as={DefaultIcon} size={20} className="text-foreground" />
            )}
          </View>
          <Text className="text-base font-semibold text-foreground">{id}</Text>
        </View>
      </View>

      {/* Tab switch */}
      <View className="mb-3 flex-row gap-2 px-4">
        <Pressable
          onPress={() => setTab('cover')}
          className={cn('rounded-full px-4 py-2', tab === 'cover' ? 'bg-primary' : 'bg-muted')}
        >
          <Text className={cn('text-sm font-medium', tab === 'cover' ? 'text-primary-foreground' : 'text-muted-foreground')}>
            Cover
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('icon')}
          className={cn('rounded-full px-4 py-2', tab === 'icon' ? 'bg-primary' : 'bg-muted')}
        >
          <Text className={cn('text-sm font-medium', tab === 'icon' ? 'text-primary-foreground' : 'text-muted-foreground')}>
            Icon
          </Text>
        </Pressable>
      </View>

      {tab === 'cover' ? (
        <>
          <View className="mb-3">
            <PillTabs
              tabs={categoryTabs}
              activeKey={coverCategory}
              onTabPress={(key) => setCoverCategory(key as GalleryCategory | 'all')}
            />
          </View>

          <ScrollView contentContainerClassName="px-4 pb-8">
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {/* Remove cover option */}
              {hasCover && (
                <Pressable
                  onPress={handleRemoveCover}
                  className="items-center justify-center overflow-hidden rounded-lg border border-border"
                  style={{ width: '48%', height: 60 }}
                >
                  <View className="flex-row items-center gap-1.5">
                    <Icon as={X} size={14} className="text-muted-foreground" />
                    <Text className="text-xs font-medium text-muted-foreground">Remove</Text>
                  </View>
                </Pressable>
              )}

              {filteredImages.map((image) => {
                const isSelected = customization?.coverImageUrl === image.url;
                return (
                  <Pressable
                    key={image.id}
                    onPress={() => handleSelectCover(image.url)}
                    className={cn(
                      'overflow-hidden rounded-lg border',
                      isSelected ? 'border-2 border-primary' : 'border-border'
                    )}
                    style={{ width: '48%', height: 60 }}
                  >
                    <Image
                      source={{ uri: image.thumbnailUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      transition={200}
                    />
                    {image.premium && (
                      <View className="absolute inset-0 items-center justify-center bg-black/30">
                        <View className="flex-row items-center gap-1 rounded-full bg-black/60 px-2 py-0.5">
                          <Icon as={Lock} size={10} className="text-white" />
                          <Text className="text-[10px] font-medium text-white">Premium</Text>
                        </View>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </>
      ) : (
        <ScrollView contentContainerClassName="px-4 pb-8">
          {/* Reset button */}
          <Pressable
            onPress={handleResetIcon}
            className="mb-4 flex-row items-center gap-2 self-start rounded-md bg-muted px-3 py-2"
          >
            <Icon as={RotateCcw} size={14} className="text-muted-foreground" />
            <Text className="text-xs font-medium text-muted-foreground">Reset to default</Text>
          </Pressable>

          {/* Emoji grid */}
          <View className="gap-5">
            {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
              <View key={key}>
                <Text className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {category.name}
                </Text>
                <View className="flex-row flex-wrap" style={{ gap: 4 }}>
                  {category.emojis.map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => handleEmojiSelect(emoji)}
                      className={cn(
                        'h-11 w-11 items-center justify-center rounded-lg',
                        customization?.iconType === 'emoji' && customization?.iconValue === emoji
                          ? 'bg-primary/15'
                          : 'active:bg-muted'
                      )}
                    >
                      <Text className="text-2xl">{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
