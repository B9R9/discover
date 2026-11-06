import { MAX_COMMENT_LENGTH, type PlaceId } from '@discover/shared';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useSession } from '@/features/account/useSession';
import { sharePost } from '@/features/social/postsApi';
import { fetchPseudo } from '@/features/social/socialApi';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, radius, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';

interface SharePostFormProps {
  placeId: PlaceId;
  placeName: string;
  photoUri: string;
  onDone: () => void;
  onCancel: () => void;
}

// Nothing leaves the phone before the explicit button: the text says what friends will see.
export function SharePostForm({
  placeId,
  placeName,
  photoUri,
  onDone,
  onCancel,
}: SharePostFormProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const session = useSession();
  const [hasPseudo, setHasPseudo] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  const signedIn = Boolean(session);

  useEffect(() => {
    if (!signedIn) return;
    fetchPseudo()
      .then((result) => setHasPseudo(result.ok && result.value !== null))
      .catch(console.warn);
  }, [signedIn]);

  async function send() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await sharePost(placeId, placeName, comment.trim(), photoUri).finally(() =>
      setBusy(false),
    );
    if (result.ok) onDone();
    else setError(result.error);
  }

  if (session === undefined) return null;
  const blocker: TranslationKey | null = !session
    ? 'share.needAccount'
    : hasPseudo === false
      ? 'share.needPseudo'
      : null;

  return (
    <View style={styles.box}>
      <Text style={styles.title} accessibilityRole="header">
        {t('share.title')}
      </Text>
      {blocker ? (
        <Text style={styles.text}>{t(blocker)}</Text>
      ) : (
        <>
          <Text style={styles.hint}>{t('share.privacy')}</Text>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            accessibilityLabel={t('share.commentLabel')}
            placeholder={t('share.commentLabel')}
            placeholderTextColor={colors.muted}
            maxLength={MAX_COMMENT_LENGTH}
            multiline
          />
          <Button
            label={t('share.confirm')}
            onPress={() => {
              send().catch(console.warn);
            }}
          />
        </>
      )}
      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {t(error)}
        </Text>
      )}
      <Button label={t('personal.cancel')} variant="secondary" onPress={onCancel} />
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    box: { gap: spacing.md },
    title: { fontFamily: fonts.title, fontSize: 22, lineHeight: 28, color: c.ink },
    text: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: c.ink },
    hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    input: {
      fontFamily: fonts.body,
      borderWidth: 1,
      borderColor: c.ink,
      borderRadius: radius.card,
      padding: spacing.md,
      minHeight: 88,
      fontSize: 16,
      color: c.ink,
      backgroundColor: c.paperWhite,
      textAlignVertical: 'top',
    },
    error: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.stamp },
  });
