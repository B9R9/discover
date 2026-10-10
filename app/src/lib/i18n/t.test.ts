import { t } from './t';

test('t returns the French text for a key', () => {
  expect(t('tabs.map')).toBe('Carte');
});

test('t fills the parameters', () => {
  expect(t('distance.meters', { value: 420 })).toBe('420 m');
});
