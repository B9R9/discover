import type { SharedWalk } from '@discover/shared';
import { useMemo } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatDistance, formatWalkDuration } from '@/lib/format';
import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';
import { WalkMap } from './WalkMap';

// A published walk on the map, read only.
export function WalkViewerModal({
  walk,
  onClose,
}: {
  walk: SharedWalk | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Modal visible={walk !== null} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        {walk && (
          <>
            <View style={styles.header}>
              <View style={styles.titles}>
                <Text style={styles.title} accessibilityRole="header">
                  {walk.name}
                </Text>
                <Text style={styles.meta}>
                  {t('walks.stats', {
                    distance: formatDistance(walk.distanceMeters),
                    duration: formatWalkDuration(walk.durationSeconds),
                  })}
                </Text>
              </View>
              <Button label={t('walks.close')} variant="secondary" onPress={onClose} />
            </View>
            <WalkMap path={walk.path} />
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.paper },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      padding: spacing.lg,
    },
    titles: { flexShrink: 1 },
    title: { fontFamily: fonts.title, fontSize: 22, lineHeight: 28, color: c.ink },
    meta: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
  });
