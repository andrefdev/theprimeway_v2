import { useCallback, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '@shared/stores/authStore';
import { Platform } from 'react-native';

// Ensure browser sessions complete correctly
WebBrowser.maybeCompleteAuthSession();

// Lazy-load native Google Sign-In (crashes in Expo Go, works in dev builds & production)
let GoogleSigninModule: typeof import('@react-native-google-signin/google-signin') | null = null;
let googleConfigured = false;

function getGoogleSignin() {
  if (!GoogleSigninModule) {
    try {
      GoogleSigninModule = require('@react-native-google-signin/google-signin');
    } catch {
      console.warn('[OAuth] @react-native-google-signin not available (Expo Go?)');
      return null;
    }
  }
  if (!googleConfigured && GoogleSigninModule) {
    GoogleSigninModule.GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      offlineAccess: false,
      scopes: ['email', 'profile'],
    });
    googleConfigured = true;
  }
  return GoogleSigninModule;
}

/**
 * Google One Tap / Native Sign-In.
 * Signs out first to always show account picker.
 */
export function useGoogleAuth() {
  const loginWithOAuth = useAuthStore((s) => s.loginWithOAuth);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const mod = getGoogleSignin();
      if (!mod) {
        console.error('[OAuth] Google Sign-In not available in this environment');
        return false;
      }

      await mod.GoogleSignin.hasPlayServices();

      // Sign out first so the account picker always shows
      try {
        await mod.GoogleSignin.signOut();
      } catch {
        // Ignore — may not be signed in
      }

      const response = await mod.GoogleSignin.signIn();

      if (mod.isSuccessResponse(response)) {
        const idToken = response.data?.idToken;
        if (idToken) {
          await loginWithOAuth('google', idToken);
          return true;
        }
      }
      return false;
    } catch (error: any) {
      if (error?.code === 'SIGN_IN_CANCELLED') {
        // User cancelled — not an error
      } else if (error?.code === 'IN_PROGRESS') {
        console.warn('[OAuth] Google sign-in already in progress');
      } else {
        console.error('[OAuth] Google sign-in error:', error);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loginWithOAuth]);

  return { signIn, isLoading };
}

/**
 * Apple Sign-In (iOS only) — native popup.
 */
export function useAppleAuth() {
  const loginWithOAuth = useAuthStore((s) => s.loginWithOAuth);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = useCallback(async () => {
    if (Platform.OS !== 'ios') return false;

    setIsLoading(true);
    try {
      const AppleAuthentication = require('expo-apple-authentication');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        await loginWithOAuth('apple', credential.identityToken);
        return true;
      }
      return false;
    } catch (error: any) {
      if (error?.code !== 'ERR_REQUEST_CANCELED') {
        console.error('[OAuth] Apple sign-in error:', error);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loginWithOAuth]);

  return { signIn, isLoading, isAvailable: Platform.OS === 'ios' };
}

