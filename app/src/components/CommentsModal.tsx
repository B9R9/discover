import type { PostComment, SharedPost } from '@discover/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  addComment,
  fetchComments,
  removeComment,
  type SocialResult,
} from '@/features/social/postCommentsApi';
import { MAX_POST_COMMENT } from '@discover/shared';
import { formatDay } from '@/lib/format';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Polaroid } from './Polaroid';
import { SubpageModal } from './SubpageModal';

interface CommentsModalProps {
  post: SharedPost | null;
  onClose: () => void;
}

// The short comments under a friend's post, and a field to leave one.
export function CommentsModal({ post, onClose }: CommentsModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<TranslationKey | null>(null);
  const [busy, setBusy] = useState(false);
  const postId = post?.id;

  const reload = useCallback(() => {
    if (!postId) return;
    fetchComments(postId)
      .then((result) => (result.ok ? setComments(result.value) : setError(result.error)))
      .catch(console.warn);
  }, [postId]);
  // The screen remounts this modal per post (key), so the state starts fresh for each one.
  useEffect(reload, [reload]);

  async function run(action: () => Promise<SocialResult<true>>) {
    if (busy) return;
    setBusy(true);
    const result = await action().finally(() => setBusy(false));
    if (!result.ok) return setError(result.error);
    setError(null);
    reload();
  }

  const send = () => {
    const text = draft.trim();
    if (!post || text === '') return;
    run(async () => {
      const result = await addComment(post.id, text);
      if (result.ok) setDraft('');
      return result;
    }).catch(console.warn);
  };

  return (
    <SubpageModal
      visible={post !== null}
      kicker={t('comments.kicker', { count: comments.length })}
      title={post?.placeName || t('profile.unknownPlace')}
      onClose={onClose}
    >
      {post && (
        <Text style={styles.page}>{t('comments.page', { pseudo: post.pseudo }).toUpperCase()}</Text>
      )}
      {post && (
        <View style={styles.photo}>
          <Polaroid
            photoUri={post.photoUrl}
            caption={post.placeName}
            tilt={-3}
            accessibilityLabel={t('feed.photoLabel', { pseudo: post.pseudo })}
          />
        </View>
      )}
      {comments.length === 0 && <Text style={styles.empty}>{t('comments.empty')}</Text>}
      {comments.map((comment, index) => (
        <View
          key={comment.id}
          style={[styles.note, { transform: [{ rotate: `${index % 2 === 0 ? -0.6 : 0.5}deg` }] }]}
        >
          <View style={styles.head}>
            <Text style={styles.pseudo}>
              {comment.pseudo}
              {comment.byPostAuthor && (
                <Text style={styles.author}>{` · ${t('comments.author')}`}</Text>
              )}
            </Text>
            <Text style={styles.when}>
              {formatDay(Date.parse(comment.createdAt)).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.text}>{comment.text}</Text>
          {(comment.mine || post?.mine) && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                run(() => removeComment(comment.id)).catch(console.warn);
              }}
              style={styles.remove}
            >
              <Text style={styles.removeText}>{t('comments.remove')}</Text>
            </Pressable>
          )}
        </View>
      ))}
      {error && <Text style={styles.error}>{t(error)}</Text>}
      <Text style={styles.label}>{t('comments.yours').toUpperCase()}</Text>
      <View style={styles.compose}>
        <TextInput
          accessibilityLabel={t('comments.yours')}
          value={draft}
          onChangeText={setDraft}
          maxLength={MAX_POST_COMMENT}
          placeholder={t('comments.placeholder')}
          placeholderTextColor={colors.muted}
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('comments.send')}
          onPress={send}
          style={styles.send}
        >
          <Text style={styles.sendGlyph}>➤</Text>
        </Pressable>
      </View>
    </SubpageModal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    page: {
      fontFamily: fonts.stamp,
      fontSize: 12,
      letterSpacing: 1.9,
      color: c.ink,
      marginTop: spacing.xs,
    },
    photo: { width: 160, marginTop: spacing.md, marginLeft: spacing.sm },
    empty: {
      fontFamily: fonts.hand,
      fontSize: 24,
      lineHeight: 28,
      color: c.ink,
      marginTop: spacing.lg,
    },
    note: {
      backgroundColor: c.paperWhite,
      padding: spacing.md,
      marginTop: spacing.md,
      shadowColor: c.ink,
      shadowOpacity: 0.18,
      shadowRadius: 5,
      elevation: 2,
    },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    pseudo: { fontFamily: fonts.stamp, fontSize: 13, color: c.ink },
    author: { color: c.postalText },
    when: { fontFamily: fonts.stamp, fontSize: 11, color: c.stamp },
    text: {
      fontFamily: fonts.hand,
      fontSize: 24,
      lineHeight: 28,
      color: c.ink,
      marginTop: spacing.xs,
    },
    remove: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' },
    removeText: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: c.muted,
      textDecorationLine: 'underline',
    },
    error: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 20,
      color: c.stamp,
      marginTop: spacing.sm,
    },
    label: {
      fontFamily: fonts.stamp,
      fontSize: 11,
      letterSpacing: 1.5,
      color: c.stamp,
      marginTop: spacing.xl,
    },
    compose: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
      marginBottom: spacing.xl,
    },
    input: {
      flex: 1,
      minHeight: 52,
      borderWidth: 2,
      borderColor: c.ink,
      borderRadius: 4,
      backgroundColor: c.paperWhite,
      paddingHorizontal: spacing.md,
      fontFamily: fonts.hand,
      fontSize: 22,
      color: c.ink,
    },
    send: {
      width: 52,
      minHeight: 52,
      borderRadius: 4,
      backgroundColor: c.stamp,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendGlyph: { fontSize: 20, color: c.onStamp },
  });
