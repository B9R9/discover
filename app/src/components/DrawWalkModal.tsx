import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { publishWalk } from '@/features/social/walksApi';
import { snapWalk, type SnappedWalk, type Stop } from '@/features/walks/snapWalk';
import { formatDistance } from '@/lib/format';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, radius, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { RoundButton } from './RoundButton';
import { Stamp } from './Stamp';
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

  const counter = snapped
    ? formatDistance(snapped.distanceMeters)
    : t('walks.points', { count: stops.length });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        <SafeAreaView style={styles.screen}>
          {visible && (
            <WalkMap
              path={snapped?.path ?? []}
              stops={stops}
              start={start}
              onPress={(point) => changeStops([...stops, point])}
            />
          )}
          <View style={styles.header} pointerEvents="box-none">
            <RoundButton glyph="←" label={t('walks.back')} onPress={onClose} />
            <View style={styles.titles} pointerEvents="none">
              <Text style={styles.kicker}>{t('walks.new').toUpperCase()}</Text>
              <Text style={styles.title}>{t('walks.drawTitle')}</Text>
            </View>
            <Stamp label={counter} tilt={4} />
          </View>
          <View style={styles.tools} pointerEvents="box-none">
            <RoundButton
              glyph="↶"
              label={t('walks.undo')}
              onPress={() => changeStops(stops.slice(0, -1))}
            />
            <RoundButton glyph="✕" label={t('walks.clear')} onPress={() => changeStops([])} />
          </View>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('walks.drawStep')}</Text>
            {snapped ? (
              <>
                <Text style={styles.label}>{t('walks.titleLabel').toUpperCase()}</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  accessibilityLabel={t('walks.nameLabel')}
                  placeholder={t('walks.nameLabel')}
                  placeholderTextColor={colors.muted}
                  maxLength={80}
                />
                <Text style={styles.hint}>{t('walks.publishHint')}</Text>
              </>
            ) : (
              <Text style={styles.hint}>{t('walks.snapHint')}</Text>
            )}
            {error && (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {t(error)}
              </Text>
            )}
            <Text
              accessibilityRole="button"
              onPress={() => {
                (snapped ? publish() : preview()).catch(console.warn);
              }}
              style={styles.cta}
            >
              {t(snapped ? 'walks.paste' : 'walks.validate').toUpperCase()}
            </Text>
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
    header: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      paddingTop: spacing.xxxl,
    },
    titles: { alignItems: 'center', flexShrink: 1 },
    kicker: { fontFamily: fonts.stamp, fontSize: 11, letterSpacing: 1.8, color: c.stamp },
    title: { fontFamily: fonts.title, fontSize: 22, lineHeight: 26, color: c.ink },
    tools: { position: 'absolute', right: spacing.lg, top: 150, gap: spacing.md },
    sheet: {
      backgroundColor: c.paperWhite,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: spacing.lg + 4,
      gap: spacing.sm,
      elevation: 8,
    },
    sheetTitle: { fontFamily: fonts.hand, fontSize: 26, lineHeight: 30, color: c.ink },
    label: { fontFamily: fonts.stamp, fontSize: 11, letterSpacing: 1.5, color: c.stamp },
    input: {
      minHeight: 48,
      borderWidth: 2,
      borderColor: c.ink,
      borderRadius: radius.card,
      backgroundColor: c.paperWhite,
      paddingHorizontal: spacing.lg,
      fontFamily: fonts.title,
      fontSize: 20,
      color: c.ink,
    },
    hint: { fontFamily: fonts.stamp, fontSize: 12, lineHeight: 17, color: c.ink },
    error: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.stamp },
    cta: {
      minHeight: 52,
      textAlignVertical: 'center',
      textAlign: 'center',
      borderRadius: radius.card,
      backgroundColor: c.stamp,
      color: c.onStamp,
      fontFamily: fonts.stamp,
      fontSize: 15,
      letterSpacing: 0.9,
      overflow: 'hidden',
    },
  });
