// LocationPicker — one autocomplete input for both location fields.
//
// Hometown uses it in single mode; Open To uses it in multi mode. Suggestions come from
// the isomorphic suggestLocations() (no network round-trip), so typing "Milw" surfaces
// "Milwaukee, WI" and "anywhere in the south" surfaces the Southeast region. Apple-calm:
// a plain field with a quiet results card underneath, no chrome until you type.

import { suggestLocations, toLocationRef, type LocationRef } from '@reelworx/shared';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

const KIND_LABEL: Record<LocationRef['kind'], string> = {
  metro: 'City',
  state: 'State',
  region: 'Region',
  remote: 'Remote',
};

export function LocationPicker({
  placeholder,
  onPick,
  exclude = [],
}: {
  placeholder: string;
  /** Called with the chosen location. The parent owns whether it replaces or appends. */
  onPick: (ref: LocationRef) => void;
  /** Labels already chosen — hidden from suggestions so you can't add a duplicate. */
  exclude?: string[];
}) {
  const [query, setQuery] = useState('');
  const excludeSet = new Set(exclude.map((s) => s.trim().toLowerCase()));

  const suggestions = query.trim()
    ? suggestLocations(query, 6).filter((s) => !excludeSet.has(s.label.toLowerCase()))
    : [];

  function pick(ref: LocationRef) {
    onPick(ref);
    setQuery('');
  }

  // Enter with no exact suggestion still works — a real place we just don't have catalogued.
  function submitFreeform() {
    const q = query.trim();
    if (!q) return;
    const top = suggestions[0];
    pick(top && top.label.toLowerCase() === q.toLowerCase() ? top : toLocationRef(q));
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={submitFreeform}
        placeholder={placeholder}
        placeholderTextColor={colors.gray400}
        autoCorrect={false}
        returnKeyType="done"
        style={{
          height: 52,
          borderRadius: radius.md,
          backgroundColor: colors.fieldBg,
          borderWidth: 1,
          borderColor: query.trim() ? colors.text : colors.border,
          paddingHorizontal: 16,
          fontSize: 16,
          color: colors.text,
        }}
      />

      {suggestions.length > 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            backgroundColor: colors.bg,
            overflow: 'hidden',
          }}
        >
          {suggestions.map((s, i) => (
            <Pressable
              key={s.label}
              onPress={() => pick(s)}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: spacing.md,
                  paddingVertical: 14,
                  backgroundColor: pressed ? colors.gray050 : colors.bg,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <Text style={{ fontSize: 16, color: colors.text }}>{s.label}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>{KIND_LABEL[s.kind]}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
