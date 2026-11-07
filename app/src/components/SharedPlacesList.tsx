import type { SharedPlace } from '@discover/shared';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { removeSharedPlace } from '@/features/social/placeSharesApi';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';

// Places friends sent to me, and the ones I sent. A recipient only hides their copy; the author deletes for all.
export function SharedPlacesList({
  places,
  onChanged,
}: {
  places: SharedPlace[];
  onChanged: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [error, setError] = useState<TranslationKey | null>(null);

  async function remove(id: string) {
    setError(null);
    const result = await removeSharedPlace(id);
    if (result.ok) onChanged();
    else setError(result.error);
  }

  if (places.length === 0) return null;
  return (
    <View style={styles.box}>
      <Text style={styles.section} accessibilityRole="header">
        {t('sharedPlaces.title')}
      </Text>
      {places.map((place) => (
        <View key={place.id} style={styles.card}>
          <Text style={styles.kicker}>
            {(place.mine
              ? t('sharedPlaces.sentTo', { pseudos: place.to.join(', ') })
              : t('sharedPlaces.from', { pseudo: place.pseudo })
            ).toUpperCase()}
          </Text>
          <Text style={styles.name}>{place.name}</Text>
          {place.genre && <Text style={styles.meta}>{t(`category.${place.genre}`)}</Text>}
          {place.comment !== '' && <Text style={styles.comment}>{place.comment}</Text>}
          <Button
            label={t(place.mine ? 'sharedPlaces.delete' : 'sharedPlaces.hide')}
            variant="secondary"
            onPress={() => void remove(place.id)}
          />
        </View>
      ))}
      {error && <Text style={styles.error}>{t(error)}</Text>}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    box: { gap: spacing.md },
    section: {
      fontFamily: fonts.title,
      fontSize: 18,
      lineHeight: 24,
      color: c.ink,
      marginTop: spacing.lg,
    },
    card: { gap: spacing.xs, padding: spacing.md, backgroundColor: c.paperWhite },
    kicker: { fontFamily: fonts.stamp, fontSize: 11, letterSpacing: 1.1, color: c.postalText },
    name: { fontFamily: fonts.title, fontSize: 21, lineHeight: 26, color: c.ink },
    meta: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    comment: { fontFamily: fonts.hand, fontSize: 22, lineHeight: 28, color: c.ink },
    error: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.stamp },
  });
