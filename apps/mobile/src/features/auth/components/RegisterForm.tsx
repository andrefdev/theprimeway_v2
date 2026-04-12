import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { registerSchema, type RegisterFormData } from '../types';
import { useTranslation } from '@/shared/hooks/useTranslation';

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  isLoading?: boolean;
}

export function RegisterForm({ onSubmit, isLoading }: RegisterFormProps) {
  const { t } = useTranslation('auth.register');
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">{t('name')}</Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className={cn(
                'h-11 rounded-md border border-input bg-background px-3 text-base text-foreground',
                errors.name && 'border-destructive'
              )}
              placeholder={t('namePlaceholder')}
              placeholderTextColor="hsl(0 0% 63.9%)"
              autoCapitalize="words"
              autoComplete="name"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.name && <Text className="text-xs text-destructive">{errors.name.message}</Text>}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">{t('email')}</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className={cn(
                'h-11 rounded-md border border-input bg-background px-3 text-base text-foreground',
                errors.email && 'border-destructive'
              )}
              placeholder={t('emailPlaceholder')}
              placeholderTextColor="hsl(0 0% 63.9%)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.email && <Text className="text-xs text-destructive">{errors.email.message}</Text>}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">{t('password')}</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className={cn(
                'h-11 rounded-md border border-input bg-background px-3 text-base text-foreground',
                errors.password && 'border-destructive'
              )}
              placeholder={t('passwordPlaceholder')}
              placeholderTextColor="hsl(0 0% 63.9%)"
              secureTextEntry
              autoCapitalize="none"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.password && (
          <Text className="text-xs text-destructive">{errors.password.message}</Text>
        )}
      </View>

      <Button className="mt-2" onPress={handleSubmit(onSubmit)} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="hsl(0 0% 9%)" />
        ) : (
          <Text className="text-sm font-medium text-primary-foreground">{t('submit')}</Text>
        )}
      </Button>
    </View>
  );
}
