import { ClerkProvider } from '@clerk/clerk-expo';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Persist the Clerk session securely on device so Marcus stays signed in between
// app opens (he lives on his phone, in spare moments — don't make him re-auth).
const tokenCache = {
  getToken: (key: string) =>
    SecureStore.getItemAsync(key).catch(() => null),
  saveToken: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value).catch(() => undefined),
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Slot />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
