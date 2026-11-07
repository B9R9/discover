import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FilterChip } from '@/components/FilterChip';
import { OutingsPanel } from '@/components/OutingsPanel';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { WalksPanel } from '@/components/WalksPanel';
import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Segment = 'outings' | 'walks';

// One tab for what to do around: dated outings, and walks to take whenever.
export function OutingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [segment, setSegment] = useState<Segment>('outings');
  const [count, setCount] = useState(0);

  return (
    <Screen edges={['top', 'right', 'left']}>
      <Text style={styles.kicker}>
        {t(segment === 'outings' ? 'outings.kicker' : 'walks.kicker').toUpperCase()}
      </Text>
      <View style={styles.titleRow}>
        <ScreenTitle>{t(segment === 'outings' ? 'tabs.outings' : 'tabs.walks')}</ScreenTitle>
        {segment === 'outings' && <Text style={styles.count}>{t('outings.count', { count })}</Text>}
      </View>
      <View style={styles.segments} accessibilityRole="tablist">
        <FilterChip
          label={t('outings.segment.outings')}
          selected={segment === 'outings'}
          onPress={() => setSegment('outings')}
        />
        <FilterChip
          label={t('outings.segment.walks')}
          selected={segment === 'walks'}
          onPress={() => setSegment('walks')}
        />
      </View>
      {segment === 'outings' ? <OutingsPanel onCount={setCount} /> : <WalksPanel />}
    </Screen>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    kicker: { fontFamily: fonts.stamp, fontSize: 12, letterSpacing: 1.9, color: c.stamp },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    count: {
      fontFamily: fonts.hand,
      fontSize: 22,
      paddingBottom: spacing.xs,
      color: c.ink,
      transform: [{ rotate: '-3deg' }],
    },
    segments: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md },
  });
