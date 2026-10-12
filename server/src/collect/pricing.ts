import { slugify } from './slugify.ts';
import { TOURIST_SITES } from './touristSites.ts';

// Prices in euro cents, VAT included (what the stores show).
export const PRICES = {
  country: 1999,
  department: 499,
  attractive: 299,
  city: 199,
  suburb: 99,
} as const;

// Big cities that welcome the most tourists, by city slug.
const ATTRACTIVE_CITIES = new Set([
  'paris',
  'nice',
  'marseille',
  'lyon',
  'bordeaux',
  'strasbourg',
  'montpellier',
  'toulouse',
  'nantes',
  'lille',
  'aix-en-provence',
  'annecy',
  'rouen',
  'nimes',
  'dijon',
  'toulon',
]);

// Suburbs of a bigger city, by full zone id: their map holds few places. Saint-Denis exists
// twice (Seine-Saint-Denis and Réunion), only the first one is a suburb.
const SUBURBS = new Set([
  'metropole-de-lyon-villeurbanne',
  'hauts-de-seine-boulogne-billancourt',
  'val-d-oise-argenteuil',
  'seine-saint-denis-montreuil',
  'seine-saint-denis-saint-denis',
]);

const TOURIST_SITE_IDS = new Set(
  TOURIST_SITES.map((site) => `${site.departmentId}-${slugify(site.name)}`),
);

export interface PricedZone {
  id: string;
  // Null for a department.
  departmentId: string | null;
}

export function priceOf(zone: PricedZone): number {
  // Paris is one map: the department and the city are the same area.
  if (zone.id === 'paris') return PRICES.attractive;
  if (zone.departmentId === null) return PRICES.department;
  if (SUBURBS.has(zone.id)) return PRICES.suburb;
  const citySlug = zone.id.slice(zone.departmentId.length + 1);
  if (TOURIST_SITE_IDS.has(zone.id) || ATTRACTIVE_CITIES.has(citySlug)) return PRICES.attractive;
  return PRICES.city;
}
