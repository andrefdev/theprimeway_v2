import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { loginSchema, type LoginFormData } from '../types';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';
import { Icon } from '@/shared/components/ui/icon';
import { useTranslation } from '@/shared/hooks/useTranslation';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation('auth.login');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <View className="gap-4">
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
        {errors.email && (
          <Text className="text-xs text-destructive">{errors.email.message}</Text>
        )}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">{t('password')}</Text>
        <View className="relative">
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={cn(
                  'h-11 rounded-md border border-input bg-background px-3 pr-10 text-base text-foreground',
                  errors.password && 'border-destructive'
                )}
                placeholder={t('passwordPlaceholder')}
                placeholderTextColor="hsl(0 0% 63.9%)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          <Pressable
            className="absolute right-3 top-3"
            onPress={() => setShowPassword(!showPassword)}
          >
            <Icon
              as={showPassword ? EyeOff : Eye}
              size={18}
              className="text-muted-foreground"
            />
          </Pressable>
        </View>
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
