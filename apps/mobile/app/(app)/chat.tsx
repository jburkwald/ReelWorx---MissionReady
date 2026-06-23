import { STORY_OPENER, type StoryMessage } from '@reelworx/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
import { colors, radius, spacing, spectrumColors } from '../../constants/theme';
import { useApi } from '../../lib/api';

interface StoryTurnResponse {
  reply: string;
  completeness: number;
}

// The text Story Profile conversation (Feature 1.2). Calm Apple structure; the one
// Wrapped touch is the spectrum strength meter that climbs as the story takes shape.
export default function StoryChat() {
  const router = useRouter();
  const api = useApi();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<StoryMessage[]>([
    { role: 'assistant', content: STORY_OPENER },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [strength, setStrength] = useState(0);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    const next: StoryMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setSending(true);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

    try {
      const res = await api.post<StoryTurnResponse>('/story', { messages: next });
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
      setStrength(res.completeness);
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
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header + strength meter */}
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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <GhostButton label="‹ Back" onPress={() => router.back()} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
            Profile strength {strength}%
          </Text>
        </View>
        <View
          style={{
            height: 8,
            borderRadius: radius.full,
            backgroundColor: colors.gray100,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={spectrumColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${strength}%`, height: '100%', borderRadius: radius.full }}
          />
        </View>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>
          Take your time. You can stop anytime — we save your place.
        </Text>
      </View>

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
          placeholder="Type your answer…"
          placeholderTextColor={colors.gray400}
          multiline
          editable={!sending}
        />
        <Pressable
          onPress={send}
          disabled={!input.trim() || sending}
          style={({ pressed }) => [
            { opacity: !input.trim() || sending ? 0.4 : pressed ? 0.9 : 1 },
          ]}
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
    </KeyboardAvoidingView>
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
      <Text
        style={{
          fontSize: 16,
          lineHeight: 23,
          color: isUser ? '#fff' : colors.text,
        }}
      >
        {message.content}
      </Text>
    </View>
  );
}
