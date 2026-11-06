import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { publishWalk } from '@/features/social/walksApi';
import { snapWalk, type SnappedWalk, type Stop } from '@/features/walks/snapWalk';
import { formatDistance, formatWalkDuration } from '@/lib/format';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, radius, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';
import { WalkMap } from './WalkMap';

const SNAP_ERRORS: Record<string, TranslationKey> = {
  'too-few-points': 'walk.error.tooFew',
  'no-key': 'walk.error.noKey',
  failed: 'walk.error.failed',
};

interface DrawWalkModalProps {
  visible: boolean;
  onClose: () => void;
  onPublished: () => void;
}

// Draw: tap the map to put stops, see the walk snapped to footpaths, name it, publish it to friends.
export function DrawWalkModal({ visible, onClose, onPublished }: DrawWalkModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [snapped, setSnapped] = useState<SnappedWalk | null>(null);
  const [name, setName] = useState('');
  const [start, setStart] = useState<Stop | null>(null);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    Location.getLastKnownPositionAsync()
      .then((position) => {
        if (position) setStart([position.coords.longitude, position.coords.latitude]);
      })
      .catch(console.warn);
  }, [visible]);

  function changeStops(next: Stop[]) {
    setStops(next);
    // A new point makes the snapped walk out of date.
    setSnapped(null);
    setError(null);
  }

  async function preview() {
    if (busy) return;
    setBusy(true);
    const result = await snapWalk(stops).finally(() => setBusy(false));
    if (result.kind === 'walk') setSnapped(result.walk);
    else setError(SNAP_ERRORS[result.kind] ?? 'walk.error.failed');
  }

  async function publish() {
    if (busy || !snapped) return;
    setBusy(true);
    const result = await publishWalk(name.trim(), snapped.path).finally(() => setBusy(false));
    if (!result.ok) return setError(result.error);
    setStops([]);
    setSnapped(null);
    setName('');
    onPublished();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        <SafeAreaView style={styles.screen}>
          <Text style={styles.hint}>{t('walks.drawHint')}</Text>
          {visible && (
            <WalkMap
              path={snapped?.path ?? []}
              stops={stops}
              start={start}
              onPress={(point) => changeStops([...stops, point])}
            />
          )}
          <View style={styles.panel}>
            {snapped && (
              <>
                <Text style={styles.hint}>
                  {t('walks.stats', {
                    distance: formatDistance(snapped.distanceMeters),
                    duration: formatWalkDuration(snapped.durationSeconds),
                  })}
                </Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('walks.nameLabel')}
                  placeholderTextColor={colors.muted}
                  accessibilityLabel={t('walks.nameLabel')}
                  maxLength={80}
                />
                <Text style={styles.hint}>{t('walks.publishHint')}</Text>
              </>
            )}
            {error && <Text style={styles.error}>{t(error)}</Text>}
            <View style={styles.actions}>
              {snapped ? (
                <Button
                  label={t('walks.publish')}
                  variant="primary"
                  onPress={() => {
                    publish().catch(console.warn);
                  }}
                />
              ) : (
                <Button
                  label={t('walks.snap')}
                  variant="primary"
                  onPress={() => {
                    preview().catch(console.warn);
                  }}
                />
              )}
              <Button
                label={t('walks.undo')}
                variant="secondary"
                onPress={() => changeStops(stops.slice(0, -1))}
              />
              <Button label={t('walks.close')} variant="secondary" onPress={onClose} />
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    fill: { flex: 1 },
    screen: { flex: 1, backgroundColor: c.paper },
    hint: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 20,
      color: c.muted,
      padding: spacing.md,
    },
    panel: { padding: spacing.lg, gap: spacing.sm },
    input: {
      fontFamily: fonts.body,
      fontSize: 16,
      color: c.ink,
      borderWidth: 1,
      borderColor: c.ink,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    error: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.stamp },
    actions: { gap: spacing.sm },
  });
