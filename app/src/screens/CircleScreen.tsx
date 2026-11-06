import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text } from 'react-native';

import { AddFriendForm } from '@/components/AddFriendForm';
import { Button } from '@/components/Button';
import { FriendsList } from '@/components/FriendsList';
import { PseudoForm } from '@/components/PseudoForm';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useSession } from '@/features/account/useSession';
import { useCircle } from '@/features/social/useCircle';
import { t } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

// The circle needs an account: the game itself never does.
export function CircleScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const session = useSession();
  const [circle, reload] = useCircle(Boolean(session));

  return (
    <Screen edges={['top', 'right', 'left']}>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboard}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <ScreenTitle>{t('circle.title')}</ScreenTitle>
          {session === null && (
            <>
              <Text style={styles.text}>{t('circle.signedOut')}</Text>
              <Button label={t('circle.signIn')} onPress={() => router.navigate('/profile')} />
            </>
          )}
          {session && circle.error && <Text style={styles.error}>{t(circle.error)}</Text>}
          {session && !circle.loading && !circle.error && circle.pseudo === null && (
            <PseudoForm onSaved={reload} />
          )}
          {session && circle.pseudo !== null && (
            <>
              <Text style={styles.text}>{t('circle.you', { pseudo: circle.pseudo })}</Text>
              <FriendsList list={circle.list} onChanged={reload} />
              <AddFriendForm onSent={reload} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  });
