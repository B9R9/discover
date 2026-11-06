import type { Place } from '@discover/shared';
import { useEffect, useState } from 'react';

import type { Db } from '@/db/types';
import { listCachedPlacesByIds } from '@/db/placesCache';
import type { TranslationKey } from '@/lib/i18n/t';

import { fetchFriendMap } from './mapsApi';

export type FriendMap =
  | { status: 'loading' }
  | { status: 'error'; error: TranslationKey }
  // `known` are the places this phone can locate; `total` all those the friend shared.
  | { status: 'empty' }
  | { status: 'ready'; known: Place[]; total: number };

// Loads a friend's shared map and matches its ids with the places cached on this phone.
export function useFriendMap(db: Db, pseudo: string | null): FriendMap {
  const [state, setState] = useState<{ pseudo: string; map: FriendMap } | null>(null);

  useEffect(() => {
    if (!pseudo) return;
    let cancelled = false;
    async function load(name: string): Promise<FriendMap> {
      const result = await fetchFriendMap(name);
      if (!result.ok) return { status: 'error', error: result.error };
      if (!result.value) return { status: 'empty' };
      const known = await listCachedPlacesByIds(db, result.value.placeIds);
      return { status: 'ready', known, total: result.value.placeIds.length };
    }
    load(pseudo)
      .then((map) => {
        if (!cancelled) setState({ pseudo, map });
      })
      .catch(console.warn);
    return () => {
      cancelled = true;
    };
  }, [db, pseudo]);

  return state && state.pseudo === pseudo ? state.map : { status: 'loading' };
}
