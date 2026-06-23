import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native';
import {
  Body,
  Field,
  GhostButton,
  Heading,
  PrimaryButton,
  Screen,
  Wordmark,
} from '../../components/ui';
import { colors, spacing } from '../../constants/theme';

export default function SignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const res = await signIn.create({ identifier: email, password });
      if (res.status === 'complete') {
        await setActive({ session: res.createdSessionId });
        router.replace('/(app)');
      } else {
        setError('Additional verification is required to finish signing in.');
      }
    } catch (e) {
      setError(clerkError(e) ?? 'We couldn’t sign you in. Check your details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
          <Wordmark />
          <View style={{ gap: 6 }}>
            <Heading>Welcome back.</Heading>
            <Body muted>Pick up right where you left off.</Body>
          </View>

          <View style={{ gap: spacing.md }}>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@email.com"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
            {error ? (
              <Text style={{ color: colors.red, fontSize: 14 }}>{error}</Text>
            ) : null}
            <PrimaryButton
              label="Sign in"
              onPress={onSubmit}
              loading={loading}
              disabled={!email || !password}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Body muted>New here?</Body>
            <Link href="/(auth)/sign-up" asChild>
              <GhostButton label="Create an account" onPress={() => {}} />
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function clerkError(e: unknown): string | null {
  if (
    e &&
    typeof e === 'object' &&
    'errors' in e &&
    Array.isArray((e as { errors: unknown }).errors)
  ) {
    const first = (e as { errors: { message?: string }[] }).errors[0];
    return first?.message ?? null;
  }
  return null;
}
