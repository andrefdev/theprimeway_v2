import { View, ScrollView, Alert, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import { Text } from '@/shared/components/ui/text';
import { LoginForm } from '@features/auth/components/LoginForm';
import { SocialButton } from '@features/auth/components/SocialButton';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useGoogleAuth, useAppleAuth } from '@features/auth/hooks/useOAuth';
import { useState } from 'react';
import type { LoginFormData } from '@features/auth/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/shared/hooks/useTranslation';

const LOGO = require('../../assets/images/tpw_logo_full-512x512.png');

export default function LoginScreen() {
  const { login } = useAuth();
  const googleAuth = useGoogleAuth();
  const appleAuth = useAppleAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation('auth.login');
  const { t: tCommon } = useTranslation('common');
  const { t: tRegister } = useTranslation('auth.register');

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data);
      router.replace('/(app)/(tabs)');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('errorTitle');
      Alert.alert(tCommon('status.error'), message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const success = await googleAuth.signIn();
    if (success) router.replace('/(app)/(tabs)');
  };

  const handleAppleLogin = async () => {
    const success = await appleAuth.signIn();
    if (success) router.replace('/(app)/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-8"
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View className="mb-6 items-center">
          <Image
            source={LOGO}
            style={{ width: 80, height: 80, borderRadius: 20 }}
            contentFit="contain"
          />
        </View>

        {/* Title */}
        <View className="mb-8">
          <Text className="text-center text-3xl font-bold text-foreground">{t('title')}</Text>
          <Text className="mt-2 text-center text-muted-foreground">{t('description')}</Text>
        </View>

        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />

        <Link href="/(auth)/forgot-password" asChild>
          <Text className="mt-4 text-center text-sm text-primary">{t('forgotPassword')}</Text>
        </Link>

        <View className="my-6 flex-row items-center gap-4">
          <View className="h-px flex-1 bg-border" />
          <Text className="text-xs text-muted-foreground">{tCommon('actions.or')}</Text>
          <View className="h-px flex-1 bg-border" />
        </View>

        <View className="gap-3">
          <SocialButton
            provider="google"
            onPress={handleGoogleLogin}
            isLoading={googleAuth.isLoading}
          />
          {(Platform.OS === 'ios' || appleAuth.isAvailable) && (
            <SocialButton
              provider="apple"
              onPress={handleAppleLogin}
              isLoading={appleAuth.isLoading}
            />
          )}
        </View>

        <View className="mt-8 flex-row items-center justify-center gap-1">
          <Text className="text-sm text-muted-foreground">{t('noAccount')}</Text>
          <Link href="/(auth)/register" asChild>
            <Text className="text-sm font-medium text-primary">{tRegister('title')}</Text>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
