import type { EventAttendance } from '@discover/shared';

import { t } from '@/lib/i18n/t';

const NAMED_FRIENDS = 2;

// "Toi, Maija et 4 autres y vont": the user first, up to two friends by name, then a count of the rest.
// null when nobody goes.
export function goingSentence(attendance: EventAttendance | undefined): string | null {
  if (!attendance) return null;
  const names = [
    ...(attendance.me ? [t('outings.you')] : []),
    ...attendance.friends.slice(0, NAMED_FRIENDS),
  ];
  const rest = Math.max(attendance.friends.length - NAMED_FRIENDS, 0) + attendance.others;
  if (names.length === 0 && rest === 0) return null;
  if (names.length === 0) return t('outings.going.others', { count: rest });
  if (rest === 0) {
    return names.length === 1 && attendance.me
      ? t('outings.going.me')
      : t('outings.going.names', { names: names.join(', ') });
  }
  return t('outings.going.namesAndMore', { names: names.join(', '), count: rest });
}
