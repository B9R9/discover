import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { isValidPseudo } from '@discover/shared';

import { savePseudo } from '@/features/social/socialApi';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, radius, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';

// First social action: the pseudo is what friends search for. Nothing else is asked.
export function PseudoForm({ onSaved }: { onSaved: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [pseudo, setPseudo] = useState('');
  const [error, setError] = useState<TranslationKey | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (busy) return;
    const value = pseudo.trim().toLowerCase();
    if (!isValidPseudo(value)) return setError('circle.error.invalidPseudo');
    setBusy(true);
    setError(null);
    const result = await savePseudo(value).finally(() => setBusy(false));
    if (result.ok) onSaved();
    else setError(result.error);
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title} accessibilityRole="header">
        {t('circle.pseudoTitle')}
      </Text>
      <Text style={styles.hint}>{t('circle.pseudoHint')}</Text>
      <TextInput
        style={styles.input}
        value={pseudo}
        onChangeText={setPseudo}
        accessibilityLabel={t('circle.pseudoLabel')}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
        returnKeyType="done"
        onSubmitEditing={() => {
          save().catch(console.warn);
        }}
      />
      <Button
        label={t('circle.pseudoSave')}
        onPress={() => {
          save().catch(console.warn);
        }}
      />
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
    box: { gap: spacing.md, marginTop: spacing.xl },
    title: { fontFamily: fonts.title, fontSize: 22, lineHeight: 28, color: c.ink },
    hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
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
    error: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.stamp },
  });
