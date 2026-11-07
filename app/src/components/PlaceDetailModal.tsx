import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DiscoveryWithPhoto } from '@/db/discoveries';
import { getPersonalPlace, type PersonalPlace } from '@/db/personalPlaces';
import { editPersonalPlace, type PlaceDetails } from '@/features/photo/createPersonalPlace';
import { removePersonalPlace } from '@/features/photo/managePersonalPlace';
import { categoryLabel, formatDay } from '@/lib/format';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';
import { Polaroid } from './Polaroid';
import { ProposeSpot } from './ProposeSpot';
import { PersonalPlaceForm } from './PersonalPlaceForm';
import { RoundButton } from './RoundButton';
import { SharePlace } from './SharePlace';
import { SharePostForm } from './SharePostForm';
import { Stamp } from './Stamp';

interface PlaceDetailModalProps {
  discovery: DiscoveryWithPhoto | null;
  onClose: () => void;
  onChanged: () => void;
}

type Mode = 'view' | 'edit' | 'confirmDelete' | 'share';

// Server places open read-only: only places the user created can be edited or deleted.
export function PlaceDetailModal({ discovery, onClose, onChanged }: PlaceDetailModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const db = useSQLiteContext();
  const [personal, setPersonal] = useState<PersonalPlace | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [error, setError] = useState<TranslationKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<TranslationKey | null>(null);
  const placeId = discovery?.placeId;

  // The screen remounts this modal per place (key), so the state starts fresh for each one.
  useEffect(() => {
    if (placeId) getPersonalPlace(db, placeId).then(setPersonal).catch(console.warn);
  }, [db, placeId]);

  async function run(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } catch (failure) {
      console.warn('Place change failed', failure);
      setError('photo.failed');
    } finally {
      setBusy(false);
    }
  }

  const save = (details: PlaceDetails) =>
    run(async () => {
      if (!personal) return;
      const refusal = await editPersonalPlace(db, personal.id, details);
      if (refusal) return setError(`personal.refused.${refusal}`);
      setPersonal(await getPersonalPlace(db, personal.id));
      setMode('view');
      onChanged();
    });

  const remove = () =>
    run(async () => {
      if (!personal) return;
      await removePersonalPlace(db, personal.id);
      onChanged();
      onClose();
    });

  const name = personal?.name ?? discovery?.name ?? t('profile.unknownPlace');
  return (
    <Modal visible={discovery !== null} animationType="slide" onRequestClose={onClose}>
      {/* Android draws edge to edge: the keyboard covers the screen without resizing it. */}
      <KeyboardAvoidingView style={styles.keyboard} behavior="padding">
        <SafeAreaView style={styles.screen}>
          {discovery && mode === 'edit' && personal ? (
            <PersonalPlaceForm
              title="personal.editTitle"
              submitLabel="personal.save"
              initial={personal}
              error={error}
              busy={busy}
              onCreate={(details) => {
                save(details).catch(console.warn);
              }}
              onCancel={() => setMode('view')}
              onEdit={() => setError(null)}
            />
          ) : discovery && mode === 'share' ? (
            <ScrollView keyboardShouldPersistTaps="handled">
              <SharePostForm
                placeId={discovery.placeId}
                placeName={name}
                photoUri={discovery.photoUri}
                onDone={() => {
                  setMode('view');
                  setNotice('share.done');
                }}
                onCancel={() => setMode('view')}
              />
            </ScrollView>
          ) : (
            discovery && (
              <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.top}>
                  <RoundButton glyph="‹" label={t('subpage.back')} onPress={onClose} />
                  <Text style={styles.kicker}>{t('place.kicker').toUpperCase()}</Text>
                </View>
                <View style={styles.polaroid}>
                  <Polaroid
                    photoUri={discovery.photoUri}
                    caption={formatDay(discovery.discoveredAt)}
                    tilt={-3}
                    accessibilityLabel={name}
                  />
                </View>
                <Text style={styles.kicker}>
                  {`${categoryLabel(discovery.category)} · ${t('place.discoveredOn', {
                    date: formatDay(discovery.discoveredAt),
                  })}`.toUpperCase()}
                </Text>
                <Text accessibilityRole="header" style={styles.name}>
                  {name}
                </Text>
                <Stamp label={t('places.discovered')} tilt={-6} />
                {error && <Text style={styles.error}>{t(error)}</Text>}
                {notice && <Text style={styles.meta}>{t(notice)}</Text>}
                {mode === 'confirmDelete' && (
                  <Text style={styles.warning}>{t('place.deleteWarning')}</Text>
                )}
                <View style={styles.actions}>
                  {personal && mode === 'view' && (
                    <>
                      <Button label={t('place.edit')} onPress={() => setMode('edit')} />
                      <Button
                        label={t('place.delete')}
                        variant="secondary"
                        onPress={() => setMode('confirmDelete')}
                      />
                    </>
                  )}
                  {personal && mode === 'confirmDelete' && (
                    <>
                      <Button
                        label={t('place.deleteConfirm')}
                        variant="danger"
                        onPress={() => {
                          remove().catch(console.warn);
                        }}
                      />
                      <Button
                        label={t('personal.cancel')}
                        variant="secondary"
                        onPress={() => setMode('view')}
                      />
                    </>
                  )}
                  {personal && mode === 'view' && <SharePlace place={personal} />}
                  {personal?.visibility === 'public' && personal.genre && mode === 'view' && (
                    <ProposeSpot place={personal} />
                  )}
                  {mode === 'view' && (
                    <Button
                      label={t('share.button')}
                      onPress={() => {
                        setNotice(null);
                        setMode('share');
                      }}
                    />
                  )}
                  {mode === 'view' && (
                    <Button label={t('place.close')} variant="secondary" onPress={onClose} />
                  )}
                </View>
              </ScrollView>
            )
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    keyboard: { flex: 1 },
    screen: { flex: 1, backgroundColor: c.paper, padding: spacing.lg },
    content: { gap: spacing.md },
    polaroid: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    kicker: { fontFamily: fonts.stamp, fontSize: 12, letterSpacing: 1.9, color: c.stamp },
    name: { fontFamily: fonts.title, fontSize: 32, lineHeight: 38, color: c.ink },
    meta: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    warning: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: c.ink },
    error: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.stamp },
    actions: { gap: spacing.sm, marginTop: spacing.md },
  });
