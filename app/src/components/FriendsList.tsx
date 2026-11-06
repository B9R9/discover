import type { FriendList } from '@discover/shared';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { acceptRequest, removeFriend, type SocialResult } from '@/features/social/socialApi';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';

interface FriendsListProps {
  list: FriendList;
  onChanged: () => void;
  onOpenMap: (pseudo: string) => void;
}

// Friends, then the requests waiting for an answer, each with the one or two actions that make sense.
export function FriendsList({ list, onChanged, onOpenMap }: FriendsListProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<SocialResult<true>>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await action().finally(() => setBusy(false));
    if (result.ok) onChanged();
    else setError(result.error);
  }

  const row = (
    pseudo: string,
    actions: {
      label: TranslationKey;
      run: () => Promise<SocialResult<true>>;
      primary?: boolean;
    }[],
    extra?: React.ReactNode,
  ) => (
    <View key={pseudo} style={styles.row}>
      <Text style={styles.pseudo}>{pseudo}</Text>
      <View style={styles.actions}>
        {actions.map((action) => (
          <Button
            key={action.label}
            label={t(action.label)}
            variant={action.primary ? 'primary' : 'secondary'}
            onPress={() => {
              run(action.run).catch(console.warn);
            }}
          />
        ))}
        {extra}
      </View>
    </View>
  );

  return (
    <View style={styles.box}>
      {list.incoming.length > 0 && (
        <>
          <Text style={styles.section} accessibilityRole="header">
            {t('circle.incoming')}
          </Text>
          {list.incoming.map((pseudo) =>
            row(pseudo, [
              { label: 'circle.accept', run: () => acceptRequest(pseudo), primary: true },
              { label: 'circle.decline', run: () => removeFriend(pseudo) },
            ]),
          )}
        </>
      )}
      <Text style={styles.section} accessibilityRole="header">
        {t('circle.friends')}
      </Text>
      {list.friends.length === 0 ? (
        <Text style={styles.hint}>{t('circle.noFriends')}</Text>
      ) : (
        list.friends.map((pseudo) =>
          row(
            pseudo,
            [{ label: 'circle.remove', run: () => removeFriend(pseudo) }],
            <Button
              label={t('circle.viewMap')}
              variant="primary"
              onPress={() => onOpenMap(pseudo)}
            />,
          ),
        )
      )}
      {list.outgoing.length > 0 && (
        <>
          <Text style={styles.section} accessibilityRole="header">
            {t('circle.outgoing')}
          </Text>
          {list.outgoing.map((pseudo) =>
            row(pseudo, [{ label: 'circle.cancel', run: () => removeFriend(pseudo) }]),
          )}
        </>
      )}
      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {t(error)}
        </Text>
      )}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    box: { gap: spacing.md },
    section: {
      fontFamily: fonts.title,
      fontSize: 18,
      lineHeight: 24,
      color: c.ink,
      marginTop: spacing.lg,
    },
    row: { gap: spacing.sm },
    pseudo: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 24, color: c.ink },
    actions: { flexDirection: 'row', gap: spacing.sm },
    hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    error: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.stamp },
  });
