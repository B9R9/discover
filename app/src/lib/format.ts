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

export function formatDay(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const WEEKDAYS = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'] as const;

// The pieces of an outing ticket: "SAM", "7", "11:00" (local time).
export function ticketDate(iso: string): { weekday: string; day: string; time: string } {
  const date = new Date(iso);
  return {
    weekday: WEEKDAYS[date.getDay()] ?? '',
    day: String(date.getDate()),
    time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function formatLongDay(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

const WALK_METERS_PER_MINUTE = 83;

// Minutes on foot as the crow flies at 5 km/h: an estimate, never an itinerary.
export function crowWalkMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / WALK_METERS_PER_MINUTE));
}
