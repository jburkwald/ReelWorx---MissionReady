import { useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Body, GhostButton, Heading, Screen } from '../../../components/ui';
import { colors, radius, spacing } from '../../../constants/theme';
import { useApi } from '../../../lib/api';

// Mirrors shared PathDetail (isomorphic type) — re-declared locally only for the response
// envelope; the PathDetail shape itself comes from @reelworx/shared.
interface PathGap {
  label: string;
  why: string;
  howToClose: string;
}
interface PathDetail {
  overview: string;
  payRange: string;
  howToGetIn: string[];
  gaps: PathGap[];
}

// Resource Hub + Gaps & the Bridge (Features 2.3/2.4). What a saved path actually involves,
// and an honest, person-specific read on what's missing and how to close it — so the goal
// feels reachable, never vague.
export default function PathDetailScreen() {
  const router = useRouter();
  const api = useApi();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const [detail, setDetail] = useState<PathDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<{ detail: PathDetail }>(`/paths/${id}`)
      .then((r) => {
        if (active) setDetail(r.detail);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, id]);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: spacing.lg, gap: spacing.xl }}
      >
        <GhostButton label="‹ Back" onPress={() => router.back()} />

        <View style={{ gap: 8 }}>
          <Heading>{title ?? 'This path'}</Heading>
          <Body muted>What it involves, what it pays, and how to get there from here.</Body>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.gray400} style={{ marginTop: spacing.xl }} />
        ) : !detail ? (
          <Text style={{ fontSize: 14, color: colors.textMuted }}>
            Couldn’t load this path right now — try again in a moment.
          </Text>
        ) : (
          <>
            <Section title="What it involves">
              <Text style={{ fontSize: 15, lineHeight: 22, color: colors.text }}>{detail.overview}</Text>
            </Section>

            <Section title="What it pays">
              <Text style={{ fontSize: 15, lineHeight: 22, color: colors.text }}>{detail.payRange}</Text>
            </Section>

            {detail.howToGetIn.length ? (
              <Section title="How to get in">
                <View style={{ gap: spacing.sm }}>
                  {detail.howToGetIn.map((step, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: spacing.md }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: colors.accent, width: 18 }}>{i + 1}</Text>
                      <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: colors.text }}>{step}</Text>
                    </View>
                  ))}
                </View>
              </Section>
            ) : null}

            <Section title="Your gaps & the bridge">
              {detail.gaps.length === 0 ? (
                <Text style={{ fontSize: 15, lineHeight: 22, color: colors.green, fontWeight: '600' }}>
                  You already meet what this path asks for. Go for it.
                </Text>
              ) : (
                <View style={{ gap: spacing.md }}>
                  {detail.gaps.map((g, i) => (
                    <View
                      key={i}
                      style={{ backgroundColor: colors.gray050, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: 6 }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{g.label}</Text>
                      <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textMuted }}>{g.why}</Text>
                      <Text style={{ fontSize: 14, lineHeight: 20, color: colors.text }}>
                        <Text style={{ fontWeight: '700' }}>Bridge: </Text>
                        {g.howToClose}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Section>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 0.4, color: colors.textMuted, textTransform: 'uppercase' }}>
        {title}
      </Text>
      {children}
    </View>
  );
}
