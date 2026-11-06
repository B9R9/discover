import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  deleteAccount,
  requestCode,
  signOut,
  verifyCode,
  type AccountResult,
} from '@/features/account/account';
import { useSession } from '@/features/account/useSession';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { palette, radius, spacing } from '@/theme/tokens';

import { Button } from './Button';

type Step = 'email' | 'code';

// Optional account: the game works the same without one.
export function AccountSection() {
  const session = useSession();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [notice, setNotice] = useState<TranslationKey | null>(null);

  async function run(action: () => Promise<AccountResult>, onSuccess: () => void) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await action();
      if (result.ok) onSuccess();
      else setError(result.error);
    } catch {
      setError('account.error.network');
    } finally {
      setBusy(false);
    }
  }

  const sendCode = () =>
    run(
      () => requestCode(email),
      () => {
        setCode('');
        setStep('code');
      },
    );
  const signIn = () =>
    run(
      () => verifyCode(email, code),
      () => {},
    );

  if (session === undefined) return null;

  const signedInEmail = session?.user.email;
  return (
    <View style={styles.section}>
      <Text style={styles.title} accessibilityRole="header">
        {t('account.title')}
      </Text>
      {session ? (
        <>
          <Text style={styles.text}>{t('account.signedInAs', { email: signedInEmail ?? '' })}</Text>
          {confirmDelete ? (
            <>
              <Text style={styles.text}>{t('account.deleteWarning')}</Text>
              <Button
                label={t('account.deleteConfirm')}
                variant="danger"
                onPress={() =>
                  run(deleteAccount, () => {
                    setConfirmDelete(false);
                    setStep('email');
                    setNotice('account.deleted');
                  })
                }
              />
              <Button
                label={t('account.cancel')}
                variant="secondary"
                onPress={() => setConfirmDelete(false)}
              />
            </>
          ) : (
            <>
              <Button
                label={t('account.signOut')}
                variant="secondary"
                onPress={() => run(signOut, () => setStep('email'))}
              />
              <Button
                label={t('account.delete')}
                variant="danger"
                onPress={() => setConfirmDelete(true)}
              />
            </>
          )}
        </>
      ) : step === 'email' ? (
        <>
          <Text style={styles.hint}>{t('account.why')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('account.emailPlaceholder')}
            placeholderTextColor={palette.light.textMuted}
            accessibilityLabel={t('account.emailLabel')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={sendCode}
          />
          <Button label={t('account.sendCode')} onPress={sendCode} />
        </>
      ) : (
        <>
          <Text style={styles.hint}>{t('account.codeSent', { email: email.trim() })}</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            accessibilityLabel={t('account.codeLabel')}
            placeholder="123456"
            placeholderTextColor={palette.light.textMuted}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={signIn}
          />
          <Button label={t('account.verify')} onPress={signIn} />
          <Button
            label={t('account.changeEmail')}
            variant="secondary"
            onPress={() => {
              setError(null);
              setStep('email');
            }}
          />
        </>
      )}
      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {t(error)}
        </Text>
      )}
      {notice && (
        <Text style={styles.hint} accessibilityLiveRegion="polite">
          {t(notice)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md, marginTop: spacing.xxl },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '600', color: palette.light.text },
  text: { fontSize: 16, lineHeight: 24, color: palette.light.text },
  hint: { fontSize: 14, lineHeight: 20, color: palette.light.textMuted },
  input: {
    borderWidth: 1,
    borderColor: palette.light.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    fontSize: 16,
    color: palette.light.text,
  },
  error: { fontSize: 14, lineHeight: 20, color: palette.state.error },
});
