import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Outing } from '@/features/outings/filterOutings';
import { crowWalkMinutes, formatDistance, ticketDate } from '@/lib/format';
import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Tape } from './Tape';

interface OutingTicketProps {
  outing: Outing;
  // The first ticket of the list is bigger, taped, and carries the "J'y vais" button.
  featured?: boolean;
  tilt: number;
  onOpen: () => void;
}

// An outing as a ticket: the date on the stub, the rest on the body, notches on the tear line.
export function OutingTicket({ outing, featured = false, tilt, onOpen }: OutingTicketProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, featured), [colors, featured]);
  const { event, distance } = outing;
  const date = ticketDate(event.startsAt);
  const kicker = [event.kind, event.area, distance === null ? '' : formatDistance(distance)]
    .filter(Boolean)
    .join(' · ');
  const label = `${event.title}, ${date.weekday} ${date.day}, ${date.time}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onOpen}
      style={[styles.ticket, { transform: [{ rotate: `${tilt}deg` }] }]}
    >
      {featured && <Tape tilt={-3} />}
      <View style={styles.stub}>
        <Text style={styles.stubSmall}>{date.weekday}</Text>
        <Text style={styles.stubDay}>{date.day}</Text>
        {featured && <Text style={styles.stubTime}>{date.time}</Text>}
      </View>
      <View style={styles.body}>
        <Text style={styles.kicker} numberOfLines={1}>
          {kicker.toUpperCase()}
        </Text>
        <Text style={styles.title}>{event.title}</Text>
        {!featured && (
          <Text style={styles.meta}>
            {[date.time, event.free ? t('outings.free') : '', event.area]
              .filter(Boolean)
              .join(' · ')
              .toUpperCase()}
          </Text>
        )}
        {featured && (
          <View style={styles.footer}>
            {distance !== null && (
              <Text style={styles.hand}>
                {t('outings.crowWalk', { minutes: crowWalkMinutes(distance) })}
              </Text>
            )}
            <View style={styles.go}>
              <Text style={styles.goLabel}>{t('outings.go').toUpperCase()}</Text>
            </View>
          </View>
        )}
      </View>
      <View style={[styles.notch, styles.notchTop]} />
      <View style={[styles.notch, styles.notchBottom]} />
    </Pressable>
  );
}

const createStyles = (c: ThemeColors, featured: boolean) => {
  const stubWidth = featured ? 84 : 64;
  const notch = featured ? 14 : 12;
  return StyleSheet.create({
    ticket: {
      flexDirection: 'row',
      backgroundColor: featured ? c.paperWhite : c.paperLight,
      shadowColor: c.ink,
      shadowOpacity: featured ? 0.22 : 0.14,
      shadowRadius: featured ? 10 : 0,
      shadowOffset: { width: 0, height: featured ? 6 : 2 },
      elevation: featured ? 5 : 1,
    },
    stub: {
      width: stubWidth,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: featured ? spacing.lg : spacing.md,
      borderRightWidth: 2,
      borderRightColor: c.kraft,
    },
    stubSmall: { fontFamily: fonts.stamp, fontSize: 12, letterSpacing: 1.4, color: c.stamp },
    stubDay: {
      fontFamily: fonts.stamp,
      fontSize: featured ? 40 : 28,
      lineHeight: featured ? 44 : 32,
      color: c.stamp,
    },
    stubTime: { fontFamily: fonts.stamp, fontSize: 12, marginTop: spacing.xs, color: c.stamp },
    body: {
      flex: 1,
      padding: featured ? spacing.lg : spacing.md,
      justifyContent: 'center',
      gap: 3,
    },
    kicker: { fontFamily: fonts.stamp, fontSize: 11, letterSpacing: 1.5, color: c.postalText },
    title: {
      fontFamily: fonts.title,
      fontSize: featured ? 25 : 20,
      lineHeight: featured ? 28 : 23,
      color: c.ink,
    },
    meta: { fontFamily: fonts.stamp, fontSize: 12, color: c.ink },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
    },
    hand: { fontFamily: fonts.hand, fontSize: 21, color: c.ink, transform: [{ rotate: '-2deg' }] },
    go: {
      minHeight: 44,
      paddingHorizontal: spacing.lg,
      borderRadius: 4,
      backgroundColor: c.stamp,
      justifyContent: 'center',
    },
    goLabel: { fontFamily: fonts.stamp, fontSize: 14, letterSpacing: 0.8, color: c.onStamp },
    notch: {
      position: 'absolute',
      left: stubWidth - notch / 2 - 1,
      width: notch,
      height: notch,
      borderRadius: notch / 2,
      backgroundColor: c.paper,
    },
    notchTop: { top: -notch / 2 },
    notchBottom: { bottom: -notch / 2 },
  });
};
