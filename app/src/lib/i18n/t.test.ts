import { fr } from './fr';
import { t, type TranslationKey } from './t';

test('t returns the French text for a key', () => {
  expect(t('tabs.map')).toBe('Carte');
});

test('every French text is filled in', () => {
  for (const key of Object.keys(fr) as TranslationKey[]) {
    expect(t(key).trim()).not.toBe('');
  }
});
