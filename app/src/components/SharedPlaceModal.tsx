import type { SharedPlace } from '@discover/shared';
import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useLastKnownPosition } from '@/features/location/useLastKnownPosition';
import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { CrowDirection } from './CrowDirection';
import { SubpageModal } from './SubpageModal';

// A place a friend sent: who, what, their word, and the direction to it. No itinerary until it is discovered.
export function SharedPlaceModal({
  place,
  onClose,
}: {
  place: SharedPlace | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const here = useLastKnownPosition(place !== null);
  return (
    <SubpageModal
      visible={place !== null}
      kicker={place ? t('sharedPlaces.from', { pseudo: place.pseudo }) : ''}
      title={place?.name ?? ''}
      onClose={onClose}
    >
      {place && (
        <>
          {place.genre && <Text style={styles.meta}>{t(`category.${place.genre}`)}</Text>}
          {place.comment !== '' && <Text style={styles.comment}>{place.comment}</Text>}
          <CrowDirection here={here} target={place} />
        </>
      )}
    </SubpageModal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    meta: {
      fontFamily: fonts.body,
      fontSize: 15,
      lineHeight: 22,
      color: c.muted,
      marginTop: spacing.md,
    },
    comment: {
      fontFamily: fonts.hand,
      fontSize: 26,
      lineHeight: 32,
      color: c.ink,
      marginTop: spacing.md,
    },
  });
