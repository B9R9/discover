import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text } from 'react-native';

import { AddFriendForm } from '@/components/AddFriendForm';
import { AccountSection } from '@/components/AccountSection';
import { FriendMapModal } from '@/components/FriendMapModal';
import { FriendsList } from '@/components/FriendsList';
import { MyMapSection } from '@/components/MyMapSection';
import { PostCard } from '@/components/PostCard';
import { PseudoForm } from '@/components/PseudoForm';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useSession } from '@/features/account/useSession';
import { useCircle } from '@/features/social/useCircle';
import { useFeed } from '@/features/social/useFeed';
import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

// The circle needs an account: the game itself never does.
export function CircleScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const session = useSession();
  const [circle, reload] = useCircle(Boolean(session));
  const [posts, reloadFeed] = useFeed(Boolean(session));
  const [mapOf, setMapOf] = useState<string | null>(null);

  return (
    <Screen edges={['top', 'right', 'left']}>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboard}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <ScreenTitle>{t('circle.title')}</ScreenTitle>
          {session === null && (
            <>
              <Text style={styles.text}>{t('circle.signedOut')}</Text>
              <AccountSection />
            </>
          )}
          {session && circle.error && <Text style={styles.error}>{t(circle.error)}</Text>}
          {session && !circle.loading && !circle.error && circle.pseudo === null && (
            <PseudoForm onSaved={reload} />
          )}
          {session && circle.pseudo !== null && (
            <>
              <Text style={styles.text}>{t('circle.you', { pseudo: circle.pseudo })}</Text>
              <Text style={styles.section} accessibilityRole="header">
                {t('feed.title')}
              </Text>
              {posts.length === 0 && <Text style={styles.hint}>{t('feed.empty')}</Text>}
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onChanged={() => {
                    reloadFeed();
                    reload();
                  }}
                />
              ))}
              <FriendsList list={circle.list} onChanged={reload} onOpenMap={setMapOf} />
              <MyMapSection />
              <AddFriendForm onSent={reload} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <FriendMapModal pseudo={mapOf} onClose={() => setMapOf(null)} />
    </Screen>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    keyboard: { flex: 1 },
    text: {
      fontFamily: fonts.body,
      fontSize: 16,
      lineHeight: 24,
      color: c.ink,
      marginVertical: spacing.lg,
    },
    error: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.stamp },
    hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    section: {
      fontFamily: fonts.title,
      fontSize: 18,
      lineHeight: 24,
      color: c.ink,
      marginTop: spacing.lg,
    },
  });
