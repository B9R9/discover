import { isValidCode, isValidEmail, normalizeEmail } from './account';

// Hoisted by Jest: keeps the real Supabase client (and its native storage) out of the test.
jest.mock('./supabase', () => ({ supabase: {} }));

test('normalizeEmail trims and lowercases', () => {
  expect(normalizeEmail('  Toi@Exemple.FR ')).toBe('toi@exemple.fr');
});

test('isValidEmail catches obvious typos only', () => {
  expect(isValidEmail('toi@exemple.fr')).toBe(true);
  expect(isValidEmail('toi@exemple')).toBe(false);
  expect(isValidEmail('toi exemple.fr')).toBe(false);
  expect(isValidEmail('')).toBe(false);
});

test('isValidCode wants exactly 6 digits', () => {
  expect(isValidCode('123456')).toBe(true);
  expect(isValidCode('12345')).toBe(false);
  expect(isValidCode('12345a')).toBe(false);
});
