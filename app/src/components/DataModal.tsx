import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { SwitchRow, ValueRow } from './SettingsRows';
import { SubpageModal } from './SubpageModal';

// Privacy page of the profile. Nothing here is built yet: it lays out what will be, greyed out.
export function DataModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <SubpageModal
      visible={visible}
      kicker={t('data.kicker')}
      title={t('data.title')}
      onClose={onClose}
    >
      <Text style={styles.hand}>{t('profile.footer')}</Text>
      <SwitchRow soon value label={t('data.keepPhotos')} hint={t('data.keepPhotosHint')} />
      <SwitchRow soon label={t('data.backup')} hint={t('data.backupHint')} />
      <SwitchRow soon value label={t('data.showMaps')} hint={t('data.showMapsHint')} />
      <Text style={styles.note}>{t('data.deleteAccountNote')}</Text>
      <ValueRow soon label={t('data.export')} />
    </SubpageModal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    hand: {
      fontFamily: fonts.hand,
      fontSize: 26,
      lineHeight: 32,
      color: c.ink,
      marginBottom: spacing.lg,
      transform: [{ rotate: '-1deg' }],
    },
    note: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 20,
      color: c.muted,
      marginVertical: spacing.lg,
    },
  });
