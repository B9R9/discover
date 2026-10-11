import {
  endConnection,
  ErrorCode,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type Purchase,
} from 'expo-iap';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { OwnedMap } from '@/db/ownedMaps';
import type { TranslationKey } from '@/lib/i18n/t';

import { purchasedMaps } from './mapProducts';

interface Store {
  // False until the store connection is up: no product nor purchase can be read before.
  ready: boolean;
  purchased: OwnedMap[];
  // Outcome of the last purchase or restore, shown under the maps. null: nothing to say.
  message: TranslationKey | null;
  buy: (productId: string) => void;
  restore: () => void;
}

const StoreContext = createContext<Store>({
  ready: false,
  purchased: [],
  message: null,
  buy: () => {},
  restore: () => {},
});

// The listener's error type has an optional code (expo-iap errorMapping), not the one of types.ts.
function errorMessage(error: { code?: ErrorCode }): TranslationKey | null {
  switch (error.code) {
    case ErrorCode.UserCancelled:
      return null;
    case ErrorCode.NetworkError:
    case ErrorCode.ServiceDisconnected:
      return 'purchases.error.network';
    default:
      console.warn('Purchase failed', error);
      return 'purchases.error.failed';
  }
}

// Google refunds a purchase not acknowledged within 3 days: finish every completed one, even from a past session.
async function finishAll(purchases: Purchase[]): Promise<void> {
  for (const purchase of purchases) {
    if (purchase.purchaseState === 'purchased') {
      await finishTransaction({ purchase, isConsumable: false });
    }
  }
}

// Talks to Google Play or the App Store directly. Purchases follow the store account, not the Détour account.
// ponytail: no server check of purchase tokens, a rooted phone can fake one; verify on the API before beta (phase 8).
export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [message, setMessage] = useState<TranslationKey | null>(null);

  // Offline, the store answers from its cache on the phone.
  const refresh = useCallback(async () => {
    const purchases = await getAvailablePurchases();
    await finishAll(purchases);
    setProductIds(purchases.filter((p) => p.purchaseState === 'purchased').map((p) => p.productId));
  }, []);

  useEffect(() => {
    let stopped = false;
    const updated = purchaseUpdatedListener((purchase) => {
      if (purchase.purchaseState === 'pending') setMessage('purchases.error.pending');
      else refresh().catch(console.warn);
    });
    const failed = purchaseErrorListener((error) => {
      if (error.code === ErrorCode.AlreadyOwned) refresh().catch(console.warn);
      else setMessage(errorMessage(error));
    });
    initConnection()
      .then(async () => {
        if (stopped) return;
        setReady(true);
        await refresh();
      })
      .catch((error: unknown) => console.warn('Store not reached', error));
    return () => {
      stopped = true;
      updated.remove();
      failed.remove();
      endConnection().catch(console.warn);
    };
  }, [refresh]);

  const purchased = useMemo(() => purchasedMaps(productIds), [productIds]);
  const store = useMemo<Store>(
    () => ({
      ready,
      purchased,
      message,
      buy: (productId) => {
        setMessage(null);
        // The outcome arrives through the listeners above, not this promise.
        requestPurchase({
          request: { apple: { sku: productId }, google: { skus: [productId] } },
          type: 'in-app',
        }).catch((error: unknown) => {
          console.warn('Purchase not started', error);
          setMessage('purchases.error.failed');
        });
      },
      restore: () => {
        setMessage(null);
        restorePurchases()
          .then(refresh)
          .then(() => setMessage('purchases.restored'))
          .catch((error: unknown) => {
            console.warn('Restore failed', error);
            setMessage('purchases.error.network');
          });
      },
    }),
    [ready, purchased, message, refresh],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  return useContext(StoreContext);
}

export function usePurchasedMaps(): OwnedMap[] {
  return useStore().purchased;
}
