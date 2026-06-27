import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Body, GhostButton, Heading, Screen } from '../../components/ui';
import { colors, radius, spacing, spectrumColors } from '../../constants/theme';
import { useApi } from '../../lib/api';

// Candidate-side Fit Read (Feature 2.2, Dana's view) — kept local (mobile stays server-free).
interface CandidateFitRead {
  roleId: string;
  roleTitle: string;
  company: string;
  location: string | null;
  overall: number;
  tier: { key: string; label: string; celebratory: boolean };
  why: string;
  gap: string | null;
}

export default function Fit() {
  const router = useRouter();
  const api = useApi();
  const [reads, setReads] = useState<CandidateFitRead[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<{ reads: CandidateFitRead[] }>('/matches')
      .then((d) => {
        if (active) setReads(d.reads);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api]);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: spacing.lg, gap: spacing.xl }}
      >
        <GhostButton label="‹ Back" onPress={() => router.back()} />

        <View style={{ gap: 8 }}>
          <Heading>Companies that suit you.</Heading>
          <Body muted>
            Read against who you actually are, not keywords. Here is why each one fits, and the
            one place to grow.
          </Body>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.gray400} style={{ marginTop: spacing.xl }} />
        ) : !reads || reads.length === 0 ? (
          <Text style={{ fontSize: 14, color: colors.textMuted }}>
            Build your story first and your matches will appear here.
          </Text>
        ) : (
          <View style={{ gap: spacing.md }}>
            {reads.map((r) => (
              <View
                key={r.roleId}
                style={{
                  backgroundColor: colors.gray050,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 0.3, color: colors.textMuted }}>
                      {r.company.toUpperCase()}
                    </Text>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 2 }}>
                      {r.roleTitle}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                      {r.location ?? 'Location flexible'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 26, fontWeight: '800', color: r.tier.celebratory ? colors.accent : colors.text, lineHeight: 28 }}>
                      {r.overall}%
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.3, color: colors.textMuted, textTransform: 'uppercase' }}>
                      {r.tier.label}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 14.5, lineHeight: 21, color: colors.text, marginTop: 12 }}>{r.why}</Text>
                {r.gap ? (
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 8 }}>{r.gap}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <View style={{ borderRadius: radius.lg, overflow: 'hidden' }}>
          <LinearGradient colors={spectrumColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: spacing.md }}>
            <Text style={{ fontSize: 13, color: '#fff', textAlign: 'center' }}>
              Reaching out costs an intent token, so when you do, it means something.
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </Screen>
  );
}
