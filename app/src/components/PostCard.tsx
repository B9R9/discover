import type { SharedPost } from '@discover/shared';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { blockUser, deletePost, reportPost } from '@/features/social/postsApi';
import type { SocialResult } from '@/features/social/apiClient';
import { formatDay } from '@/lib/format';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';
import { Polaroid } from './Polaroid';

interface PostCardProps {
  post: SharedPost;
  onChanged: () => void;
}

// One shared photo, with what the viewer can do about it: delete their own, report or block another's.
export function PostCard({ post, onChanged }: PostCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [message, setMessage] = useState<{ key: TranslationKey; error: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<SocialResult<true>>, success?: TranslationKey) {
    if (busy) return;
    setBusy(true);
    const result = await action().finally(() => setBusy(false));
    if (!result.ok) return setMessage({ key: result.error, error: true });
    setConfirmBlock(false);
    if (success) setMessage({ key: success, error: false });
    else onChanged();
  }

  const go = (action: () => Promise<SocialResult<true>>, success?: TranslationKey) => () => {
    run(action, success).catch(console.warn);
  };

  return (
    <View style={styles.card}>
      <View style={styles.author}>
        <View style={styles.avatar} accessibilityElementsHidden>
          <Text style={styles.initial}>{post.pseudo.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.pseudo}>{post.pseudo}</Text>
          <Text style={styles.when}>{formatDay(Date.parse(post.createdAt)).toUpperCase()}</Text>
        </View>
      </View>
      <Polaroid
        photoUri={post.photoUrl}
        caption={post.placeName}
        tilt={-1.5}
        accessibilityLabel={t('feed.photoLabel', { pseudo: post.pseudo })}
      />
      {post.comment !== '' && <Text style={styles.comment}>{post.comment}</Text>}
      {confirmBlock ? (
        <>
          <Text style={styles.meta}>{t('feed.blockWarning')}</Text>
          <Button
            label={t('feed.blockConfirm')}
            variant="danger"
            onPress={go(() => blockUser(post.pseudo))}
          />
          <Button
            label={t('personal.cancel')}
            variant="secondary"
            onPress={() => setConfirmBlock(false)}
          />
        </>
      ) : post.mine ? (
        <Button
          label={t('feed.delete')}
          variant="secondary"
          onPress={go(() => deletePost(post.id))}
        />
      ) : (
        <View style={styles.actions}>
          <Button
            label={t('feed.report')}
            variant="secondary"
            onPress={go(() => reportPost(post.id), 'feed.reported')}
          />
          <Button
            label={t('feed.block', { pseudo: post.pseudo })}
            variant="danger"
            onPress={() => setConfirmBlock(true)}
          />
        </View>
      )}
      {message && (
        <Text style={message.error ? styles.error : styles.meta} accessibilityLiveRegion="polite">
          {t(message.key)}
        </Text>
      )}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: { gap: spacing.sm, marginTop: spacing.lg },
    author: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.postal,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initial: { fontFamily: fonts.title, fontSize: 20, color: c.onStamp },
    pseudo: { fontFamily: fonts.stamp, fontSize: 14, color: c.ink },
    when: { fontFamily: fonts.stamp, fontSize: 11, letterSpacing: 1.1, color: c.stamp },
    meta: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    comment: {
      fontFamily: fonts.hand,
      fontSize: 22,
      lineHeight: 28,
      color: c.ink,
      transform: [{ rotate: '-1deg' }],
    },
    actions: { gap: spacing.sm },
    error: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.stamp },
  });
