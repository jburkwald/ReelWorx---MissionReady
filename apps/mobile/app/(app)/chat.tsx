import {
  STORY_OPENER,
  VOICE_AGENT,
  getStoryPhase,
  strengthTier,
  recordHeadline,
  recordComplete,
  SERVICE_BRANCHES,
  RANK_BANDS,
  YEARS_BANDS,
  SEPARATION_STATUSES,
  CLEARANCE_LEVELS,
  type Labeled,
  type ParsedResume,
  type StoryEntryMode,
  type StoryMessage,
  type StoryPhaseId,
  type VeteranRecord,
} from '@reelworx/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GhostButton } from '../../components/ui';
import { LocationPicker } from '../../components/LocationPicker';
import { colors, radius, spacing, spectrumColors } from '../../constants/theme';
import { useApi } from '../../lib/api';
import { useVoiceAgent } from '../../lib/useVoiceAgent';

interface StoryTurnResponse {
  reply: string;
  completeness: number;
  phase?: StoryPhaseId;
  foundationComplete?: boolean;
}
interface ResumeResponse {
  parsed: ParsedResume;
  completeness: number;
}

// The phased Story Profile conversation (Feature 1.2), layered over the existing agent.
// Shows Phase X of 3 + the registry strength meter (same number as 6.2). Three entry
// modes converge here: text, voice (the guide speaks and listens — HD via ElevenLabs when
// configured, device voice otherwise), and resume upload.
export default function StoryChat() {
  const router = useRouter();
  const api = useApi();
  const scrollRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = (params.mode as StoryEntryMode) ?? 'text';

  // Upload starts on a resume paste step; text + voice start on the tap-select record step.
  const [uploadOpen, setUploadOpen] = useState(mode === 'upload');
  const [recordOpen, setRecordOpen] = useState(mode !== 'upload');
  const [resumeText, setResumeText] = useState('');

  const [messages, setMessages] = useState<StoryMessage[]>([
    { role: 'assistant', content: mode === 'talk' ? VOICE_AGENT.spokenOpener : STORY_OPENER },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [strength, setStrength] = useState(0);
  const [phase, setPhase] = useState<StoryPhaseId>('record');

  // Voice: speak the questions, listen to the answers (HD via ElevenLabs when configured).
  // Text and voice both open on the record step, so the guide speaks the bridge once the
  // record is done (submitRecord), not at mount.
  const voice = useVoiceAgent();

  function submitRecord(rec: VeteranRecord) {
    const bridge =
      `Thanks. ${recordHeadline(rec)} is a strong start. A record can't show the why, though, ` +
      `and that's what companies remember. What part of the work felt most like you?`;
    setMessages([{ role: 'assistant', content: bridge }]);
    setPhase('story');
    setRecordOpen(false);
    // Persist the structured record (real mode); harmless no-op in the keyless demo.
    api.post('/record', { record: rec }).catch(() => {});
    if (mode === 'talk') voice.speak(bridge);
  }

  const phaseInfo = getStoryPhase(phase);
  const tier = strengthTier(strength);

  function toEnd() {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }

  async function submitResume(useSample: boolean) {
    setSending(true);
    try {
      const res = await api.post<ResumeResponse>('/resume', {
        text: useSample ? '' : resumeText,
      });
      setStrength(res.completeness);
      setPhase('story');
      setMessages([
        {
          role: 'assistant',
          content:
            `Got it — that gives me your record${res.parsed.headline ? `: ${res.parsed.headline}` : ''}. ` +
            `A resume can’t show the why, though, and that’s the part companies remember. ` +
            `What part of that work actually felt right to you?`,
        },
      ]);
      setUploadOpen(false);
    } catch {
      setMessages([
        {
          role: 'assistant',
          content:
            "I couldn’t read that resume just now. We can start by talking instead — what part of your service felt most like you?",
        },
      ]);
      setUploadOpen(false);
    } finally {
      setSending(false);
      toEnd();
    }
  }

  async function send(textArg?: string) {
    const text = (textArg ?? input).trim();
    if (!text || sending) return;
    const next: StoryMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setSending(true);
    toEnd();
    try {
      const res = await api.post<StoryTurnResponse>('/story', {
        messages: next,
        voice: mode === 'talk',
      });
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
      setStrength(res.completeness);
      if (res.phase) setPhase(res.phase);
      if (mode === 'talk') voice.speak(res.reply);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            "I'm having trouble reaching the guide right now. Your place is saved — try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
      toEnd();
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header: phase + strength meter */}
      <View
        style={{
          paddingTop: spacing.xxl,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <GhostButton label="‹ Back" onPress={() => router.back()} />
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
            Strength {strength}%{'  '}
            <Text style={{ color: colors.textMuted }}>· {tier.label}</Text>
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
            Phase {phaseInfo.index} of {phaseInfo.total} · {phaseInfo.title}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>
            {phaseInfo.required ? phaseInfo.timeEstimate : 'Optional'}
          </Text>
        </View>
        <View style={{ height: 8, borderRadius: radius.full, backgroundColor: colors.gray100, overflow: 'hidden' }}>
          <LinearGradient
            colors={spectrumColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${strength}%`, height: '100%', borderRadius: radius.full }}
          />
        </View>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>
          {phaseInfo.blurb} You can stop anytime — we save your place.
        </Text>
      </View>

      {uploadOpen ? (
        <ResumePaste
          value={resumeText}
          onChange={setResumeText}
          onParse={() => submitResume(false)}
          onSample={() => submitResume(true)}
          busy={sending}
        />
      ) : recordOpen ? (
        <RecordForm onDone={submitRecord} />
      ) : (
        <>
          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((m, i) => (
              <Bubble key={i} message={m} />
            ))}
            {mode === 'talk' ? (
              <View style={{ alignSelf: 'stretch', gap: 6 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    letterSpacing: 0.3,
                    color: voice.premium.provider ? colors.accent : colors.textMuted,
                  }}
                >
                  {voice.premium.provider ? 'HD VOICE · ELEVENLABS' : 'DEVICE VOICE'}
                </Text>
                {voice.supported.stt ? (
                  <Pressable
                    onPress={() =>
                      voice.listening ? voice.stopListening() : voice.listen((t) => send(t))
                    }
                    disabled={sending}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start' }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: radius.full,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: voice.listening ? colors.accent : colors.black,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 18 }}>{voice.listening ? '■' : '🎤'}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                      {voice.listening
                        ? 'Listening… tap to send'
                        : voice.speaking
                          ? 'Speaking…'
                          : 'Tap to answer out loud'}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>
                    Questions are read aloud. Type your answer below, or add the ElevenLabs key to
                    speak back.
                  </Text>
                )}
              </View>
            ) : null}
            {sending ? (
              <View style={{ alignSelf: 'flex-start', paddingVertical: 8 }}>
                <ActivityIndicator color={colors.gray400} />
              </View>
            ) : null}
          </ScrollView>

          {/* Input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: spacing.sm,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.sm,
              paddingBottom: spacing.xl,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <TextInput
              style={{
                flex: 1,
                maxHeight: 120,
                minHeight: 48,
                borderRadius: radius.lg,
                backgroundColor: colors.fieldBg,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 16,
                paddingTop: 13,
                fontSize: 16,
                color: colors.text,
              }}
              value={input}
              onChangeText={setInput}
              placeholder={mode === 'talk' ? 'Or type your answer…' : 'Type your answer…'}
              placeholderTextColor={colors.gray400}
              multiline
              editable={!sending}
            />
            <Pressable
              onPress={() => send()}
              disabled={!input.trim() || sending}
              style={({ pressed }) => [{ opacity: !input.trim() || sending ? 0.4 : pressed ? 0.9 : 1 }]}
            >
              <LinearGradient
                colors={spectrumColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 48,
                  paddingHorizontal: 20,
                  borderRadius: radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Send</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

function ResumePaste({
  value,
  onChange,
  onParse,
  onSample,
  busy,
}: {
  value: string;
  onChange: (s: string) => void;
  onParse: () => void;
  onSample: () => void;
  busy: boolean;
}) {
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Text style={{ fontSize: 15, lineHeight: 22, color: colors.text }}>
        Paste your resume and we’ll pull out your record so you can confirm it. The why comes
        next, in conversation.
      </Text>
      <TextInput
        style={{
          minHeight: 160,
          borderRadius: radius.lg,
          backgroundColor: colors.fieldBg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 14,
          fontSize: 15,
          color: colors.text,
          textAlignVertical: 'top',
        }}
        value={value}
        onChangeText={onChange}
        placeholder="Paste your resume here…"
        placeholderTextColor={colors.gray400}
        multiline
        editable={!busy}
      />
      <Pressable onPress={onParse} disabled={!value.trim() || busy}>
        <LinearGradient
          colors={spectrumColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: 52,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !value.trim() || busy ? 0.45 : 1,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {busy ? 'Reading…' : 'Pull out my record'}
          </Text>
        </LinearGradient>
      </Pressable>
      <Pressable onPress={onSample} disabled={busy} style={{ alignItems: 'center', paddingVertical: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted }}>
          Use a sample resume
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// Phase 1: the Veteran Door, captured by tap and select (Feature 1.1).
function RecordForm({ onDone }: { onDone: (r: VeteranRecord) => void }) {
  const [rec, setRec] = useState<VeteranRecord>({});
  const set = (patch: Partial<VeteranRecord>) => setRec((r) => ({ ...r, ...patch }));
  const ready = recordComplete(rec);
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <Text style={{ fontSize: 15, lineHeight: 22, color: colors.text }}>
        The basics of your service. Just tap to choose — this is the part a resume gets wrong,
        so we capture it cleanly.
      </Text>
      <ChipRow label="Branch" options={SERVICE_BRANCHES} value={rec.branch} onPick={(branch) => set({ branch })} />
      <ChipRow label="Where you served as" options={RANK_BANDS} value={rec.rankBand} onPick={(rankBand) => set({ rankBand })} />
      <ChipRow label="Time in service" options={YEARS_BANDS} value={rec.yearsBand} onPick={(yearsBand) => set({ yearsBand })} />
      <ChipRow label="Where you are now" options={SEPARATION_STATUSES} value={rec.separation} onPick={(separation) => set({ separation })} />
      <ChipRow label="Clearance (optional)" options={CLEARANCE_LEVELS} value={rec.clearance} onPick={(clearance) => set({ clearance })} />
      <View>
        <Text style={{ fontSize: 12.5, fontWeight: '800', letterSpacing: 0.3, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>
          Hometown (optional)
        </Text>
        {rec.hometown ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={{ fontSize: 20, color: colors.accent }}>★</Text>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.text }}>{rec.hometown}</Text>
            <Pressable onPress={() => set({ hometown: undefined })} hitSlop={8}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.accent }}>Change</Text>
            </Pressable>
          </View>
        ) : (
          <LocationPicker placeholder="e.g. Columbus, OH" onPick={(ref) => set({ hometown: ref.label })} />
        )}
      </View>
      <Pressable onPress={() => onDone(rec)} disabled={!ready}>
        <LinearGradient
          colors={spectrumColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 52, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', opacity: ready ? 1 : 0.45 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {ready ? 'Next: your story' : 'Pick branch, rank, and status'}
          </Text>
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}

function ChipRow<T extends string>({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: Labeled<T>[];
  value: T | undefined;
  onPick: (id: T) => void;
}) {
  return (
    <View>
      <Text style={{ fontSize: 12.5, fontWeight: '800', letterSpacing: 0.3, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => {
          const sel = value === o.id;
          return (
            <Pressable
              key={o.id}
              onPress={() => onPick(o.id)}
              style={{
                paddingVertical: 9,
                paddingHorizontal: 14,
                borderRadius: radius.full,
                borderWidth: 1,
                backgroundColor: sel ? colors.black : colors.bg,
                borderColor: sel ? colors.black : colors.border,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: sel ? '#fff' : colors.text }}>
                {o.label}
                {o.hint ? `  ${o.hint}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Bubble({ message }: { message: StoryMessage }) {
  const isUser = message.role === 'user';
  return (
    <View
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '86%',
        backgroundColor: isUser ? colors.black : colors.gray050,
        borderWidth: isUser ? 0 : 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        paddingVertical: 12,
        paddingHorizontal: 16,
      }}
    >
      <Text style={{ fontSize: 16, lineHeight: 23, color: isUser ? '#fff' : colors.text }}>
        {message.content}
      </Text>
    </View>
  );
}
