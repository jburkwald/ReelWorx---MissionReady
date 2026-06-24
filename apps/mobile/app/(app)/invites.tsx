import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Body, GhostButton, Heading, Screen } from '../../components/ui';
import { colors, radius, spacing, spectrumColors } from '../../constants/theme';
import { useApi } from '../../lib/api';

// Mirrors shared/server InviteView — kept local so the mobile bundle stays server-free.
interface InviteView {
  matchId: string;
  organizationName: string;
  roleTitle: string | null;
  createdAt: string;
}

// "A company is reaching out to YOU." Being pursued is the emotional core of the token
// model for Dana — so this screen leans warm and affirming, not transactional.
export default function Invites() {
  const router = useRouter();
  const api = useApi();
  const [invites, setInvites] = useState<InviteView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<{ invites: InviteView[] }>('/invites')
      .then((r) => {
        if (active) setInvites(r.invites);
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
          <Heading>Someone’s interested.</Heading>
          <Body muted>
            These companies saw who you are and chose to reach out. Reaching out costs them
            something here — so when it happens, it’s real.
          </Body>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.gray400} style={{ marginTop: spacing.xl }} />
        ) : invites.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.gray050,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.lg,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
              No invitations yet
            </Text>
            <Text style={{ marginTop: 4, fontSize: 14, color: colors.textMuted }}>
              Keep building your profile — a stronger story is what gets companies to reach out.
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {invites.map((inv) => (
              <LinearGradient
                key={inv.matchId}
                colors={spectrumColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: radius.lg, padding: 2 }}
              >
                <View style={{ backgroundColor: colors.bg, borderRadius: radius.lg - 2, padding: spacing.lg }}>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: colors.text }}>
                    {inv.organizationName}
                  </Text>
                  <Text style={{ marginTop: 4, fontSize: 15, color: colors.textMuted }}>
                    {inv.roleTitle ? `wants to connect about ${inv.roleTitle}` : 'wants to connect with you'}
                  </Text>
                </View>
              </LinearGradient>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
