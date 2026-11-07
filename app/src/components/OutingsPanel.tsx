import type { DetourEvent } from '@discover/shared';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/features/account/useSession';
import { setGoing } from '@/features/outings/outingsApi';
import { useAttendance } from '@/features/outings/useAttendance';
import { filterOutings, type OutingFilters } from '@/features/outings/filterOutings';
import { useLastKnownPosition } from '@/features/location/useLastKnownPosition';
import { useOutings } from '@/features/outings/useOutings';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { FilterChip } from './FilterChip';
import { OutingDetailModal } from './OutingDetailModal';
import { OutingTicket } from './OutingTicket';

const FILTERS: { key: keyof OutingFilters; label: TranslationKey }[] = [
  { key: 'evening', label: 'outings.filter.evening' },
  { key: 'weekend', label: 'outings.filter.weekend' },
  { key: 'free', label: 'outings.filter.free' },
];

// Tilts alternate so the tickets look pinned by hand rather than printed in a grid.
const TILTS = [-0.8, 0.6, -0.5, 0.4];

// The coming outings around the user: filters, a featured first ticket, the others below.
export function OutingsPanel({ onCount }: { onCount: (count: number) => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const events = useOutings();
  const signedIn = Boolean(useSession());
  const [attendance, reloadAttendance] = useAttendance(signedIn);
  const [filters, setFilters] = useState<OutingFilters>({
    evening: false,
    weekend: false,
    free: false,
  });
  const here = useLastKnownPosition();
  const [opened, setOpened] = useState<DetourEvent | null>(null);

  async function toggleGoing(eventId: string, going: boolean) {
    const result = await setGoing(eventId, going);
    if (result.ok) reloadAttendance();
  }

  const shown = useMemo(
    () => filterOutings(events, filters, new Date(), here),
    [events, filters, here],
  );
  useEffect(() => onCount(shown.length), [shown.length, onCount]);

  return (
    <View style={styles.panel}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map(({ key, label }) => (
            <FilterChip
              key={key}
              label={t(label)}
              selected={filters[key]}
              onPress={() => setFilters((current) => ({ ...current, [key]: !current[key] }))}
            />
          ))}
        </ScrollView>
        <View style={styles.list}>
          {shown.length === 0 && <Text style={styles.hint}>{t('outings.empty')}</Text>}
          {shown.map((outing, index) => (
            <OutingTicket
              key={outing.event.id}
              outing={outing}
              featured={index === 0}
              tilt={TILTS[index % TILTS.length] ?? 0}
              onOpen={() => setOpened(outing.event)}
            />
          ))}
        </View>
      </ScrollView>
      <OutingDetailModal
        event={opened}
        here={here}
        attendance={opened ? attendance[opened.id] : undefined}
        signedIn={signedIn}
        onToggleGoing={(going) => {
          if (opened) toggleGoing(opened.id, going).catch(console.warn);
        }}
        onClose={() => setOpened(null)}
      />
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    panel: { flex: 1 },
    content: { paddingBottom: 120, gap: spacing.md },
    chips: { gap: spacing.sm },
    list: { gap: spacing.lg, paddingTop: spacing.md },
    hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
  });
