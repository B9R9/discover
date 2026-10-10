import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import {
  finishOnboarding,
  requestBackgroundLocation,
  requestForegroundLocation,
} from '@/features/onboarding/onboarding';
import { t } from '@/lib/i18n/t';
import { palette, spacing } from '@/theme/tokens';

type Step = 'intro' | 'background' | 'denied';

// Each permission is explained before the system asks for it.
export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const db = useSQLiteContext();
  const [step, setStep] = useState<Step>('intro');

  async function finish() {
    await finishOnboarding(db);
    onDone();
  }

  async function askForeground() {
    setStep((await requestForegroundLocation()) ? 'background' : 'denied');
  }

  async function askBackground() {
    await requestBackgroundLocation();
    await finish();
  }

  return (
    <Screen>
      {step === 'intro' && (
        <>
          <ScreenTitle>{t('onboarding.title')}</ScreenTitle>
          <Text style={styles.body}>{t('onboarding.concept')}</Text>
          <Text style={styles.body}>{t('onboarding.locationWhy')}</Text>
          <View style={styles.actions}>
            <Button label={t('onboarding.start')} onPress={askForeground} />
          </View>
        </>
      )}
      {step === 'background' && (
        <>
          <ScreenTitle>{t('onboarding.backgroundTitle')}</ScreenTitle>
          <Text style={styles.body}>{t('onboarding.backgroundWhy')}</Text>
          <View style={styles.actions}>
            <Button label={t('onboarding.backgroundAllow')} onPress={askBackground} />
            <Button label={t('onboarding.later')} onPress={finish} variant="secondary" />
          </View>
        </>
      )}
      {step === 'denied' && (
        <>
          <ScreenTitle>{t('onboarding.deniedTitle')}</ScreenTitle>
          <Text style={styles.body}>{t('onboarding.deniedWhy')}</Text>
          <View style={styles.actions}>
            <Button label={t('onboarding.continue')} onPress={finish} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 16, lineHeight: 24, color: palette.light.text, marginTop: spacing.lg },
  actions: { marginTop: 'auto', gap: spacing.md },
});
