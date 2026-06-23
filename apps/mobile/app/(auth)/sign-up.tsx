import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
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

export default function SignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSignUp() {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (e) {
      setError(clerkError(e) ?? 'We couldn’t start your sign-up.');
    } finally {
      setLoading(false);
    }
  }

  async function onVerify() {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const res = await signUp.attemptEmailAddressVerification({ code });
      if (res.status === 'complete') {
        await setActive({ session: res.createdSessionId });
        router.replace('/(app)');
      } else {
        setError('That code didn’t verify. Try again.');
      }
    } catch (e) {
      setError(clerkError(e) ?? 'That code didn’t verify. Try again.');
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

          {!pendingVerification ? (
            <>
              <View style={{ gap: 6 }}>
                <Heading>Start your next mission.</Heading>
                <Body muted>
                  Build a profile that shows who you became — not a resume.
                </Body>
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
                  placeholder="Create a password"
                />
                {error ? (
                  <Text style={{ color: colors.red, fontSize: 14 }}>{error}</Text>
                ) : null}
                <PrimaryButton
                  label="Create account"
                  onPress={onSignUp}
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
                <Body muted>Already have an account?</Body>
                <Link href="/(auth)/sign-in" asChild>
                  <GhostButton label="Sign in" onPress={() => {}} />
                </Link>
              </View>
            </>
          ) : (
            <>
              <View style={{ gap: 6 }}>
                <Heading>Check your email.</Heading>
                <Body muted>We sent a 6-digit code to {email}.</Body>
              </View>
              <View style={{ gap: spacing.md }}>
                <Field
                  label="Verification code"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  placeholder="123456"
                />
                {error ? (
                  <Text style={{ color: colors.red, fontSize: 14 }}>{error}</Text>
                ) : null}
                <PrimaryButton
                  label="Verify & continue"
                  onPress={onVerify}
                  loading={loading}
                  disabled={code.length < 4}
                />
              </View>
            </>
          )}
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
