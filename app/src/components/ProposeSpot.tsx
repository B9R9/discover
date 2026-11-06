import type { SpotStatus } from '@discover/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { PersonalPlace } from '@/db/personalPlaces';
import { useSession } from '@/features/account/useSession';
import {
  fetchSpotStatuses,
  proposeSpot,
  withdrawSpot,
  type SocialResult,
} from '@/features/social/spotsApi';
import { t, type TranslationKey } from '@/lib/i18n/t';
import { fonts, spacing, type ThemeColors } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';

const STATUS_LABEL: Record<SpotStatus, TranslationKey> = {
  pending: 'spot.pending',
  approved: 'spot.approved',
  rejected: 'spot.rejected',
};

// Offers a public spot of the user to the community. Nothing is sent before the explicit confirmation.
export function ProposeSpot({ place }: { place: PersonalPlace }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const session = useSession();
  const [status, setStatus] = useState<SpotStatus | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [busy, setBusy] = useState(false);
  const placeId = place.id;
  const signedIn = Boolean(session);

  const reload = useCallback(() => {
    if (!signedIn) return;
    fetchSpotStatuses()
      .then((result) => {
        if (result.ok) setStatus(result.value[placeId] ?? null);
      })
      .catch(console.warn);
  }, [signedIn, placeId]);
  useEffect(reload, [reload]);

  async function run(action: () => Promise<SocialResult<true>>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await action().finally(() => setBusy(false));
    setConfirming(false);
    if (result.ok) reload();
    else setError(result.error);
  }

  if (!signedIn) return <Text style={styles.hint}>{t('spot.signIn')}</Text>;
  return (
    <View style={styles.box}>
      {status && <Text style={styles.hint}>{t(STATUS_LABEL[status])}</Text>}
      {confirming && <Text style={styles.hint}>{t('spot.hint')}</Text>}
      {error && <Text style={styles.error}>{t(error)}</Text>}
      {status === null && !confirming && (
        <Button label={t('spot.propose')} onPress={() => setConfirming(true)} />
      )}
      {status === null && confirming && (
        <Button
          label={t('spot.confirm')}
          variant="primary"
          onPress={() => {
            run(() => proposeSpot(place)).catch(console.warn);
          }}
        />
      )}
      {status !== null && (
        <Button
          label={t('spot.withdraw')}
          variant="secondary"
          onPress={() => {
            run(() => withdrawSpot(placeId)).catch(console.warn);
          }}
        />
      )}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    box: { gap: spacing.sm },
    hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.muted },
    error: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: c.stamp },
  });
