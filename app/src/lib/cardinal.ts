import type { TranslationKey } from '@/lib/i18n/t';

const POINTS: TranslationKey[] = [
  'outings.cardinal.n',
  'outings.cardinal.ne',
  'outings.cardinal.e',
  'outings.cardinal.se',
  'outings.cardinal.s',
  'outings.cardinal.sw',
  'outings.cardinal.w',
  'outings.cardinal.nw',
];

// The compass point (one of eight) for a bearing in degrees clockwise from north.
export function cardinalKey(bearing: number): TranslationKey {
  const index = Math.round((((bearing % 360) + 360) % 360) / 45) % 8;
  return POINTS[index] ?? 'outings.cardinal.n';
}
