import type { PlaceId } from '@discover/shared';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { AccountSection } from '@/components/AccountSection';
import { CountStamp } from '@/components/CountStamp';
import { DiscoveryGallery } from '@/components/DiscoveryGallery';
import { MapStyleSection } from '@/components/MapStyleSection';
import { MapsSection } from '@/components/MapsSection';
import { PlaceDetailModal } from '@/components/PlaceDetailModal';
import { Screen } from '@/components/Screen';
import { Stamp } from '@/components/Stamp';
import { getSetting } from '@/db/settings';
import { setBackgroundTracking } from '@/features/location/backgroundSetting';
import { useMaps } from '@/features/maps/useMaps';
import { useDiscoveryGallery } from '@/features/photo/useDiscoveryGallery';
import { t } from '@/lib/i18n/t';
import { fonts, radius, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export function ProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const db = useSQLiteContext();
  const [background, setBackground] = useState(false);
  const [discoveries, reloadDiscoveries] = useDiscoveryGallery(db);
  const [openId, setOpenId] = useState<PlaceId | null>(null);
  const { maps } = useMaps(db);
  const ownedMaps = maps.filter((entry) => entry.status !== 'locked').length;
  const opened = discoveries.find((discovery) => discovery.placeId === openId) ?? null;

  useEffect(() => {
    getSetting(db, 'backgroundTracking').then(setBackground);
  }, [db]);

  async function toggle(enabled: boolean) {
    setBackground(enabled);
    setBackground(await setBackgroundTracking(db, enabled));
  }

  return (
    <Screen edges={['top', 'right', 'left']}>
      {/* The account form has text fields: Android edge-to-edge does not shrink the screen for the keyboard. */}
      <KeyboardAvoidingView behavior="padding" style={styles.keyboard}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.cover}>
            <Text style={styles.coverKicker}>{t('profile.kicker').toUpperCase()}</Text>
            <Text style={styles.coverTitle} accessibilityRole="header">
              {t('profile.title')}
            </Text>
            <Stamp
              label={
                discoveries.length === 1
                  ? t('profile.cover.countOne')
                  : t('profile.cover.count', { count: discoveries.length })
              }
              tilt={-6}
            />
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
          <View style={styles.row}>
            <View style={styles.texts}>
              <Text style={styles.label}>{t('profile.backgroundTracking')}</Text>
              <Text style={styles.hint}>{t('profile.backgroundTrackingHint')}</Text>
            </View>
            <Switch
              accessibilityLabel={t('profile.backgroundTracking')}
              value={background}
              onValueChange={toggle}
              trackColor={{ true: colors.stamp, false: colors.kraft }}
            />
          </View>
          <Text style={styles.section} accessibilityRole="header">
            {t('profile.discoveries')}
          </Text>
          <DiscoveryGallery discoveries={discoveries} onOpen={setOpenId} />
          <Text style={styles.section} accessibilityRole="header">
            {t('profile.mapStyle')}
          </Text>
          <MapStyleSection />
          <Text style={styles.section} accessibilityRole="header">
            {t('maps.title')}
          </Text>
          <MapsSection />
          <AccountSection />
          <Text style={styles.footer}>{t('profile.footer')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    keyboard: { flex: 1 },
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
