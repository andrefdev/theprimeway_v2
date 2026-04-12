import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from '@/shared/hooks/useTranslation';

export default function WelcomeScreen() {
  const { t } = useTranslation('features.onboarding');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        {/* Logo */}
        <View className="mb-8 h-28 w-28 items-center justify-center rounded-3xl bg-primary">
          <Image
            source={require('@assets/images/icon.png')}
            className="h-24 w-24 rounded-2xl"
            contentFit="contain"
          />
        </View>

        {/* App Name */}
        <Text className="mb-3 text-center text-4xl font-extrabold tracking-tight text-foreground">
          The Prime Way
        </Text>

        {/* Tagline */}
        <Text className="mb-2 text-center text-lg text-muted-foreground">
          {t('welcome.tagline')}
        </Text>
        <Text className="text-center text-base text-muted-foreground/70">
          {t('welcome.subtitle')}
        </Text>
      </View>

      {/* Bottom CTA */}
      <View className="px-8 pb-6">
        <Button
          size="lg"
          className="w-full"
          onPress={() => router.push('/(onboarding)/goals')}
        >
          <Text className="text-base font-semibold text-primary-foreground">
            {t('buttons.getStarted')}
          </Text>
          <Icon as={ChevronRight} size={20} className="text-primary-foreground" />
        </Button>

        <Text className="mt-4 text-center text-sm text-muted-foreground">
          {t('welcome.minuteText')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
