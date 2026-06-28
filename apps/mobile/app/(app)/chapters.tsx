import { LIVING_CHAPTER_PROMPTS, type LivingChapter } from '@reelworx/shared';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Body, GhostButton, Heading, Screen } from '../../components/ui';
import { colors, radius, spacing, spectrumColors } from '../../constants/theme';
import { useApi } from '../../lib/api';

// The Living Profile (Feature 1.6): the candidate adds chapters over time. Append-only.
export default function Chapters() {
  const router = useRouter();
  const api = useApi();
  const [chapters, setChapters] = useState<LivingChapter[] | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get<{ chapters: LivingChapter[] }>('/chapters')
      .then((d) => {
        if (active) setChapters(d.chapters);
      })
      .catch(() => {
        if (active) setChapters([]);
      });
    return () => {
      active = false;
    };
  }, [api]);

  const prompt = LIVING_CHAPTER_PROMPTS[(chapters?.length ?? 0) % LIVING_CHAPTER_PROMPTS.length];

  async function add() {
    if ((!title.trim() && !body.trim()) || busy) return;
    setBusy(true);
    try {
      const res = await api.post<{ chapters: LivingChapter[] }>('/chapters', { title, body });
      setChapters(res.chapters);
      setTitle('');
      setBody('');
    } catch {
      /* keep the draft so nothing is lost */
    } finally {
      setBusy(false);
    }
  }

  function when(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: spacing.lg, gap: spacing.xl }}
      >
        <GhostButton label="‹ Back" onPress={() => router.back()} />

        <View style={{ gap: 8 }}>
          <Heading>Your story keeps growing.</Heading>
          <Body muted>
            Not frozen at sign-up. Add a chapter whenever something changes, and your profile
            becomes a career narrative, not a snapshot.
          </Body>
        </View>

        <View style={{ gap: spacing.sm, backgroundColor: colors.gray050, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg }}>
          <Text style={{ fontSize: 12.5, fontWeight: '800', letterSpacing: 0.3, color: colors.textMuted, textTransform: 'uppercase' }}>
            Add a chapter
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give it a title"
            placeholderTextColor={colors.gray400}
            style={{ height: 46, borderRadius: radius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, fontSize: 15, color: colors.text }}
          />
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={prompt}
            placeholderTextColor={colors.gray400}
            multiline
            style={{ minHeight: 84, borderRadius: radius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 15, color: colors.text, textAlignVertical: 'top' }}
          />
          <Pressable onPress={add} disabled={(!title.trim() && !body.trim()) || busy}>
            <LinearGradient
              colors={spectrumColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', opacity: (!title.trim() && !body.trim()) || busy ? 0.45 : 1 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {busy ? 'Saving…' : 'Add this chapter'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {chapters === null ? (
          <ActivityIndicator color={colors.gray400} />
        ) : (
          <View style={{ gap: spacing.md }}>
            {chapters.map((c) => (
              <View key={c.id} style={{ borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text, flex: 1 }}>{c.title}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>{when(c.at)}</Text>
                </View>
                {c.body ? (
                  <Text style={{ fontSize: 14.5, lineHeight: 21, color: colors.textMuted, marginTop: 6 }}>{c.body}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
