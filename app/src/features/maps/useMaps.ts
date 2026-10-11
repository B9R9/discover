import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { fetchProducts } from 'expo-iap';

import { listCachedAreas } from '@/db/areasCache';
import { listOwnedMaps } from '@/db/ownedMaps';
import type { Db } from '@/db/types';
import { COUNTRY_MAP, mapProductId } from '@/features/purchases/mapProducts';
import { useStore } from '@/features/purchases/StoreProvider';

import { isForSale, listMaps, type MapEntry, type MapStatus } from './ownership';

export interface MapsState {
  maps: MapEntry[];
  country: MapStatus;
  // Localized store price by product id. A map without a product in the store cannot be bought yet.
  prices: Record<string, string>;
}

async function loadPrices(productIds: string[]): Promise<Record<string, string>> {
  if (productIds.length === 0) return {};
  try {
    const products = (await fetchProducts({ skus: productIds, type: 'in-app' })) ?? [];
    return Object.fromEntries(products.map((product) => [product.id, product.displayPrice]));
  } catch (error) {
    console.warn('Map products not loaded', error);
    return {};
  }
}

// Read again on focus and after each purchase: the map tab may have claimed the free map meanwhile.
export function useMaps(db: Db): MapsState {
  const { ready, purchased } = useStore();
  const [state, setState] = useState<MapsState>({ maps: [], country: 'locked', prices: {} });
  useFocusEffect(
    useCallback(() => {
      async function load() {
        const owned = [...(await listOwnedMaps(db)), ...purchased];
        const maps = listMaps(await listCachedAreas(db), owned);
        const country = owned.some((map) => map.areaId === COUNTRY_MAP) ? 'purchased' : 'locked';
        const forSale = [
          ...(country === 'locked' ? [COUNTRY_MAP] : []),
          ...maps.filter((map) => isForSale(map, maps)).map((map) => map.area.id),
        ];
        setState({
          maps,
          country,
          prices: ready ? await loadPrices(forSale.map(mapProductId)) : {},
        });
      }
      load().catch(console.warn);
    }, [db, purchased, ready]),
  );
  return state;
}
