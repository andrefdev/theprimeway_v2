import { View, ScrollView, TextInput, Alert } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { Icon } from '@/shared/components/ui/icon';
import { Header } from '@/shared/components/layout/Header';
import { Shield, CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { apiClient } from '@/shared/api/client';
import { KYC } from '@/shared/api/endpoints';
import { useTranslation } from '@/shared/hooks/useTranslation';

export default function KycScreen() {
  const { t } = useTranslation('features.kyc');
  const { t: tCommon } = useTranslation('common');
  const { t: tProfile } = useTranslation('auth.profile');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !documentNumber) {
      Alert.alert(tCommon('status.error'), tCommon('validation.required'));
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post(KYC.BASE, { firstName, lastName, documentNumber });
      setIsVerified(true);
    } catch {
      Alert.alert(tCommon('status.error'), t('messages.error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title={t('title')} showBack />
        <View className="flex-1 items-center justify-center px-6">
          <Icon as={CheckCircle} size={64} className="text-primary" />
          <Text className="mt-4 text-xl font-bold text-foreground">{t('messages.submitted')}</Text>
          <Text className="mt-2 text-center text-muted-foreground">
            {t('status.pendingDescription')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title={t('title')} showBack />

      <ScrollView className="flex-1 px-4" contentContainerClassName="pb-8">
        <View className="mt-4 items-center">
          <Icon as={Shield} size={40} className="text-primary" />
          <Text className="mt-3 text-xl font-bold text-foreground">{t('title')}</Text>
          <Text className="mt-1 text-center text-sm text-muted-foreground">
            {t('description')}
          </Text>
        </View>

        <View className="mt-8 gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">{tProfile('firstName')}</Text>
            <TextInput
              className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
              placeholder={tProfile('placeholders.firstName')}
              placeholderTextColor="hsl(0 0% 63.9%)"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">{tProfile('lastName')}</Text>
            <TextInput
              className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
              placeholder={tProfile('placeholders.lastName')}
              placeholderTextColor="hsl(0 0% 63.9%)"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">{t('fields.documentNumber')}</Text>
            <TextInput
              className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
              placeholder={t('fields.documentNumber')}
              placeholderTextColor="hsl(0 0% 63.9%)"
              value={documentNumber}
              onChangeText={setDocumentNumber}
            />
          </View>
        </View>

        <Button className="mt-8" onPress={handleSubmit} disabled={isLoading}>
          <Text className="text-sm font-medium text-primary-foreground">
            {isLoading ? tCommon('actions.processing') : tCommon('actions.submit')}
          </Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
