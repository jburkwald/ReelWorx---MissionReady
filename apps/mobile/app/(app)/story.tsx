import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Body, GhostButton, Heading, Screen } from '../../components/ui';
import { colors, radius, spacing } from '../../constants/theme';

// "Choose your way in" — three doors into the Story Profile (Feature 1.2). Autonomy
// (SDT): the person picks how they want to do this. Text is live; talk + résumé upload
// are honestly framed as coming next (no fake buttons).
export default function StoryEntry() {
  const router = useRouter();

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
            Not a resume — you. Pick whatever feels easiest. You can stop anytime.
          </Body>
        </View>

        <View style={{ gap: spacing.md }}>
          <OptionCard
            title="Text it through"
            subtitle="Chat with a guide, one question at a time."
            onPress={() => router.push('/(app)/chat')}
          />
          <OptionCard
            title="Talk it through"
            subtitle="Speak with an audio guide."
            comingSoon
          />
          <OptionCard
            title="Upload a résumé"
            subtitle="Start from what you already have."
            comingSoon
          />
        </View>
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
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
          {title}
        </Text>
        {comingSoon ? (
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.5,
              color: colors.textMuted,
            }}
          >
            SOON
          </Text>
        ) : (
          <Text style={{ fontSize: 22, color: colors.textMuted }}>›</Text>
        )}
      </View>
      <Text style={{ marginTop: 4, fontSize: 14, color: colors.textMuted }}>
        {subtitle}
      </Text>
    </Pressable>
  );
}
