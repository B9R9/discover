import type { SharedWalk } from '@discover/shared';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDistance, formatWalkDuration } from '@/lib/format';
import { t } from '@/lib/i18n/t';
import { fonts, radius, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Stamp } from './Stamp';
import { WalkThumb } from './WalkThumb';

interface WalkCardProps {
  walk: SharedWalk;
  chosen: boolean;
  signedIn: boolean;
  onChoose: () => void;
  onOpen: () => void;
  onDelete: () => void;
  onReport: () => void;
}

// A walk as a card of the notebook: dotted trail, who left it, what it costs in time. The chosen one opens up.
export function WalkCard({
  walk,
  chosen,
  signedIn,
  onChoose,
  onOpen,
  onDelete,
  onReport,
}: WalkCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, chosen), [colors, chosen]);
  const author = walk.pseudo ? t('walks.by', { pseudo: walk.pseudo }) : t('walks.byDetour');
  const stats = t('walks.stats', {
    distance: formatDistance(walk.distanceMeters),
    duration: formatWalkDuration(walk.durationSeconds),
  });
  return (
    <View style={styles.card}>
      {chosen && (
        <View style={styles.stamp}>
          <Stamp label={t('walks.chosen')} tilt={6} />
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: chosen }}
        accessibilityLabel={`${walk.name}, ${author}, ${stats}`}
        onPress={onChoose}
        style={styles.row}
      >
        <WalkThumb path={walk.path} size={chosen ? 96 : 72} />
        <View style={styles.texts}>
          <Text style={styles.kicker}>{author.toUpperCase()}</Text>
          <Text style={styles.name}>{walk.name}</Text>
          <Text style={styles.stats}>{stats.toUpperCase()}</Text>
        </View>
      </Pressable>
      {chosen && (
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={onOpen} style={styles.cta}>
            <Text style={styles.ctaLabel}>{t('walks.take').toUpperCase()}</Text>
          </Pressable>
          {signedIn && walk.mine && (
            <Pressable accessibilityRole="button" onPress={onDelete} style={styles.link}>
              <Text style={styles.linkLabel}>{t('walks.delete').toUpperCase()}</Text>
            </Pressable>
          )}
          {signedIn && !walk.mine && walk.pseudo !== null && (
            <Pressable accessibilityRole="button" onPress={onReport} style={styles.link}>
              <Text style={styles.linkLabel}>{t('walks.report').toUpperCase()}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const createStyles = (c: ThemeColors, chosen: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: chosen ? c.paperWhite : c.paperLight,
      borderWidth: chosen ? 3 : 0,
      borderColor: c.stamp,
      padding: spacing.md,
      gap: spacing.sm,
      elevation: chosen ? 4 : 1,
      transform: [{ rotate: chosen ? '-0.5deg' : '0.3deg' }],
    },
    stamp: { position: 'absolute', right: -8, top: -14, zIndex: 1 },
    row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', minHeight: 72 },
    texts: { flex: 1, gap: spacing.xs },
    kicker: { fontFamily: fonts.stamp, fontSize: 11, letterSpacing: 1.3, color: c.postalText },
    name: {
      fontFamily: fonts.title,
      fontSize: chosen ? 22 : 19,
      lineHeight: chosen ? 26 : 23,
      color: c.ink,
    },
    stats: { fontFamily: fonts.stamp, fontSize: 12, color: c.ink },
    actions: { gap: spacing.sm },
    cta: {
      minHeight: 48,
      borderRadius: radius.card,
      backgroundColor: c.stamp,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaLabel: { fontFamily: fonts.stamp, fontSize: 14, letterSpacing: 0.9, color: c.onStamp },
    link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    linkLabel: { fontFamily: fonts.stamp, fontSize: 12, letterSpacing: 1.2, color: c.stamp },
  });
