import { fr } from './fr';

export type TranslationKey = keyof typeof fr;

// Replaces each {name} in the text by params.name.
export function t(key: TranslationKey, params: Record<string, string | number> = {}): string {
  return fr[key].replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match));
}

export function isTranslationKey(key: string): key is TranslationKey {
  return key in fr;
}
