import { useCallback, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useConnectGoogleCalendar } from './useCalendar';

WebBrowser.maybeCompleteAuthSession();

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

export function useGoogleCalendarOAuth() {
  const connect = useConnectGoogleCalendar();
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: CALENDAR_SCOPES,
    responseType: 'code',
    extraParams: { access_type: 'offline', prompt: 'consent' },
  });

  const connectAccount = useCallback(async () => {
    setError(null);
    const result = await promptAsync();
    if (result.type !== 'success') {
      if (result.type === 'error') setError(result.error?.message ?? 'OAuth error');
      return false;
    }
    const code = result.params?.code;
    if (!code) {
      setError('No authorization code returned');
      return false;
    }
    try {
      await connect.mutateAsync(code);
      return true;
    } catch (e: any) {
      setError(e?.message ?? 'Connect failed');
      return false;
    }
  }, [promptAsync, connect]);

  return {
    connectAccount,
    isConnecting: connect.isPending || !request,
    error,
    response,
  };
}
