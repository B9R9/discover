import type { SharedWalk } from '@discover/shared';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DrawWalkModal } from '@/components/DrawWalkModal';
import { FilterChip } from '@/components/FilterChip';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { WalkCard } from '@/components/WalkCard';
import { WalkViewerModal } from '@/components/WalkViewerModal';
import { useSession } from '@/features/account/useSession';
import { deleteWalk, reportWalk } from '@/features/social/walksApi';
import { filterWalks, type WalkFilter } from '@/features/walks/filterWalks';
import { useWalks } from '@/features/walks/useWalks';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, radius, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const FILTERS: { key: WalkFilter; label: TranslationKey }[] = [
  { key: 'all', label: 'walks.filter.all' },
  { key: 'short', label: 'walks.filter.short' },
  { key: 'near', label: 'walks.filter.near' },
];

// The walks made by Détour are open to everyone; drawing, deleting and reporting need an account.
export function WalksScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const signedIn = Boolean(useSession());
  const [walks, reload] = useWalks();
  const [filter, setFilter] = useState<WalkFilter>('all');
  const [here, setHere] = useState<[number, number] | null>(null);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [opened, setOpened] = useState<SharedWalk | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [message, setMessage] = useState<TranslationKey | null>(null);

  useEffect(() => {
    if (filter !== 'near') return;
    Location.getLastKnownPositionAsync()
      .then((position) => {
        if (position) setHere([position.coords.longitude, position.coords.latitude]);
      })
      .catch(console.warn);
  }, [filter]);

  const shown = useMemo(() => filterWalks(walks, filter, here), [walks, filter, here]);

  async function act(action: () => ReturnType<typeof deleteWalk>, success?: TranslationKey) {
    const result = await action();
    setMessage(result.ok ? (success ?? null) : result.error);
    if (result.ok) reload();
  }

  return (
    <Screen edges={['top', 'right', 'left']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>{t('walks.kicker').toUpperCase()}</Text>
        <ScreenTitle>{t('tabs.walks')}</ScreenTitle>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map(({ key, label }) => (
            <FilterChip
              key={key}
              label={t(label)}
              selected={filter === key}
              onPress={() => setFilter(key)}
            />
          ))}
        </ScrollView>
        <View style={styles.list}>
          {shown.length === 0 && <Text style={styles.hint}>{t('walks.empty')}</Text>}
          {shown.map((walk) => (
            <WalkCard
              key={walk.id}
              walk={walk}
              chosen={walk.id === chosenId}
              signedIn={signedIn}
              onChoose={() => setChosenId(walk.id === chosenId ? null : walk.id)}
              onOpen={() => setOpened(walk)}
              onDelete={() => {
                act(() => deleteWalk(walk.id)).catch(console.warn);
              }}
              onReport={() => {
                act(() => reportWalk(walk.id), 'walks.reported').catch(console.warn);
              }}
            />
          ))}
        </View>
        {message && (
          <Text style={styles.hint} accessibilityLiveRegion="polite">
            {t(message)}
          </Text>
        )}
        {!signedIn && <Text style={styles.hint}>{t('walks.signIn')}</Text>}
      </ScrollView>
      {signedIn && (
        <Pressable accessibilityRole="button" onPress={() => setDrawing(true)} style={styles.fab}>
          <Text style={styles.fabLabel}>+ {t('walks.leave').toUpperCase()}</Text>
        </Pressable>
      )}
      <WalkViewerModal walk={opened} onClose={() => setOpened(null)} />
      <DrawWalkModal
        visible={drawing}
        onClose={() => setDrawing(false)}
        onPublished={() => {
          setDrawing(false);
          setMessage('walks.published');
          reload();
        }}
      />
    </Screen>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    content: { paddingBottom: 120, gap: spacing.md },
    kicker: { fontFamily: fonts.stamp, fontSize: 12, letterSpacing: 1.9, color: c.stamp },
    chips: { gap: spacing.sm },
    list: { gap: spacing.lg, paddingTop: spacing.sm },
    hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    fab: {
      position: 'absolute',
      right: spacing.lg,
      bottom: spacing.lg,
      minHeight: 52,
      paddingHorizontal: spacing.lg + 2,
      borderRadius: radius.pill,
      backgroundColor: c.stamp,
      justifyContent: 'center',
      elevation: 6,
    },
    fabLabel: { fontFamily: fonts.stamp, fontSize: 14, letterSpacing: 0.6, color: c.onStamp },
  });
