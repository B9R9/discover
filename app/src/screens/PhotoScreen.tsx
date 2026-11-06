import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { PersonalPlaceForm } from '@/components/PersonalPlaceForm';
import { ScreenTitle } from '@/components/ScreenTitle';
import { ValidatedOverlay } from '@/components/ValidatedOverlay';
import {
  captureDiscovery,
  discardShot,
  savePersonalPlace,
  type Shot,
} from '@/features/photo/captureDiscovery';
import { canCreatePersonalPlace, type PlaceDetails } from '@/features/photo/createPersonalPlace';
import { usePlaceInRange } from '@/features/photo/usePlaceInRange';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, radius, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

// No gallery import: a place is only discovered by a photo taken on the spot.
export function PhotoScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const db = useSQLiteContext();
  const router = useRouter();
  const focused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const range = usePlaceInRange(db, focused);
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<TranslationKey | null>(null);
  // A photo taken away from any place, waiting for the user to make it a personal place.
  const [pending, setPending] = useState<Shot | null>(null);
  const [validatedUri, setValidatedUri] = useState<string | null>(null);

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <Screen>
        <ScreenTitle>{t('photo.permissionTitle')}</ScreenTitle>
        <Text style={styles.body}>{t('photo.permissionWhy')}</Text>
        <View style={styles.actions}>
          {permission.canAskAgain ? (
            <Button label={t('photo.permissionAllow')} onPress={requestPermission} />
          ) : (
            <Button label={t('photo.permissionSettings')} onPress={Linking.openSettings} />
          )}
        </View>
      </Screen>
    );
  }

  async function run(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } catch (error) {
      console.warn('Photo failed', error);
      setMessage('photo.failed');
    } finally {
      setBusy(false);
    }
  }

  const capture = () =>
    run(async () => {
      if (!camera.current) return;
      setMessage('photo.checking');
      const { result, shot, photoUri } = await captureDiscovery(db, camera.current);
      if (result.ok) {
        setMessage(null);
        setValidatedUri(photoUri);
        return;
      }
      if (shot && (await canCreatePersonalPlace(db, Date.now()))) {
        setMessage(null);
        setPending(shot);
        return;
      }
      if (shot) discardShot(shot);
      setMessage(shot ? 'personal.limit' : `photo.refused.${result.reason}`);
    });

  const createPlace = (shot: Shot, details: PlaceDetails) =>
    run(async () => {
      const refusal = await savePersonalPlace(db, shot, details);
      if (refusal) setMessage(`personal.refused.${refusal}`);
      else done();
    });

  function done() {
    setPending(null);
    setMessage(null);
    setValidatedUri(null);
    router.navigate('/');
  }

  function cancel() {
    if (pending) discardShot(pending);
    setPending(null);
    setMessage(null);
  }

  const hint = message ?? (range && `photo.${range}`);
  return (
    <View style={styles.screen}>
      {focused && (
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setReady(true)}
        />
      )}
      {/* Android draws edge to edge: the keyboard covers the screen without resizing it. */}
      <KeyboardAvoidingView style={styles.keyboard} behavior="padding">
        <SafeAreaView style={styles.overlay} edges={['top']}>
          {pending ? (
            <PersonalPlaceForm
              title="personal.title"
              submitLabel="personal.create"
              error={message}
              busy={busy}
              onCreate={(details) => {
                createPlace(pending, details).catch(console.warn);
              }}
              onCancel={cancel}
              onEdit={() => setMessage(null)}
            />
          ) : (
            hint && (
              <View style={styles.message}>
                <Text style={styles.messageText} accessibilityLiveRegion="polite">
                  {t(hint)}
                </Text>
              </View>
            )
          )}
          {!pending && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('photo.capture')}
              accessibilityState={{ disabled: !ready || busy }}
              disabled={!ready || busy}
              onPress={() => {
                capture().catch(console.warn);
              }}
              style={({ pressed }) => [
                styles.shutter,
                (pressed || busy) && styles.shutterPressed,
                !ready && styles.shutterDisabled,
              ]}
            />
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
      {validatedUri && <ValidatedOverlay photoUri={validatedUri} onDone={done} />}
    </View>
  );
}

const SHUTTER_SIZE = 76;

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    keyboard: { flex: 1 },
    screen: { flex: 1, backgroundColor: c.ink },
    body: {
      fontFamily: fonts.body,
      fontSize: 16,
      lineHeight: 24,
      color: c.ink,
      marginTop: spacing.lg,
    },
    actions: { marginTop: 'auto' },
    overlay: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.lg,
    },
    message: {
      backgroundColor: c.paperWhite,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    messageText: {
      fontFamily: fonts.body,
      fontSize: 16,
      lineHeight: 24,
      color: c.ink,
      textAlign: 'center',
    },
    shutter: {
      marginTop: 'auto',
      width: SHUTTER_SIZE,
      height: SHUTTER_SIZE,
      borderRadius: radius.round,
      backgroundColor: c.lantern,
      borderWidth: 4,
      borderColor: c.paperWhite,
    },
    shutterPressed: { opacity: 0.8 },
    shutterDisabled: { opacity: 0.5 },
  });
