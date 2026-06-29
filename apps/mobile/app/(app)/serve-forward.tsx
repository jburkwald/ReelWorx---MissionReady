import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Share, Text, View } from 'react-native';
import { Body, GhostButton, Heading, PrimaryButton, Screen } from '../../components/ui';
import { colors, radius, spacing } from '../../constants/theme';
import { useApi } from '../../lib/api';

interface Impact {
  shares: number;
  clicks: number;
}

// Serve Forward (Features 4.1/4.2). Keep serving by pulling the next one through. The
// framing is service, never commission — the only number we show is people helped.
export default function ServeForward() {
  const router = useRouter();
  const api = useApi();
  const [impact, setImpact] = useState<Impact>({ shares: 0, clicks: 0 });
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  async function loadImpact() {
    try {
      const r = await api.get<Impact>('/share');
      setImpact(r);
    } catch {
      /* leave at zero */
    }
  }

  useEffect(() => {
    let active = true;
    api
      .get<Impact>('/share')
      .then((r) => {
        if (active) setImpact(r);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api]);

  async function shareForward() {
    setSharing(true);
    try {
      const { shareUrl } = await api.post<{ shareUrl: string }>('/share', {});
      await Share.share({
        message:
          'I’m on ReelWorx MissionReady — it helps people leaving the service get seen for who ' +
          `they actually became, not a résumé. Take a look: ${shareUrl}`,
      });
      await loadImpact();
    } catch {
      /* user may have dismissed the sheet — no-op */
    } finally {
      setSharing(false);
    }
  }

  return (
    <Screen>
      <View style={{ flex: 1, paddingVertical: spacing.lg, gap: spacing.xl }}>
        <GhostButton label="‹ Back" onPress={() => router.back()} />

        <View style={{ gap: 8 }}>
          <Heading>Keep serving.</Heading>
          <Body muted>
            The fastest way the next person finds their footing is someone who’s been there
            sending them here. Share your link — it takes one tap.
          </Body>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.gray400} />
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Stat label="Times shared" value={impact.shares} />
            <Stat label="People who looked" value={impact.clicks} />
          </View>
        )}

        <View style={{ gap: spacing.sm }}>
          <PrimaryButton label="Share MissionReady" onPress={shareForward} loading={sharing} />
          <Text style={{ textAlign: 'center', fontSize: 13, color: colors.textMuted }}>
            No commission. Just a hand back for the next one through.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.gray050, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg }}>
      <Text style={{ fontSize: 30, fontWeight: '800', color: colors.text }}>{value}</Text>
      <Text style={{ marginTop: 4, fontSize: 13, color: colors.textMuted }}>{label}</Text>
    </View>
  );
}
