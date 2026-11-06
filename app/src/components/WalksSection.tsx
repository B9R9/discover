import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { SharedWalk } from '@discover/shared';

import { deleteWalk, reportWalk, type SocialResult } from '@/features/social/walksApi';
import { useWalks } from '@/features/walks/useWalks';
import { formatDistance, formatWalkDuration } from '@/lib/format';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';
import { DrawWalkModal } from './DrawWalkModal';
import { WalkViewerModal } from './WalkViewerModal';

// Walks made by Détour, by the user and by their friends, and the way to draw a new one.
export function WalksSection({ signedIn }: { signedIn: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [walks, reload] = useWalks();
  const [viewed, setViewed] = useState<SharedWalk | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [message, setMessage] = useState<TranslationKey | null>(null);

  async function run(action: () => Promise<SocialResult<true>>, success?: TranslationKey) {
    const result = await action();
    setMessage(result.ok ? (success ?? null) : result.error);
    if (result.ok) reload();
  }
  const go = (action: () => Promise<SocialResult<true>>, success?: TranslationKey) => () => {
    run(action, success).catch(console.warn);
  };

  return (
    <View style={styles.box}>
      {walks.length === 0 && <Text style={styles.hint}>{t('walks.empty')}</Text>}
      {walks.map((walk) => (
        <View key={walk.id} style={styles.row}>
          <Text style={styles.name}>{walk.name}</Text>
          <Text style={styles.hint}>
            {walk.pseudo ? t('walks.by', { pseudo: walk.pseudo }) : t('walks.byDetour')}
            {' · '}
            {t('walks.stats', {
              distance: formatDistance(walk.distanceMeters),
              duration: formatWalkDuration(walk.durationSeconds),
            })}
          </Text>
          <View style={styles.actions}>
            <Button label={t('walks.view')} variant="primary" onPress={() => setViewed(walk)} />
            {signedIn && walk.mine && (
              <Button
                label={t('walks.delete')}
                variant="secondary"
                onPress={go(() => deleteWalk(walk.id))}
              />
            )}
            {signedIn && !walk.mine && walk.pseudo !== null && (
              <Button
                label={t('walks.report')}
                variant="secondary"
                onPress={go(() => reportWalk(walk.id), 'walks.reported')}
              />
            )}
          </View>
        </View>
      ))}
      {message && (
        <Text style={styles.hint} accessibilityLiveRegion="polite">
          {t(message)}
        </Text>
      )}
      {signedIn ? (
        <Button label={t('walks.draw')} onPress={() => setDrawing(true)} />
      ) : (
        <Text style={styles.hint}>{t('walks.signIn')}</Text>
      )}
      <WalkViewerModal walk={viewed} onClose={() => setViewed(null)} />
      <DrawWalkModal
        visible={drawing}
        onClose={() => setDrawing(false)}
        onPublished={() => {
          setDrawing(false);
          setMessage('walks.published');
          reload();
        }}
      />
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    box: { gap: spacing.sm },
    section: {
      fontFamily: fonts.title,
      fontSize: 18,
      lineHeight: 24,
      color: c.ink,
      marginTop: spacing.lg,
    },
    row: { gap: spacing.xs },
    name: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 24, color: c.ink },
    hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  });
