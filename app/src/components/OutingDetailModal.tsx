import type { DetourEvent } from '@discover/shared';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { GeoPoint } from '@/db/types';
import { bearingDegrees, distanceMeters } from '@/lib/geo';
import { cardinalKey } from '@/lib/cardinal';
import { crowWalkMinutes, formatDistance, formatLongDay, ticketDate } from '@/lib/format';
import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { SubpageModal } from './SubpageModal';
import { Tape } from './Tape';

interface OutingDetailModalProps {
  event: DetourEvent | null;
  here: GeoPoint | null;
  onClose: () => void;
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.factValue}>{value}</Text>
      {note ? <Text style={styles.factNote}>{note}</Text> : null}
    </View>
  );
}

// One outing: when, price, where, theme, then how far and which way (never an itinerary).
export function OutingDetailModal({ event, here, onClose }: OutingDetailModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const visible = event !== null;
  const start = event ? ticketDate(event.startsAt) : null;
  const end = event?.endsAt ? ticketDate(event.endsAt) : null;
  const distance = event && here ? distanceMeters(here, event) : null;
  return (
    <SubpageModal
      visible={visible}
      kicker={t('outings.ticket')}
      title={event?.title ?? ''}
      onClose={onClose}
    >
      {event && start && (
        <>
          <View style={styles.header}>
            <Tape tilt={-3} />
            <Text style={styles.kind}>
              {[event.kind, event.theme].filter(Boolean).join(' · ').toUpperCase()}
            </Text>
            {distance !== null && (
              <Text style={styles.hand}>
                {t('outings.crowWalk', { minutes: crowWalkMinutes(distance) })}
              </Text>
            )}
          </View>
          <View style={styles.grid}>
            <Fact
              label={t('outings.when')}
              value={formatLongDay(event.startsAt)}
              note={end ? t('outings.timeRange', { from: start.time, to: end.time }) : start.time}
            />
            <Fact
              label={t('outings.price')}
              value={t(event.free ? 'outings.free' : 'outings.paid')}
              note={event.priceNote}
            />
            <Fact label={t('outings.where')} value={event.placeName} note={event.area} />
            {event.theme !== '' && <Fact label={t('outings.theme')} value={event.theme} />}
          </View>
          {event.description !== '' && <Text style={styles.description}>{event.description}</Text>}
          <Text style={styles.direction}>
            {here && distance !== null
              ? t('outings.direction', {
                  distance: formatDistance(distance),
                  cardinal: t(cardinalKey(bearingDegrees(here, event))),
                })
              : t('outings.noPosition')}
          </Text>
          <Text style={styles.note}>{t('outings.directionNote')}</Text>
        </>
      )}
    </SubpageModal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    header: {
      marginTop: spacing.lg,
      padding: spacing.lg,
      gap: spacing.xs,
      backgroundColor: c.paperWhite,
      shadowColor: c.ink,
      shadowOpacity: 0.22,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 5 },
      elevation: 4,
      transform: [{ rotate: '-0.8deg' }],
    },
    kind: { fontFamily: fonts.stamp, fontSize: 11, letterSpacing: 1.5, color: c.postalText },
    hand: { fontFamily: fonts.hand, fontSize: 22, color: c.ink, transform: [{ rotate: '-1deg' }] },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
    fact: {
      width: '47.5%',
      padding: spacing.md,
      backgroundColor: c.paperLight,
      shadowColor: c.ink,
      shadowOpacity: 0.14,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    factLabel: { fontFamily: fonts.stamp, fontSize: 11, letterSpacing: 1.5, color: c.stamp },
    factValue: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 22, color: c.ink },
    factNote: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.ink },
    description: {
      fontFamily: fonts.body,
      fontSize: 15,
      lineHeight: 23,
      color: c.ink,
      marginTop: spacing.lg,
    },
    direction: {
      fontFamily: fonts.hand,
      fontSize: 24,
      lineHeight: 30,
      color: c.ink,
      marginTop: spacing.lg,
    },
    note: {
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 18,
      color: c.muted,
      marginBottom: spacing.xl,
    },
  });
