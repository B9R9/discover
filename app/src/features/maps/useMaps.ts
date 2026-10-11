import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import Purchases, { PRODUCT_CATEGORY, type PurchasesStoreProduct } from 'react-native-purchases';

import { listCachedAreas } from '@/db/areasCache';
import { listOwnedMaps } from '@/db/ownedMaps';
import type { Db } from '@/db/types';
import { COUNTRY_MAP, mapProductId } from '@/features/purchases/mapProducts';
import { usePurchasedMaps } from '@/features/purchases/PurchasesProvider';

import { isForSale, listMaps, type MapEntry, type MapStatus } from './ownership';

export interface MapsState {
  maps: MapEntry[];
  country: MapStatus;
  // Store products by product id, with the localized price. A map without a product cannot be bought yet.
  products: Record<string, PurchasesStoreProduct>;
}

async function loadProducts(productIds: string[]): Promise<Record<string, PurchasesStoreProduct>> {
  if (productIds.length === 0) return {};
  try {
    const products = await Purchases.getProducts(productIds, PRODUCT_CATEGORY.NON_SUBSCRIPTION);
    return Object.fromEntries(products.map((product) => [product.identifier, product]));
  } catch (error) {
    console.warn('Map products not loaded', error);
    return {};
  }
}

// Read again on focus and after each purchase: the map tab may have claimed the free map meanwhile.
export function useMaps(db: Db): MapsState {
  const purchased = usePurchasedMaps();
  const [state, setState] = useState<MapsState>({ maps: [], country: 'locked', products: {} });
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
        setState({ maps, country, products: await loadProducts(forSale.map(mapProductId)) });
      }
      load().catch(console.warn);
    }, [db, purchased]),
  );
  return state;
}
