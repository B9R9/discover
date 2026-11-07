import { MAX_SHARE_COMMENT, MAX_SHARE_FRIENDS } from '@discover/shared';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { PersonalPlace } from '@/db/personalPlaces';
import { useSession } from '@/features/account/useSession';
import { sharePlace } from '@/features/social/placeSharesApi';
import { fetchFriends } from '@/features/social/socialApi';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, radius, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';
import { FilterChip } from './FilterChip';

// Sends a place of the user (private or public) to friends they pick. The exact position goes with it:
// the text says so and nothing is sent before the confirm button.
export function SharePlace({ place }: { place: PersonalPlace }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  const signedIn = Boolean(session);

  useEffect(() => {
    if (!signedIn || !open) return;
    fetchFriends()
      .then((result) => result.ok && setFriends(result.value.friends))
      .catch(console.warn);
  }, [signedIn, open]);

  function toggle(pseudo: string) {
    setChosen((current) =>
      current.includes(pseudo)
        ? current.filter((p) => p !== pseudo)
        : current.length < MAX_SHARE_FRIENDS
          ? [...current, pseudo]
          : current,
    );
  }

  async function send() {
    if (busy || chosen.length === 0) return;
    setBusy(true);
    setError(null);
    const result = await sharePlace(place, comment.trim(), chosen).finally(() => setBusy(false));
    if (result.ok) {
      setSent(true);
      setOpen(false);
      setChosen([]);
      setComment('');
    } else setError(result.error);
  }

  if (!signedIn) return <Text style={styles.hint}>{t('sharePlace.signIn')}</Text>;
  if (!open) {
    return (
      <View style={styles.box}>
        {sent && <Text style={styles.hint}>{t('sharePlace.done')}</Text>}
        <Button
          label={t('sharePlace.button')}
          onPress={() => {
            setSent(false);
            setOpen(true);
          }}
        />
      </View>
    );
  }
  return (
    <View style={styles.box}>
      <Text style={styles.hint}>{t('sharePlace.hint')}</Text>
      {friends.length === 0 ? (
        <Text style={styles.hint}>{t('sharePlace.noFriends')}</Text>
      ) : (
        <View style={styles.chips}>
          {friends.map((pseudo) => (
            <FilterChip
              key={pseudo}
              label={pseudo}
              selected={chosen.includes(pseudo)}
              onPress={() => toggle(pseudo)}
            />
          ))}
        </View>
      )}
      <TextInput
        accessibilityLabel={t('share.commentLabel')}
        placeholder={t('share.commentLabel')}
        placeholderTextColor={colors.muted}
        value={comment}
        onChangeText={setComment}
        maxLength={MAX_SHARE_COMMENT}
        multiline
        style={styles.input}
      />
      {error && <Text style={styles.error}>{t(error)}</Text>}
      {chosen.length > 0 && (
        <Button
          label={t('sharePlace.confirm', { count: chosen.length })}
          onPress={() => void send()}
        />
      )}
      <Button label={t('personal.cancel')} variant="secondary" onPress={() => setOpen(false)} />
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    box: { gap: spacing.sm },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    error: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.stamp },
    input: {
      minHeight: 72,
      borderWidth: 2,
      borderColor: c.ink,
      borderRadius: radius.card,
      padding: spacing.md,
      fontFamily: fonts.body,
      fontSize: 16,
      color: c.ink,
      backgroundColor: c.paperWhite,
      textAlignVertical: 'top',
    },
  });
