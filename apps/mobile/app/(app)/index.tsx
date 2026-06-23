import { useAuth, useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, View } from 'react-native';
import {
  Body,
  GhostButton,
  Heading,
  PrimaryButton,
  Screen,
  Wordmark,
} from '../../components/ui';
import { colors, radius, spacing, spectrumColors } from '../../constants/theme';

// Candidate home (Marcus). Calm by default; the only Wrapped touch is the profile
// strength meter — competence made visible (SDT), framed as growth, never deficiency.
// The actual Story Profile build flow lands in the next phase.
export default function Home() {
  const { user } = useUser();
  const { signOut } = useAuth();

  const firstName =
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ??
    'there';

  // Placeholder until the Story Profile + Full Spectrum assessment feed this.
  const profileStrength = 8;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: spacing.xl, gap: spacing.xl }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Wordmark size={18} />
          <GhostButton label="Sign out" onPress={() => signOut()} />
        </View>

        <View style={{ gap: 8 }}>
          <Heading>Welcome, {firstName}.</Heading>
          <Body muted>
            Let’s build a profile that shows who you became in service — and find
            where you go next.
          </Body>
        </View>

        {/* Profile strength meter — the calm Wrapped moment. */}
        <View
          style={{
            backgroundColor: colors.gray050,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.lg,
            gap: spacing.md,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
              Profile strength
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
              {profileStrength}%
            </Text>
          </View>
          <View
            style={{
              height: 10,
              borderRadius: radius.full,
              backgroundColor: colors.gray100,
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={spectrumColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: `${profileStrength}%`,
                height: '100%',
                borderRadius: radius.full,
              }}
            />
          </View>
          <Body muted>Every step you take here makes it stronger.</Body>
        </View>

        <View style={{ gap: spacing.md }}>
          <PrimaryButton
            label="Build your Story Profile"
            onPress={() => {
              /* Story Profile build flow — next build phase (Feature 1.2). */
            }}
          />
          <Text
            style={{
              textAlign: 'center',
              fontSize: 13,
              color: colors.textMuted,
            }}
          >
            Talk it through, upload a resume, or text — your choice. Coming next.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
