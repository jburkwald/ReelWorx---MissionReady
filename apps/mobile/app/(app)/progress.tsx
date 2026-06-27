import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Body, GhostButton, Heading, Screen } from '../../components/ui';
import { colors, radius, spacing, spectrumColors } from '../../constants/theme';
import { useApi, WEB_URL } from '../../lib/api';

// Mirrors shared/server CandidateDashboard — kept local (mobile stays server-free).
type ComponentStatus = 'complete' | 'incomplete' | 'processing' | 'locked';
interface StrengthComponent {
  id: string;
  label: string;
  blurb: string;
  weight: number;
  status: ComponentStatus;
  awarded: number;
}
interface ProfileStrength {
  score: number;
  maxScore: number;
  tier: { key: string; label: string; blurb: string };
  discoverable: boolean;
  components: StrengthComponent[];
}
interface CandidateDashboard {
  candidateId: string;
  completenessScore: number;
  strength: ProfileStrength;
  interestedCount: number;
  interested: { organizationName: string; roleTitle: string | null }[];
  savedPaths: number;
  openPaths: number;
  hasIntroVideo: boolean;
  hasAssessment: boolean;
}

// The Veteran's Own View (Feature 6.2). Marcus's momentum: strength, who's interested, and
// the next thing worth doing — framed as growth, never as a list of what's missing.
export default function Progress() {
  const router = useRouter();
  const api = useApi();
  const [data, setData] = useState<CandidateDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<CandidateDashboard>('/progress')
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api]);

  const nextStep = data ? suggestNextStep(data) : null;

  async function shareProfile() {
    if (!data) return;
    const url = `${WEB_URL}/p/${data.candidateId}`;
    await Share.share({
      message: `My story, not a résumé — here's who I am and where I'm headed: ${url}`,
      url,
    });
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: spacing.lg, gap: spacing.xl }}
      >
        <GhostButton label="‹ Back" onPress={() => router.back()} />

        <View style={{ gap: 8 }}>
          <Heading>Your momentum.</Heading>
          <Body muted>Where you stand, who’s interested, and the next worthwhile step.</Body>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.gray400} style={{ marginTop: spacing.xl }} />
        ) : !data ? (
          <Text style={{ fontSize: 14, color: colors.textMuted }}>
            Couldn’t load your progress right now.
          </Text>
        ) : (
          <>
            {/* Strength — the registry meter, components in the open (Change 1 + 4). */}
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>Profile strength</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 2 }}>
                    {data.strength.tier.label} · {data.strength.tier.blurb}
                  </Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>
                  {data.strength.score}
                  <Text style={{ fontSize: 13, color: colors.textMuted }}> / {data.strength.maxScore}</Text>
                </Text>
              </View>
              <View style={{ height: 10, borderRadius: radius.full, backgroundColor: colors.gray100, overflow: 'hidden' }}>
                <LinearGradient
                  colors={spectrumColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: `${data.strength.score}%`, height: '100%', borderRadius: radius.full }}
                />
              </View>

              <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
                {data.strength.components.map((c) => (
                  <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: radius.full,
                        backgroundColor: c.status === 'complete' ? colors.accent : colors.gray100,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: c.status === 'complete' ? '#fff' : colors.textMuted }}>
                        {c.status === 'complete' ? '✓' : c.status === 'locked' ? '🔒' : c.status === 'processing' ? '…' : ''}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: c.status === 'locked' ? colors.textMuted : colors.text }}>
                      {c.label}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: c.status === 'complete' ? colors.accent : colors.textMuted }}>
                      {c.status === 'locked' ? 'soon' : `+${c.weight}`}
                    </Text>
                  </View>
                ))}
              </View>
              {data.strength.components.some((c) => c.status === 'locked') ? (
                <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 17 }}>
                  The locked slot is reserved for later. It is not your gap to close — your
                  strength tops out at {data.strength.maxScore} until it ships.
                </Text>
              ) : null}
            </View>

            {/* One Profile, Two Outputs (1.3) — your story link IS your new résumé. */}
            <Pressable
              onPress={shareProfile}
              style={({ pressed }) => [{ borderRadius: radius.lg, overflow: 'hidden', opacity: pressed ? 0.92 : 1 }]}
            >
              <LinearGradient
                colors={spectrumColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: spacing.lg }}
              >
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff' }}>Share your profile</Text>
                <Text style={{ marginTop: 4, fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
                  One link that tells your whole story — and a clean résumé version that passes the filters.
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Who's interested. */}
            <View style={{ gap: spacing.md }}>
              <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 0.4, color: colors.textMuted, textTransform: 'uppercase' }}>
                Who’s interested
              </Text>
              {data.interested.length === 0 ? (
                <Text style={{ fontSize: 14, color: colors.textMuted }}>
                  No companies have reached out yet — a stronger profile is what draws them in.
                </Text>
              ) : (
                data.interested.map((c, i) => (
                  <View
                    key={i}
                    style={{ backgroundColor: colors.gray050, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{c.organizationName}</Text>
                    {c.roleTitle ? (
                      <Text style={{ marginTop: 2, fontSize: 14, color: colors.textMuted }}>{c.roleTitle}</Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>

            {/* Path progress. */}
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <MiniStat label="Paths saved" value={data.savedPaths} />
              <MiniStat label="Companies interested" value={data.interestedCount} />
            </View>

            {nextStep ? (
              <LinearGradient
                colors={spectrumColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: radius.lg, padding: 2 }}
              >
                <View style={{ backgroundColor: colors.bg, borderRadius: radius.lg - 2, padding: spacing.lg }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 0.4, color: colors.textMuted, textTransform: 'uppercase' }}>
                    Worth doing next
                  </Text>
                  <Text style={{ marginTop: 6, fontSize: 16, lineHeight: 22, color: colors.text }}>
                    {nextStep}
                  </Text>
                </View>
              </LinearGradient>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.gray050, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>{value}</Text>
      <Text style={{ marginTop: 4, fontSize: 13, color: colors.textMuted }}>{label}</Text>
    </View>
  );
}

// Framed as growth: the single highest-leverage next move, never a shaming checklist.
function suggestNextStep(d: CandidateDashboard): string | null {
  if (!d.hasIntroVideo) return 'Record your 60-second intro — it’s the first thing that shows you’re a person, not a résumé.';
  if (!d.hasAssessment) return 'Take the Full Spectrum read — it fills out who you are and noticeably strengthens your profile.';
  if (d.savedPaths === 0) return 'Explore your paths and save one that sparks something — it sharpens what we surface.';
  if (d.completenessScore < 100) return 'Keep adding to your story — every detail makes you easier to find and read.';
  return null;
}
