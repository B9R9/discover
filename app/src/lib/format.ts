import { isTranslationKey, t } from './i18n/t';

export function formatDistance(meters: number): string {
  if (meters < 1000) return t('distance.meters', { value: Math.round(meters / 10) * 10 });
  return t('distance.kilometers', {
    value: String(Math.round(meters / 100) / 10).replace('.', ','),
  });
}

export function formatWalkDuration(seconds: number): string {
  return t('duration.walkMinutes', { value: Math.max(1, Math.round(seconds / 60)) });
}

export function categoryLabel(category: string | null): string {
  const key = `category.${category}`;
  return isTranslationKey(key) ? t(key) : t('category.other');
}
