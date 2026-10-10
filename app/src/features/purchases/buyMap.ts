import Purchases, {
  PURCHASES_ERROR_CODE,
  type PurchasesStoreProduct,
} from 'react-native-purchases';

import type { TranslationKey } from '@/lib/i18n/t';

// null: done or cancelled by the user, nothing to say. The customer info listener refreshes the maps.
export type PurchaseOutcome = TranslationKey | null;

function errorCode(error: unknown): unknown {
  return typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
}

function outcomeOf(error: unknown): PurchaseOutcome {
  switch (errorCode(error)) {
    case PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
      return null;
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
    case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
      return 'purchases.error.network';
    case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
      return 'purchases.error.pending';
    default:
      console.warn('Purchase failed', error);
      return 'purchases.error.failed';
  }
}

export async function buyMap(product: PurchasesStoreProduct): Promise<PurchaseOutcome> {
  try {
    await Purchases.purchaseStoreProduct(product);
    return null;
  } catch (error) {
    return outcomeOf(error);
  }
}

export async function restoreMaps(): Promise<PurchaseOutcome> {
  try {
    await Purchases.restorePurchases();
    return 'purchases.restored';
  } catch (error) {
    return outcomeOf(error);
  }
}
