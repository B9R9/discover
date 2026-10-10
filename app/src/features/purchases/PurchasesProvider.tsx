import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import Purchases, { type CustomerInfo } from 'react-native-purchases';

import type { OwnedMap } from '@/db/ownedMaps';
import { useSession } from '@/features/account/useSession';

import { purchasedMaps } from './mapProducts';

// undefined while loading; null when RevenueCat cannot answer (no key, or never reached and nothing cached).
const CustomerInfoContext = createContext<CustomerInfo | null | undefined>(undefined);

let configured = false;

function configureOnce(): boolean {
  if (configured) return true;
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_KEY;
  if (!apiKey) {
    console.warn('EXPO_PUBLIC_REVENUECAT_KEY is missing, purchases are off');
    return false;
  }
  // Anonymous until the user signs in: an account stays optional.
  Purchases.configure({ apiKey });
  configured = true;
  return true;
}

// Only the account id goes to RevenueCat, so purchases follow the user to a new phone. No game data.
async function linkAccount(userId: string | null): Promise<void> {
  if (userId) await Purchases.logIn(userId);
  else if (!(await Purchases.isAnonymous())) await Purchases.logOut();
}

export function PurchasesProvider({ children }: { children: ReactNode }) {
  // configureOnce is idempotent, so running it in the initializer is safe.
  const [info, setInfo] = useState<CustomerInfo | null | undefined>(() =>
    configureOnce() ? undefined : null,
  );
  const session = useSession();
  const userId = session === undefined ? undefined : (session?.user.id ?? null);

  useEffect(() => {
    if (!configured) return;
    // Offline, RevenueCat answers from its cache on the phone.
    Purchases.getCustomerInfo()
      .then(setInfo)
      .catch((error: unknown) => {
        console.warn('Customer info not loaded', error);
        setInfo(null);
      });
    Purchases.addCustomerInfoUpdateListener(setInfo);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(setInfo);
    };
  }, []);

  useEffect(() => {
    if (userId === undefined || !configured) return;
    linkAccount(userId).catch(console.warn);
  }, [userId]);

  return <CustomerInfoContext.Provider value={info}>{children}</CustomerInfoContext.Provider>;
}

export function useCustomerInfo(): CustomerInfo | null | undefined {
  return useContext(CustomerInfoContext);
}

export function usePurchasedMaps(): OwnedMap[] {
  const productIds = useCustomerInfo()?.allPurchasedProductIdentifiers;
  return useMemo(() => purchasedMaps(productIds ?? []), [productIds]);
}
