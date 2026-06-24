import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Body, GhostButton, Heading, PrimaryButton, Screen } from '../../components/ui';
import { colors, radius, spacing, spectrumColors } from '../../constants/theme';
import { useApi } from '../../lib/api';

// Serializable view of one path (mirrors shared/server PathView — kept local so the mobile
// bundle never imports server-only code, same pattern as MeResponse).
interface PathView {
  id: string;
  pathKey: string;
  title: string;
  reasoning: string | null;
  fitScore: number | null;
  status: 'suggested' | 'saved';
}

// Path Discovery (Feature 2.1, the hero feature). For Marcus, who doesn't yet know who he
// becomes next — careers he may never have pictured, each with the why, and a "no" that
// visibly sharpens the next. This is a moment of possibility, so the Wrapped energy is
// welcome here (unlike the calm-by-default rest of the app).
export default function Paths() {
  const router = useRouter();
  const api = useApi();

  const [paths, setPaths] = useState<PathView[]>([]);
  const [phase, setPhase] = useState<'loading' | 'ready'>('loading');
  const [discovering, setDiscovering] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<{ paths: PathView[] }>('/paths')
      .then((r) => {
        if (active) setPaths(r.paths);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setPhase('ready');
      });
    return () => {
      active = false;
    };
  }, [api]);

  async function discover() {
    setDiscovering(true);
    try {
      const r = await api.post<{ paths: PathView[] }>('/paths', { action: 'discover' });
      setPaths(r.paths);
    } catch {
      Alert.alert('One sec', 'Couldn’t reach the discovery engine just now — try again in a moment.');
    } finally {
      setDiscovering(false);
    }
  }

  async function decide(id: string, decision: 'saved' | 'rejected') {
    setDecidingId(id);
    try {
      const r = await api.post<{ paths: PathView[] }>('/paths', { action: 'decide', id, decision });
      setPaths(r.paths);
    } catch {
      Alert.alert('One sec', 'Couldn’t save that just now — try again.');
    } finally {
      setDecidingId(null);
    }
  }

  function openDetail(p: PathView) {
    router.push({ pathname: '/(app)/path/[id]', params: { id: p.id, title: p.title } });
  }

  const saved = paths.filter((p) => p.status === 'saved');
  const open = paths.filter((p) => p.status === 'suggested');

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: spacing.lg, gap: spacing.xl }}
      >
        <GhostButton label="‹ Back" onPress={() => router.back()} />

        <View style={{ gap: 8 }}>
          <Heading>Paths you might never have pictured.</Heading>
          <Body muted>
            Built from who you actually are — not just the civilian name for your old job.
            Save the ones that spark something. Saying “not for me” makes the next one sharper.
          </Body>
        </View>

        {phase === 'loading' ? (
          <ActivityIndicator color={colors.gray400} style={{ marginTop: spacing.xl }} />
        ) : paths.length === 0 ? (
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            <PrimaryButton
              label="Discover my paths"
              onPress={discover}
              loading={discovering}
            />
            <Text style={{ textAlign: 'center', fontSize: 13, color: colors.textMuted }}>
              We’ll read your story and surface a few directions to explore.
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.lg }}>
            {saved.length > 0 ? (
              <View style={{ gap: spacing.md }}>
                <SectionLabel>Saved</SectionLabel>
                {saved.map((p) => (
                  <PathCard key={p.id} path={p} deciding={decidingId === p.id} onDecide={decide} onOpen={openDetail} />
                ))}
              </View>
            ) : null}

            <View style={{ gap: spacing.md }}>
              {saved.length > 0 ? <SectionLabel>Worth exploring</SectionLabel> : null}
              {open.map((p) => (
                <PathCard key={p.id} path={p} deciding={decidingId === p.id} onDecide={decide} onOpen={openDetail} />
              ))}
            </View>

            <PrimaryButton label="Show me more paths" onPress={discover} loading={discovering} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 0.4, color: colors.textMuted, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

function PathCard({
  path,
  deciding,
  onDecide,
  onOpen,
}: {
  path: PathView;
  deciding: boolean;
  onDecide: (id: string, decision: 'saved' | 'rejected') => void;
  onOpen: (path: PathView) => void;
}) {
  const isSaved = path.status === 'saved';
  const strong = (path.fitScore ?? 0) >= 80;
  return (
    <View
      style={{
        backgroundColor: colors.gray050,
        borderWidth: 1,
        borderColor: isSaved ? colors.green : colors.border,
        borderRadius: radius.lg,
        padding: spacing.lg,
        gap: spacing.md,
        opacity: deciding ? 0.6 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md }}>
        <Text style={{ flex: 1, fontSize: 19, fontWeight: '800', color: colors.text }}>{path.title}</Text>
        {path.fitScore !== null ? (
          strong ? (
            <LinearGradient
              colors={spectrumColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingHorizontal: 10, height: 26, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>{path.fitScore}</Text>
            </LinearGradient>
          ) : (
            <View style={{ paddingHorizontal: 10, height: 26, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted }}>{path.fitScore}</Text>
            </View>
          )
        ) : null}
      </View>

      {path.reasoning ? (
        <Text style={{ fontSize: 15, lineHeight: 22, color: colors.text }}>{path.reasoning}</Text>
      ) : null}

      <Pressable onPress={() => onOpen(path)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.accent }}>
          What it involves & my gaps ›
        </Text>
      </Pressable>

      {isSaved ? (
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.green }}>★ Saved</Text>
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable
            onPress={() => onDecide(path.id, 'saved')}
            disabled={deciding}
            style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={{ height: 46, borderRadius: radius.full, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Save this</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => onDecide(path.id, 'rejected')}
            disabled={deciding}
            style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={{ height: 46, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textMuted }}>Not for me</Text>
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}
