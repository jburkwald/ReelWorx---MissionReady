import { useAuth, useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  Body,
  GhostButton,
  Heading,
  PrimaryButton,
  Screen,
  Wordmark,
} from '../../components/ui';
import { colors, radius, spacing, spectrumColors } from '../../constants/theme';
import { useApi, type MeResponse } from '../../lib/api';

// Candidate home (Marcus). Calm by default; the only Wrapped touch is the profile
// strength meter — competence made visible (SDT), framed as growth, never deficiency.
// The actual Story Profile build flow lands in the next phase.
export default function Home() {
  const { user } = useUser();
  const { signOut } = useAuth();

  const api = useApi();
  const router = useRouter();

  const firstName =
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ??
    'there';

  // Provision the candidate (User + Profile) on first launch and reflect their real
  // completeness. Falls back to a gentle placeholder if the backend isn't reachable.
  const [profileStrength, setProfileStrength] = useState(8);
  const [inviteCount, setInviteCount] = useState(0);
  useEffect(() => {
    let active = true;
    api
      .get<MeResponse>('/me')
      .then((r) => {
        if (active && r.user.profile) {
          setProfileStrength(r.user.profile.completenessScore);
        }
      })
      .catch(() => {
        /* backend not reachable yet — keep the placeholder */
      });
    // Who's reaching out — being pursued is a moment worth surfacing up top.
    api
      .get<{ invites: { matchId: string }[] }>('/invites')
      .then((r) => {
        if (active) setInviteCount(r.invites.length);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [api]);

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

        {/* Being pursued is a genuine milestone — surface it loud, up top. */}
        {inviteCount > 0 ? (
          <Pressable
            onPress={() => router.push('/(app)/invites')}
            style={({ pressed }) => [{ borderRadius: radius.lg, overflow: 'hidden', opacity: pressed ? 0.92 : 1 }]}
          >
            <LinearGradient
              colors={spectrumColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: spacing.lg }}
            >
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>
                {inviteCount === 1
                  ? 'A company wants to connect with you'
                  : `${inviteCount} companies want to connect with you`}
              </Text>
              <Text style={{ marginTop: 4, fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
                Tap to see who reached out ›
              </Text>
            </LinearGradient>
          </Pressable>
        ) : null}

        {/* Profile strength meter — the calm Wrapped moment; taps into the full view (6.2). */}
        <Pressable
          onPress={() => router.push('/(app)/progress')}
          style={({ pressed }) => [
            {
              backgroundColor: colors.gray050,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.lg,
              gap: spacing.md,
              opacity: pressed ? 0.92 : 1,
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
          <Text style={{ fontSize: 13, color: colors.textMuted }}>
            Every step makes it stronger — tap to see your momentum ›
          </Text>
        </Pressable>

        <View style={{ gap: spacing.md }}>
          <PrimaryButton
            label="Build your Story Profile"
            onPress={() => router.push('/(app)/story')}
          />
          <Text
            style={{
              textAlign: 'center',
              fontSize: 13,
              color: colors.textMuted,
            }}
          >
            Talk it through, upload a résumé, or text — your choice.
          </Text>
        </View>

        {/* Optional deeper step — earns a real strength jump (Feature 1.5). */}
        <Pressable
          onPress={() => router.push('/(app)/assessment')}
          style={({ pressed }) => [
            {
              backgroundColor: colors.gray050,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.lg,
              padding: spacing.lg,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
              Take the Full Spectrum read
            </Text>
            <Text style={{ fontSize: 22, color: colors.textMuted }}>›</Text>
          </View>
          <Text style={{ marginTop: 4, fontSize: 14, color: colors.textMuted }}>
            Optional — a deeper read on who you are. It gives your strength a real boost.
          </Text>
        </Pressable>

        {/* Intro video — the first thing that shows you're a person, not a résumé (1.4). */}
        <Pressable
          onPress={() => router.push('/(app)/intro-video')}
          style={({ pressed }) => [
            {
              backgroundColor: colors.gray050,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.lg,
              padding: spacing.lg,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
              Record your 60-second intro
            </Text>
            <Text style={{ fontSize: 22, color: colors.textMuted }}>›</Text>
          </View>
          <Text style={{ marginTop: 4, fontSize: 14, color: colors.textMuted }}>
            A short, forward-looking hello. We give you a script — one take is plenty.
          </Text>
        </Pressable>

        {/* Roots — "Come Home": let companies in your region find you (3.3). */}
        <Pressable
          onPress={() => router.push('/(app)/roots')}
          style={({ pressed }) => [
            {
              backgroundColor: colors.gray050,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.lg,
              padding: spacing.lg,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
              Set your roots
            </Text>
            <Text style={{ fontSize: 22, color: colors.textMuted }}>›</Text>
          </View>
          <Text style={{ marginTop: 4, fontSize: 14, color: colors.textMuted }}>
            Where you’re tied to — so companies can bring you home after service.
          </Text>
        </Pressable>

        {/* Path Discovery — the hero feature: directions you never pictured (2.1). */}
        <Pressable
          onPress={() => router.push('/(app)/paths')}
          style={({ pressed }) => [
            {
              borderRadius: radius.lg,
              overflow: 'hidden',
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <LinearGradient
            colors={spectrumColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: spacing.lg }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff' }}>
                Discover your paths
              </Text>
              <Text style={{ fontSize: 22, color: '#fff' }}>›</Text>
            </View>
            <Text style={{ marginTop: 4, fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
              Careers you might never have pictured — built from who you actually are.
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Candidate Fit Read — companies that suit you, with a reason (2.2). */}
        <Pressable
          onPress={() => router.push('/(app)/fit')}
          style={({ pressed }) => [
            {
              backgroundColor: colors.gray050,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.lg,
              padding: spacing.lg,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
              See companies that fit you
            </Text>
            <Text style={{ fontSize: 22, color: colors.textMuted }}>›</Text>
          </View>
          <Text style={{ marginTop: 4, fontSize: 14, color: colors.textMuted }}>
            Read against who you are, with a plain reason for each. Not keyword matches.
          </Text>
        </Pressable>

        {/* Living Profile — add chapters as you grow (1.6). */}
        <Pressable
          onPress={() => router.push('/(app)/chapters')}
          style={({ pressed }) => [
            {
              backgroundColor: colors.gray050,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.lg,
              padding: spacing.lg,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
              Add to your living profile
            </Text>
            <Text style={{ fontSize: 22, color: colors.textMuted }}>›</Text>
          </View>
          <Text style={{ marginTop: 4, fontSize: 14, color: colors.textMuted }}>
            Your story keeps growing. Add a chapter whenever something changes.
          </Text>
        </Pressable>

        {/* Serve Forward — keep serving by pulling the next one through (4.1/4.2). */}
        <Pressable
          onPress={() => router.push('/(app)/serve-forward')}
          style={({ pressed }) => [
            {
              backgroundColor: colors.gray050,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: radius.lg,
              padding: spacing.lg,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
              Serve forward
            </Text>
            <Text style={{ fontSize: 22, color: colors.textMuted }}>›</Text>
          </View>
          <Text style={{ marginTop: 4, fontSize: 14, color: colors.textMuted }}>
            Help the next person through — share NextMission in one tap.
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
