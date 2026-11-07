import type { PlaceId } from '@discover/shared';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DataModal } from '@/components/DataModal';
import { CountStamp } from '@/components/CountStamp';
import { DiscoveryGallery } from '@/components/DiscoveryGallery';
import { MapsSection } from '@/components/MapsSection';
import { PlaceDetailModal } from '@/components/PlaceDetailModal';
import { Screen } from '@/components/Screen';
import { LinkRow } from '@/components/SettingsRows';
import { SettingsModal } from '@/components/SettingsModal';
import { useMaps } from '@/features/maps/useMaps';
import { useDiscoveryGallery } from '@/features/photo/useDiscoveryGallery';
import { t } from '@/lib/i18n/t';
import { fonts, radius, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export function ProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const db = useSQLiteContext();
  const [page, setPage] = useState<'data' | 'settings' | null>(null);
  const [discoveries, reloadDiscoveries] = useDiscoveryGallery(db);
  const [openId, setOpenId] = useState<PlaceId | null>(null);
  const { maps } = useMaps(db);
  const ownedMaps = maps.filter((entry) => entry.status !== 'locked').length;
  const opened = discoveries.find((discovery) => discovery.placeId === openId) ?? null;

  return (
    <Screen edges={['top', 'right', 'left']}>
      <ScrollView>
        <View style={styles.cover}>
          <Text style={styles.coverKicker}>{t('profile.kicker').toUpperCase()}</Text>
          <Text style={styles.coverTitle} accessibilityRole="header">
            {t('profile.title')}
          </Text>
        </View>
        <View style={styles.stamps}>
          <CountStamp
            value={String(discoveries.length)}
            label={t('profile.stamp.places')}
            tone="stamp"
            round
            tilt={-8}
          />
          <CountStamp
            value={String(ownedMaps)}
            label={t('profile.stamp.maps')}
            tone="postal"
            tilt={5}
          />
        </View>
        <Text style={styles.section} accessibilityRole="header">
          {t('profile.discoveries')}
        </Text>
        <DiscoveryGallery discoveries={discoveries} onOpen={setOpenId} />
        <Text style={styles.section} accessibilityRole="header">
          {t('maps.title')}
        </Text>
        <MapsSection />
        <LinkRow label={t('data.title')} onPress={() => setPage('data')} />
        <LinkRow label={t('profile.settings')} onPress={() => setPage('settings')} />
        <Text style={styles.footer}>{t('profile.footer')}</Text>
      </ScrollView>
      <DataModal visible={page === 'data'} onClose={() => setPage(null)} />
      <SettingsModal visible={page === 'settings'} onClose={() => setPage(null)} />
      <PlaceDetailModal
        key={openId ?? 'closed'}
        discovery={opened}
        onClose={() => setOpenId(null)}
        onChanged={reloadDiscoveries}
      />
    </Screen>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    cover: {
      backgroundColor: c.ink,
      borderRadius: radius.card,
      padding: spacing.lg,
      gap: spacing.md,
      marginTop: spacing.md,
    },
    coverKicker: { fontFamily: fonts.stamp, fontSize: 11, letterSpacing: 2, color: c.lantern },
    coverTitle: { fontFamily: fonts.title, fontSize: 36, lineHeight: 42, color: c.paper },
    stamps: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: spacing.xl,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl },
    texts: { flex: 1 },
    label: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: c.ink },
    section: {
      fontFamily: fonts.hand,
      fontSize: 28,
      lineHeight: 34,
      color: c.ink,
      marginTop: spacing.xxl,
      marginBottom: spacing.md,
    },
    hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    footer: {
      fontFamily: fonts.hand,
      fontSize: 22,
      lineHeight: 28,
      color: c.ink,
      marginTop: spacing.xl,
      marginBottom: spacing.xl,
      transform: [{ rotate: '-1.5deg' }],
    },
  });
