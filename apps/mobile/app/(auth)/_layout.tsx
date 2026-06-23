import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import { colors } from '../../constants/theme';

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  // Already signed in? Don't show auth screens.
  if (isLoaded && isSignedIn) return <Redirect href="/(app)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
