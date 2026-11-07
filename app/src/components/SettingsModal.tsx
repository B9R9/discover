import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { getSetting } from '@/db/settings';
import { setBackgroundTracking } from '@/features/location/backgroundSetting';
import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { AccountSection } from './AccountSection';
import { MapStyleSection } from './MapStyleSection';
import { SectionLabel, SwitchRow, ValueRow } from './SettingsRows';
import { SubpageModal } from './SubpageModal';

// Settings page of the profile. Rows without a feature behind them are greyed out ("bientôt").
export function SettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const db = useSQLiteContext();
  const [background, setBackground] = useState(false);

  useEffect(() => {
    getSetting(db, 'backgroundTracking').then(setBackground);
  }, [db]);

  async function toggle(enabled: boolean) {
    setBackground(enabled);
    setBackground(await setBackgroundTracking(db, enabled));
  }

  return (
    <SubpageModal
      visible={visible}
      kicker={t('settings.title')}
      title={t('settings.title')}
      onClose={onClose}
    >
      <SectionLabel>{t('settings.account')}</SectionLabel>
      <AccountSection />
      <SectionLabel>{t('settings.app')}</SectionLabel>
      <SwitchRow
        label={t('profile.backgroundTracking')}
        hint={t('profile.backgroundTrackingHint')}
        value={background}
        onChange={toggle}
      />
      <ValueRow soon label={t('settings.language')} value="Français" />
      <ValueRow soon label={t('settings.distances')} value={t('settings.kilometers')} />
      <Text style={styles.subtitle}>{t('profile.mapStyle')}</Text>
      <MapStyleSection />
      <SectionLabel>{t('settings.notifications')}</SectionLabel>
      <SwitchRow soon label={t('settings.notifyOutings')} />
      <SwitchRow soon label={t('settings.notifyNotes')} />
      <SectionLabel>{t('settings.help')}</SectionLabel>
      <ValueRow soon label={t('settings.helpContact')} />
      <ValueRow soon label={t('settings.about')} />
      <Text style={styles.footer}>{t('settings.footer')}</Text>
    </SubpageModal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    subtitle: { fontFamily: fonts.stamp, fontSize: 15, color: c.ink, marginTop: spacing.md },
    footer: {
      fontFamily: fonts.hand,
      fontSize: 24,
      lineHeight: 30,
      color: c.ink,
      textAlign: 'center',
      marginVertical: spacing.xl,
      transform: [{ rotate: '-1.5deg' }],
    },
  });
