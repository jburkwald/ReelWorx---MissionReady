// Native UI primitives for the candidate (Marcus) experience.
//
// Apple-calm by default — generous spacing, restrained type, spring-y press states.
// The spectrum gradient is the one Wrapped flourish, used on the primary CTA and the
// wordmark bar, not everywhere.

import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, spectrumColors } from '../constants/theme';

export function Screen({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={[styles.screenInner, style]}>{children}</View>
    </View>
  );
}

export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.wordmark, { fontSize: size }]}>
        REELWORX MISSIONREADY
      </Text>
      <LinearGradient
        colors={spectrumColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.wordmarkBar}
      />
    </View>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Body({
  children,
  muted,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <Text style={[styles.body, muted && { color: colors.textMuted }]}>
      {children}
    </Text>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.gray400}
        {...props}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        { opacity: off ? 0.5 : pressed ? 0.92 : 1 },
        pressed && !off ? { transform: [{ scale: 0.99 }] } : null,
      ]}
    >
      <LinearGradient
        colors={spectrumColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.btn}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.ghostText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenInner: { flex: 1, paddingHorizontal: spacing.lg },
  wordmark: {
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.text,
  },
  wordmarkBar: { height: 4, width: 64, borderRadius: radius.full },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  body: { fontSize: 16, lineHeight: 23, color: colors.text },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  input: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.fieldBg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  btn: {
    height: 54,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghost: { height: 48, alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
