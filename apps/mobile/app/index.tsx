import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../constants/theme';

// Entry gate: send signed-in candidates into the app, everyone else to sign-in.
export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={isSignedIn ? '/(app)' : '/(auth)/sign-in'} />;
}
