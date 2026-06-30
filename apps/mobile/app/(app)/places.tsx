import { useRouter } from 'expo-router';
import type { LocationRef } from '@reelworx/shared';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Body, GhostButton, Heading, PrimaryButton, Screen } from '../../components/ui';
import { LocationPicker } from '../../components/LocationPicker';
import { colors, radius, spacing } from '../../constants/theme';
import { useApi } from '../../lib/api';

interface PlacesResponse {
  hometown: string | null;
  openTo: LocationRef[];
}

// Hometown + Open To — the two DISTINCT location fields (see schema Root.kind). Hometown is
// where Marcus is FROM (one place — powers "Come Home"); Open To is where he'd MOVE (many).
// Calm housekeeping, not a Wrapped moment: this is curation, the celebration lives on the
// strength screen when the component completes.
export default function Places() {
  const router = useRouter();
  const api = useApi();

  const [hometown, setHometown] = useState<string | null>(null);
  const [openTo, setOpenTo] = useState<LocationRef[]>([]);
  const [editingHometown, setEditingHometown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get<PlacesResponse>('/places')
      .then((r) => {
        if (!active) return;
        setHometown(r.hometown);
        setOpenTo(r.openTo ?? []);
        setEditingHometown(!r.hometown);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api]);

  const dirty = () => setSaved(false);

  function setHome(ref: LocationRef) {
    setHometown(ref.label);
    setEditingHometown(false);
    dirty();
  }

  function addOpenTo(ref: LocationRef) {
    setOpenTo((xs) =>
      xs.some((x) => x.label.toLowerCase() === ref.label.toLowerCase()) ? xs : [...xs, ref],
    );
    dirty();
  }

  function removeOpenTo(label: string) {
    setOpenTo((xs) => xs.filter((x) => x.label !== label));
    dirty();
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const r = await api.post<PlacesResponse>('/places', { hometown: hometown ?? '', openTo });
      setHometown(r.hometown);
      setOpenTo(r.openTo ?? []);
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
          <Heading>Where you’re from, where you’d go</Heading>
          <Body muted>
            Two different things, and both help the right companies find you.
          </Body>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.gray400} />
        ) : (
          <>
            {/* ── Hometown: a single place ─────────────────────────────────────── */}
            <View style={{ gap: spacing.sm }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Hometown</Text>
              <Body muted>The one place you’re from. Companies use it to bring people home.</Body>

              {hometown && !editingHometown ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    backgroundColor: colors.gray050,
                    borderWidth: 1,
                    borderColor: colors.text,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                  }}
                >
                  <Text style={{ fontSize: 20, color: colors.accent }}>★</Text>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: colors.text }}>
                    {hometown}
                  </Text>
                  <Pressable onPress={() => setEditingHometown(true)} hitSlop={8}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.accent }}>Change</Text>
                  </Pressable>
                </View>
              ) : (
                <LocationPicker placeholder="e.g. Columbus, OH" onPick={setHome} />
              )}
            </View>

            {/* ── Open To: many places ─────────────────────────────────────────── */}
            <View style={{ gap: spacing.sm }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Open to moving</Text>
              <Body muted>
                Anywhere you’d genuinely consider — a city, a state, or “anywhere in the Southeast.”
                Add as many as you like.
              </Body>

              {openTo.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {openTo.map((p) => (
                    <Pressable
                      key={p.label}
                      onPress={() => removeOpenTo(p.label)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: colors.gray050,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radius.full,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{p.label}</Text>
                      <Text style={{ fontSize: 16, color: colors.gray400 }}>×</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <LocationPicker
                placeholder="Add a place you’re open to"
                onPick={addOpenTo}
                exclude={openTo.map((p) => p.label)}
              />
            </View>

            <View style={{ gap: spacing.sm }}>
              <PrimaryButton label="Save" onPress={save} loading={saving} />
              {saved ? (
                <Text
                  style={{ textAlign: 'center', fontSize: 13, color: colors.green, fontWeight: '600' }}
                >
                  Saved — the right companies can find you now.
                </Text>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
