import {
  ASSESSMENT_DIMENSION_LABELS,
  ASSESSMENT_ITEMS,
  ASSESSMENT_ITEM_COUNT,
  LIKERT_LABELS,
  type AssessmentDimension,
  type AssessmentResponses,
  type LikertValue,
} from '@reelworx/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Body, GhostButton, Heading, PrimaryButton, Screen } from '../../components/ui';
import { colors, radius, spacing, spectrumColors } from '../../constants/theme';
import { useApi, type MeResponse } from '../../lib/api';

const SECTIONS: AssessmentDimension[] = [
  'personality',
  'resilienceDrive',
  'emotionalIntelligence',
];

interface AssessmentResult {
  completeness: number;
}

// The Full Spectrum Assessment (Feature 1.5). Optional and self-paced; finishing it gives
// the profile-strength meter a real, earned jump — the one place we let Wrapped energy
// fire (a genuine milestone), calm everywhere else.
export default function Assessment() {
  const router = useRouter();
  const api = useApi();

  const [responses, setResponses] = useState<AssessmentResponses>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [priorStrength, setPriorStrength] = useState(0);
  const [result, setResult] = useState<number | null>(null);

  // Know where strength stood before, so the reveal can show the actual jump.
  useEffect(() => {
    let active = true;
    api
      .get<MeResponse>('/me')
      .then((r) => {
        if (active && r.user.profile) setPriorStrength(r.user.profile.completenessScore);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [api]);

  const answered = Object.keys(responses).length;
  const allAnswered = answered === ASSESSMENT_ITEM_COUNT;
  const progress = Math.round((answered / ASSESSMENT_ITEM_COUNT) * 100);

  function setAnswer(itemId: string, value: LikertValue) {
    setResponses((r) => ({ ...r, [itemId]: value }));
  }

  async function submit() {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    setError(false);
    try {
      const res = await api.post<AssessmentResult>('/assessment', { responses });
      setResult(res.completeness);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (result !== null) {
    return <ResultView prior={priorStrength} strength={result} onDone={() => router.replace('/(app)')} />;
  }

  return (
    <Screen>
      {/* Sticky-feel header with live progress (goal-gradient: the remaining steps stay visible). */}
      <View style={{ paddingTop: spacing.md, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <GhostButton label="‹ Back" onPress={() => router.back()} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
            {answered} of {ASSESSMENT_ITEM_COUNT}
          </Text>
        </View>
        <View style={{ height: 8, borderRadius: radius.full, backgroundColor: colors.gray100, overflow: 'hidden' }}>
          <LinearGradient
            colors={spectrumColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${progress}%`, height: '100%', borderRadius: radius.full }}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl }}
      >
        <View style={{ gap: 8 }}>
          <Heading>The whole-person read.</Heading>
          <Body muted>
            No right answers — just you. There’s no rush, and you can stop anytime. Finishing
            it gives your profile strength a real boost.
          </Body>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
            1 = {LIKERT_LABELS[0]}   ·   5 = {LIKERT_LABELS[4]}
          </Text>
        </View>

        {SECTIONS.map((dim) => (
          <View key={dim} style={{ gap: spacing.md }}>
            <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 0.4, color: colors.textMuted, textTransform: 'uppercase' }}>
              {ASSESSMENT_DIMENSION_LABELS[dim]}
            </Text>
            {ASSESSMENT_ITEMS.filter((it) => it.dimension === dim).map((it) => (
              <Item
                key={it.id}
                statement={it.statement}
                value={responses[it.id]}
                onSelect={(v) => setAnswer(it.id, v)}
              />
            ))}
          </View>
        ))}

        {error ? (
          <Text style={{ color: colors.red, fontSize: 14, textAlign: 'center' }}>
            Couldn’t save just now — your answers are still here. Try again.
          </Text>
        ) : null}

        <View style={{ gap: spacing.sm }}>
          <PrimaryButton
            label={allAnswered ? 'See my result' : `Answer all ${ASSESSMENT_ITEM_COUNT} to finish`}
            onPress={submit}
            disabled={!allAnswered}
            loading={submitting}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Item({
  statement,
  value,
  onSelect,
}: {
  statement: string;
  value?: LikertValue;
  onSelect: (v: LikertValue) => void;
}) {
  return (
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
      <Text style={{ fontSize: 16, lineHeight: 22, color: colors.text }}>{statement}</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {([1, 2, 3, 4, 5] as LikertValue[]).map((v) => {
          const selected = value === v;
          return (
            <Pressable
              key={v}
              onPress={() => onSelect(v)}
              style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.85 : 1 }]}
            >
              {selected ? (
                <LinearGradient
                  colors={spectrumColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{v}</Text>
                </LinearGradient>
              ) : (
                <View
                  style={{
                    height: 44,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textMuted }}>{v}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// The earned celebration: the candidate sees their profile strength actually jump.
function ResultView({
  prior,
  strength,
  onDone,
}: {
  prior: number;
  strength: number;
  onDone: () => void;
}) {
  const delta = Math.max(0, strength - prior);
  const headline = useMemo(
    () => (delta >= 15 ? 'Big jump.' : delta > 0 ? 'Nice work.' : 'All set.'),
    [delta],
  );
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xl }}>
        <View style={{ gap: spacing.sm }}>
          <Heading>{headline}</Heading>
          <Body muted>
            Your Full Spectrum read is in — that’s the part a hiring manager can’t get from a
            résumé. It just made your profile noticeably stronger.
          </Body>
        </View>

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

        <PrimaryButton label="Back to profile" onPress={onDone} />
      </View>
    </Screen>
  );
}
