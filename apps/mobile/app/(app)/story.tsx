import { FOUNDATION_INTRO, getEntryModes, type StoryEntryMode } from '@reelworx/shared';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Body, GhostButton, Heading, Screen } from '../../components/ui';
import { colors, radius, spacing } from '../../constants/theme';

// "Choose your way in" — three explicit doors into the Story Profile (Feature 1.2).
// Autonomy (SDT): the person picks how they start. All three reach the same foundation
// and award the same 35 — mode is a preference, not a different outcome. Voice sits behind
// a flag; text and upload always work.
export default function StoryEntry() {
  const router = useRouter();
  const modes = getEntryModes();

  function start(mode: StoryEntryMode) {
    router.push({ pathname: '/(app)/chat', params: { mode } });
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: spacing.lg, gap: spacing.xl }}
      >
        <GhostButton label="‹ Back" onPress={() => router.back()} />

        <View style={{ gap: 8 }}>
          <Heading>Tell your story.</Heading>
          <Body muted>
            Not a resume — you. Three short phases. {FOUNDATION_INTRO.estimate}{' '}
            {FOUNDATION_INTRO.reassurance}
          </Body>
        </View>

        <View style={{ gap: spacing.md }}>
          {modes.map((m) => (
            <OptionCard
              key={m.id}
              title={m.label}
              subtitle={m.blurb}
              onPress={() => start(m.id)}
              comingSoon={!m.available}
            />
          ))}
        </View>

        <Text style={{ fontSize: 13, color: colors.textMuted }}>
          However you start, you reach the same foundation.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function OptionCard({
  title,
  subtitle,
  onPress,
  comingSoon,
}: {
  title: string;
  subtitle: string;
  onPress?: () => void;
  comingSoon?: boolean;
}) {
  return (
    <Pressable
      onPress={comingSoon ? undefined : onPress}
      disabled={comingSoon}
      style={({ pressed }) => [
        {
          backgroundColor: colors.gray050,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: spacing.lg,
          opacity: comingSoon ? 0.6 : pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{title}</Text>
        {comingSoon ? (
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: colors.textMuted }}>
            SOON
          </Text>
        ) : (
          <Text style={{ fontSize: 22, color: colors.textMuted }}>›</Text>
        )}
      </View>
      <Text style={{ marginTop: 4, fontSize: 14, color: colors.textMuted }}>{subtitle}</Text>
    </Pressable>
  );
}
