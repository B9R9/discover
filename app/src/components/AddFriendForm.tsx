import { isValidPseudo } from '@discover/shared';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { sendRequest } from '@/features/social/socialApi';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, radius, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';

// Invites by exact pseudo: there is no directory to browse, so nobody can be found by guessing.
export function AddFriendForm({ onSent }: { onSent: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [pseudo, setPseudo] = useState('');
  const [message, setMessage] = useState<{ key: TranslationKey; error: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (busy) return;
    const value = pseudo.trim().toLowerCase();
    if (!isValidPseudo(value))
      return setMessage({ key: 'circle.error.invalidPseudo', error: true });
    setBusy(true);
    setMessage(null);
    const result = await sendRequest(value).finally(() => setBusy(false));
    if (result.ok) {
      setPseudo('');
      setMessage({ key: 'circle.sent', error: false });
      onSent();
    } else {
      setMessage({ key: result.error, error: true });
    }
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title} accessibilityRole="header">
        {t('circle.add')}
      </Text>
      <TextInput
        style={styles.input}
        value={pseudo}
        onChangeText={setPseudo}
        accessibilityLabel={t('circle.addLabel')}
        placeholder={t('circle.addLabel')}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
        returnKeyType="send"
        onSubmitEditing={() => {
          send().catch(console.warn);
        }}
      />
      <Button
        label={t('circle.addSend')}
        onPress={() => {
          send().catch(console.warn);
        }}
      />
      {message && (
        <Text style={message.error ? styles.error : styles.hint} accessibilityLiveRegion="polite">
          {t(message.key)}
        </Text>
      )}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    box: { gap: spacing.md, marginTop: spacing.xl },
    title: { fontFamily: fonts.title, fontSize: 18, lineHeight: 24, color: c.ink },
    input: {
      fontFamily: fonts.body,
      borderWidth: 1,
      borderColor: c.ink,
      borderRadius: radius.card,
      paddingHorizontal: spacing.md,
      minHeight: 44,
      fontSize: 16,
      color: c.ink,
      backgroundColor: c.paperWhite,
    },
    hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    error: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.stamp },
  });
