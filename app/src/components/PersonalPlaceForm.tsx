import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SPOT_GENRES, type SpotGenre, type Visibility } from '@/db/personalPlaces';
import { MAX_NAME_LENGTH, type PlaceDetails } from '@/features/photo/createPersonalPlace';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, radius, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';

interface PersonalPlaceFormProps {
  title: TranslationKey;
  submitLabel: TranslationKey;
  // Values to start from when editing; a new place starts empty and private.
  initial?: PlaceDetails;
  error: TranslationKey | null;
  busy: boolean;
  onCreate: (details: PlaceDetails) => void;
  onCancel: () => void;
  onEdit: () => void;
}

const KINDS: { value: Visibility; label: TranslationKey; hint: TranslationKey }[] = [
  { value: 'private', label: 'personal.kindPrivate', hint: 'personal.kindPrivateHint' },
  { value: 'public', label: 'personal.kindPublic', hint: 'personal.kindPublicHint' },
];

// Private by default: a home must never become public by mistake.
export function PersonalPlaceForm({
  title,
  submitLabel,
  initial,
  error,
  busy,
  onCreate,
  onCancel,
  onEdit,
}: PersonalPlaceFormProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState(initial?.name ?? '');
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? 'private');
  const [genre, setGenre] = useState<SpotGenre | null>(initial?.genre ?? null);

  // Scrolls so the buttons stay reachable while the keyboard covers the bottom of the screen.
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.card}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{t(title)}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(text) => {
          setName(text);
          onEdit();
        }}
        placeholder={t('personal.namePlaceholder')}
        placeholderTextColor={colors.muted}
        accessibilityLabel={t('personal.nameLabel')}
        maxLength={MAX_NAME_LENGTH}
        autoFocus={!initial}
        returnKeyType="done"
      />
      <View accessibilityRole="radiogroup" style={styles.kinds}>
        {KINDS.map((kind) => {
          const selected = visibility === kind.value;
          return (
            <Pressable
              key={kind.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => setVisibility(kind.value)}
              style={[styles.kind, selected && styles.kindSelected]}
            >
              <Text style={styles.label}>{t(kind.label)}</Text>
              <Text style={styles.hint}>{t(kind.hint)}</Text>
            </Pressable>
          );
        })}
      </View>
      {visibility === 'public' && (
        <View accessibilityRole="radiogroup" style={styles.genres}>
          {[...SPOT_GENRES, null].map((value) => {
            const selected = genre === value;
            return (
              <Pressable
                key={value ?? 'other'}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setGenre(value)}
                style={[styles.genre, selected && styles.kindSelected]}
              >
                <Text style={styles.genreLabel}>
                  {t(value ? `category.${value}` : 'personal.genreOther')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {t(error)}
        </Text>
      )}
      <View style={styles.actions}>
        <Button
          label={t(submitLabel)}
          onPress={() => {
            if (!busy) onCreate({ name, visibility, genre });
          }}
        />
        <Button label={t('personal.cancel')} onPress={onCancel} variant="secondary" />
      </View>
    </ScrollView>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    scroll: { alignSelf: 'stretch', flexGrow: 0, flexShrink: 1 },
    card: {
      backgroundColor: c.paperWhite,
      borderRadius: radius.md,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: { fontFamily: fonts.title, fontSize: 18, lineHeight: 24, color: c.ink },
    input: {
      fontFamily: fonts.body,
      borderWidth: 1,
      borderColor: c.ink,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      minHeight: 44,
      fontSize: 16,
      color: c.ink,
    },
    kinds: { gap: spacing.sm },
    kind: {
      borderWidth: 1,
      borderColor: c.ink,
      borderRadius: radius.sm,
      padding: spacing.md,
    },
    genres: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    genre: {
      borderWidth: 1,
      borderColor: c.ink,
      borderRadius: radius.round,
      paddingHorizontal: spacing.md,
      minHeight: 44,
      justifyContent: 'center',
    },
    genreLabel: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.ink },
    kindSelected: { borderColor: c.ink, borderWidth: 2 },
    label: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: c.ink },
    hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    error: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.stamp },
    actions: { gap: spacing.sm },
  });
