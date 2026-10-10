import { categoryLabel, formatDistance, formatWalkDuration } from './format';

test('formats distances the French way', () => {
  expect(formatDistance(423)).toBe('420 m');
  expect(formatDistance(1650)).toBe('1,7 km');
});

test('formats a walk duration in minutes', () => {
  expect(formatWalkDuration(1188)).toBe('20 min à pied');
  expect(formatWalkDuration(10)).toBe('1 min à pied');
});

test('falls back to a generic label for an unknown category', () => {
  expect(categoryLabel('museum')).toBe('Musée');
  expect(categoryLabel('volcano')).toBe('Lieu');
  expect(categoryLabel(null)).toBe('Lieu');
});
