import * as LocalAuthentication from 'expo-local-authentication';

export async function isBiometricSupported(): Promise<boolean> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && isEnrolled;
}

export async function authenticateBiometric(reason: string): Promise<boolean> {
  const supported = await isBiometricSupported();
  if (!supported) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}
