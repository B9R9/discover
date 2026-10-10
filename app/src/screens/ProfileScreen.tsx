import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { DiscoveryGallery } from '@/components/DiscoveryGallery';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { getSetting } from '@/db/settings';
import { setBackgroundTracking } from '@/features/location/backgroundSetting';
import { useDiscoveryGallery } from '@/features/photo/useDiscoveryGallery';
import { t } from '@/lib/i18n/t';
import { palette, spacing } from '@/theme/tokens';

export function ProfileScreen() {
  const db = useSQLiteContext();
  const [background, setBackground] = useState(false);
  const discoveries = useDiscoveryGallery(db);

  useEffect(() => {
    getSetting(db, 'backgroundTracking').then(setBackground);
  }, [db]);

  async function toggle(enabled: boolean) {
    setBackground(enabled);
    setBackground(await setBackgroundTracking(db, enabled));
  }

  return (
    <Screen>
      <ScrollView>
        <ScreenTitle>{t('profile.title')}</ScreenTitle>
        <View style={styles.row}>
          <View style={styles.texts}>
            <Text style={styles.label}>{t('profile.backgroundTracking')}</Text>
            <Text style={styles.hint}>{t('profile.backgroundTrackingHint')}</Text>
          </View>
          <Switch
            accessibilityLabel={t('profile.backgroundTracking')}
            value={background}
            onValueChange={toggle}
            trackColor={{ true: palette.light.discovered }}
          />
        </View>
        <Text style={styles.section} accessibilityRole="header">
          {t('profile.discoveries')}
        </Text>
        <DiscoveryGallery discoveries={discoveries} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl },
  texts: { flex: 1 },
  label: { fontSize: 16, lineHeight: 24, color: palette.light.text },
  section: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: palette.light.text,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  hint: { fontSize: 14, lineHeight: 20, color: palette.light.textMuted },
});
