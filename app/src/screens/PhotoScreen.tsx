import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { PersonalPlaceForm } from '@/components/PersonalPlaceForm';
import { ScreenTitle } from '@/components/ScreenTitle';
import type { Visibility } from '@/db/personalPlaces';
import {
  captureDiscovery,
  discardShot,
  savePersonalPlace,
  type Shot,
} from '@/features/photo/captureDiscovery';
import { canCreatePersonalPlace } from '@/features/photo/createPersonalPlace';
import { usePlaceInRange } from '@/features/photo/usePlaceInRange';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { palette, radius, spacing } from '@/theme/tokens';

// No gallery import: a place is only discovered by a photo taken on the spot.
export function PhotoScreen() {
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
      const { result, shot } = await captureDiscovery(db, camera.current);
      if (result.ok) return done();
      if (shot && (await canCreatePersonalPlace(db, Date.now()))) {
        setMessage(null);
        setPending(shot);
        return;
      }
      if (shot) discardShot(shot);
      setMessage(shot ? 'personal.limit' : `photo.refused.${result.reason}`);
    });

  const createPlace = (shot: Shot, name: string, visibility: Visibility) =>
    run(async () => {
      const refusal = await savePersonalPlace(db, shot, name, visibility);
      if (refusal) setMessage(`personal.refused.${refusal}`);
      else done();
    });

  function done() {
    setPending(null);
    setMessage(null);
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
      <SafeAreaView style={styles.overlay} edges={['top']}>
        {pending ? (
          <PersonalPlaceForm
            error={message}
            busy={busy}
            onCreate={(name, visibility) => {
              createPlace(pending, name, visibility).catch(console.warn);
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
    </View>
  );
}

const SHUTTER_SIZE = 76;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.light.text },
  body: { fontSize: 16, lineHeight: 24, color: palette.light.text, marginTop: spacing.lg },
  actions: { marginTop: 'auto' },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  message: {
    backgroundColor: palette.light.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  messageText: { fontSize: 16, lineHeight: 24, color: palette.light.text, textAlign: 'center' },
  shutter: {
    marginTop: 'auto',
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: radius.pill,
    backgroundColor: palette.light.accent,
    borderWidth: 4,
    borderColor: palette.light.surface,
  },
  shutterPressed: { opacity: 0.8 },
  shutterDisabled: { opacity: 0.5 },
});
