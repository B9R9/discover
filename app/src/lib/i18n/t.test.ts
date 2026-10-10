import { t } from './t';

test('t returns the French text for a key', () => {
  expect(t('tabs.map')).toBe('Carte');
});
