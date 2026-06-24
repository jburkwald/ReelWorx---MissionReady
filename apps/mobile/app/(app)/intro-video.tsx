import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Body, GhostButton, Heading, PrimaryButton, Screen } from '../../components/ui';
import { colors, radius, spacing, spectrumColors } from '../../constants/theme';
import { useApi, type MeResponse } from '../../lib/api';

type Phase = 'prep' | 'preview' | 'uploading' | 'done';

interface CompleteResult {
  status: 'ready' | 'processing';
  completeness: number;
  posterUrl: string | null;
  hlsUrl: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The three beats of a good intro — a script to follow so the fear of the blank screen
// never wins (Feature 1.4: "a script and an example, so that I actually finish").
const SCRIPT = [
  ['Who you are', 'Name, where you served, one line on what that made you.'],
  ['What you carried', 'A moment that shows it — leading, fixing, holding a line.'],
  ['What’s next', 'The kind of work you’re genuinely excited to go after now.'],
];

// The Intro Video (Feature 1.4). Calm, guided, low-stakes — one take is fine, retake all
// you want. Finishing it lights up the intro-video slice of profile strength.
export default function IntroVideo() {
  const router = useRouter();
  const api = useApi();

  const [phase, setPhase] = useState<Phase>('prep');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [prior, setPrior] = useState(0);
  const [result, setResult] = useState<CompleteResult | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<MeResponse>('/me')
      .then((r) => {
        if (active && r.user.profile) setPrior(r.user.profile.completenessScore);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [api]);

  // expo-video player for preview (local file) and, once uploaded, the processed stream.
  const playbackUri = phase === 'done' ? result?.hlsUrl ?? null : videoUri;
  const player = useVideoPlayer(playbackUri, (p) => {
    p.loop = true;
  });

  async function record() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera needed', 'Allow camera access to record your intro video.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 90,
      quality: 1,
    });
    if (!res.canceled && res.assets[0]) {
      setVideoUri(res.assets[0].uri);
      setPhase('preview');
    }
  }

  async function pickFromLibrary() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
    });
    if (!res.canceled && res.assets[0]) {
      setVideoUri(res.assets[0].uri);
      setPhase('preview');
    }
  }

  async function upload() {
    if (!videoUri) return;
    setPhase('uploading');
    try {
      const { uploadId, uploadUrl } = await api.post<{ uploadId: string; uploadUrl: string }>(
        '/intro-video',
        { step: 'create' },
      );

      // Push the bytes straight to the storage provider — never through our server.
      const fileBlob = await (await fetch(videoUri)).blob();
      const put = await fetch(uploadUrl, { method: 'PUT', body: fileBlob });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      // The asset id can lag a beat behind the upload; retry the finalize a few times.
      let res: CompleteResult | null = null;
      for (let i = 0; i < 6; i++) {
        res = await api.post<CompleteResult>('/intro-video', { step: 'complete', uploadId });
        if (res.status === 'ready' || res.posterUrl || res.hlsUrl || res.completeness > prior) {
          break;
        }
        await sleep(2000);
      }
      setResult(res);
      setPhase('done');
    } catch {
      Alert.alert('Upload hiccup', 'That didn’t go through — your recording is still here. Try again.');
      setPhase('preview');
    }
  }

  if (phase === 'done' && result) {
    const delta = Math.max(0, result.completeness - prior);
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xl }}>
          <View style={{ gap: spacing.sm }}>
            <Heading>{delta >= 15 ? 'That’s the hard part, done.' : 'Nice — it’s in.'}</Heading>
            <Body muted>
              Your intro is the first thing that shows you’re a person, not a résumé.
              {result.status === 'processing'
                ? ' We’re processing it now — it’ll be ready to share shortly.'
                : ' It’s ready to share.'}
            </Body>
          </View>

          {result.hlsUrl ? (
            <VideoView
              player={player}
              nativeControls
              style={{ width: '100%', aspectRatio: 9 / 16, maxHeight: 320, borderRadius: radius.lg, backgroundColor: colors.black }}
            />
          ) : null}

          <StrengthReveal prior={prior} strength={result.completeness} />
          <PrimaryButton label="Back to profile" onPress={() => router.replace('/(app)')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: spacing.lg, gap: spacing.xl }}
      >
        <GhostButton label="‹ Back" onPress={() => router.back()} />

        <View style={{ gap: 8 }}>
          <Heading>Your 60-second intro.</Heading>
          <Body muted>
            Look ahead, not back: who you are and what you’re excited to go do next. One
            take is plenty, and you can retake as many times as you want.
          </Body>
        </View>

        {phase === 'preview' && videoUri ? (
          <>
            <VideoView
              player={player}
              nativeControls
              style={{ width: '100%', aspectRatio: 9 / 16, maxHeight: 360, borderRadius: radius.lg, backgroundColor: colors.black }}
            />
            <View style={{ gap: spacing.sm }}>
              <PrimaryButton label="Use this video" onPress={upload} />
              <GhostButton label="Retake" onPress={() => setPhase('prep')} />
            </View>
          </>
        ) : phase === 'uploading' ? (
          <View style={{ paddingVertical: spacing.xl, gap: spacing.md, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
              Sending your intro…
            </Text>
            <Body muted>Hang tight — this only takes a moment.</Body>
          </View>
        ) : (
          <>
            {/* The script — three small beats, so the blank screen never wins. */}
            <View
              style={{
                backgroundColor: colors.gray050,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.lg,
                gap: spacing.md,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 0.4, color: colors.textMuted, textTransform: 'uppercase' }}>
                A simple script
              </Text>
              {SCRIPT.map(([title, hint], i) => (
                <View key={title} style={{ flexDirection: 'row', gap: spacing.md }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.accent, width: 18 }}>
                    {i + 1}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{title}</Text>
                    <Text style={{ marginTop: 2, fontSize: 14, lineHeight: 20, color: colors.textMuted }}>
                      {hint}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={{ gap: spacing.sm }}>
              <PrimaryButton label="Record my intro" onPress={record} />
              <Pressable
                onPress={pickFromLibrary}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, alignItems: 'center', paddingVertical: 12 }]}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                  Choose a video instead
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

// The earned jump, shared shape with the assessment reveal — competence made visible (SDT).
function StrengthReveal({ prior, strength }: { prior: number; strength: number }) {
  const delta = Math.max(0, strength - prior);
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>Profile strength</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <Text style={{ fontSize: 44, fontWeight: '800', color: colors.text, lineHeight: 46 }}>
            {strength}%
          </Text>
          {delta > 0 ? (
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.green, marginBottom: 8 }}>
              +{delta}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ height: 12, borderRadius: radius.full, backgroundColor: colors.gray100, overflow: 'hidden' }}>
        <LinearGradient
          colors={spectrumColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${strength}%`, height: '100%', borderRadius: radius.full }}
        />
      </View>
    </View>
  );
}
