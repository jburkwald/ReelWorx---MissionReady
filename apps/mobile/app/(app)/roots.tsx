import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Body, GhostButton, Heading, PrimaryButton, Screen } from '../../components/ui';
import { colors, radius, spacing } from '../../constants/theme';
import { useApi } from '../../lib/api';

interface Root {
  place: string;
  isPrimary: boolean;
}

// Roots editor — "Come Home" (Feature 3.3). The places Marcus has ties to, with one primary
// hometown, so a company searching his region can actually find him. Calm and simple: this
// is housekeeping, not a moment, so no Wrapped energy here.
export default function Roots() {
  const router = useRouter();
  const api = useApi();

  const [roots, setRoots] = useState<Root[]>([]);
  const [newPlace, setNewPlace] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get<{ roots: Root[] }>('/roots')
      .then((r) => {
        if (active) setRoots(r.roots);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api]);

  function add() {
    const place = newPlace.trim();
    if (!place) return;
    if (roots.some((r) => r.place.toLowerCase() === place.toLowerCase())) {
      setNewPlace('');
      return;
    }
    setRoots((rs) => [...rs, { place, isPrimary: rs.length === 0 }]);
    setNewPlace('');
    setSaved(false);
  }

  function remove(index: number) {
    setRoots((rs) => {
      const next = rs.filter((_, i) => i !== index);
      if (next.length && !next.some((r) => r.isPrimary)) next[0].isPrimary = true;
      return [...next];
    });
    setSaved(false);
  }

  function makePrimary(index: number) {
    setRoots((rs) => rs.map((r, i) => ({ ...r, isPrimary: i === index })));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const r = await api.post<{ roots: Root[] }>('/roots', { roots });
      setRoots(r.roots);
      setSaved(true);
    } catch {
      /* keep local edits if the save fails */
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: spacing.lg, gap: spacing.xl }}
      >
        <GhostButton label="‹ Back" onPress={() => router.back()} />

        <View style={{ gap: 8 }}>
          <Heading>Where are your roots?</Heading>
          <Body muted>
            Add the places you have ties to and star your hometown. Companies looking to bring
            talent back to your region can find you here.
          </Body>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <TextInput
            value={newPlace}
            onChangeText={setNewPlace}
            onSubmitEditing={add}
            placeholder="e.g. Columbus, OH"
            placeholderTextColor={colors.gray400}
            returnKeyType="done"
            style={{
              flex: 1,
              height: 50,
              borderRadius: radius.md,
              backgroundColor: colors.fieldBg,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 16,
              fontSize: 16,
              color: colors.text,
            }}
          />
          <Pressable
            onPress={add}
            style={({ pressed }) => [
              {
                height: 50,
                paddingHorizontal: 18,
                borderRadius: radius.md,
                backgroundColor: colors.black,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Add</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.gray400} />
        ) : roots.length === 0 ? (
          <Text style={{ fontSize: 14, color: colors.textMuted }}>
            No roots yet — add the place you’d most want to be found from.
          </Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {roots.map((r, i) => (
              <View
                key={r.place}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  backgroundColor: colors.gray050,
                  borderWidth: 1,
                  borderColor: r.isPrimary ? colors.text : colors.border,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                }}
              >
                <Pressable onPress={() => makePrimary(i)} hitSlop={8}>
                  <Text style={{ fontSize: 20, color: r.isPrimary ? colors.accent : colors.gray400 }}>
                    {r.isPrimary ? '★' : '☆'}
                  </Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{r.place}</Text>
                  {r.isPrimary ? (
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>Primary hometown</Text>
                  ) : null}
                </View>
                <Pressable onPress={() => remove(i)} hitSlop={8}>
                  <Text style={{ fontSize: 20, color: colors.gray400 }}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={{ gap: spacing.sm }}>
          <PrimaryButton label="Save my roots" onPress={save} loading={saving} />
          {saved ? (
            <Text style={{ textAlign: 'center', fontSize: 13, color: colors.green, fontWeight: '600' }}>
              Saved — companies in your region can find you now.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
