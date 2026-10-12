import { categorize, COLLECTED_TAGS } from './categorize.ts';
import type { CollectedPlace } from './dedupe.ts';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
// Overpass usage policy: identify the app and send one request at a time.
const USER_AGENT = 'Detour/0.1 (+https://github.com/B9R9/discover)';
// Overpass areas are relation ids offset by this constant.
const AREA_OFFSET = 3_600_000_000;

type LatLon = [latitude: number, longitude: number];

export interface BigCity {
  name: string;
  osmRelation: number;
}

export function placesQuery(osmRelation: number): string {
  const filters = Object.entries(COLLECTED_TAGS).map(
    ([key, values]) => `nwr["${key}"~"^(${Object.keys(values).join('|')})$"]["name"](area.zone);`,
  );
  return `[out:json][timeout:300];area(${AREA_OFFSET + osmRelation})->.zone;(${filters.join('')});out center tags;`;
}

// Communes (admin_level 8) with a population tag. May include neighbours across the border:
// the save keeps only the cities inside the department.
export function communesQuery(osmRelation: number): string {
  return `[out:json][timeout:90];area(${AREA_OFFSET + osmRelation})->.zone;relation["boundary"="administrative"]["admin_level"="8"]["population"](area.zone);out tags;`;
}

export function communeByNameQuery(osmRelation: number, name: string): string {
  return `[out:json][timeout:60];area(${AREA_OFFSET + osmRelation})->.zone;relation["boundary"="administrative"]["admin_level"="8"]["name"=${JSON.stringify(name)}](area.zone);out tags;`;
}

export function boundaryQuery(osmRelation: number): string {
  return `[out:json][timeout:60];relation(${osmRelation});way(r);out geom;`;
}

// 429 and 504 mean Overpass is busy: wait and try again, as its usage policy asks.
const BUSY_STATUSES = [429, 504];
const ATTEMPTS = 3;
const RETRY_DELAY_MS = 30_000;

async function post(query: string): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'user-agent': USER_AGENT, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ data: query }),
    });
    if (!BUSY_STATUSES.includes(response.status) || attempt === ATTEMPTS) return response;
    console.warn(`Overpass busy (${response.status}), retrying in ${RETRY_DELAY_MS / 1000} s`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }
}

async function runQuery(query: string): Promise<unknown[]> {
  const response = await post(query);
  if (!response.ok) throw new Error(`Overpass answered ${response.status}`);
  const body: unknown = await response.json();
  if (!isRecord(body) || !Array.isArray(body.elements))
    throw new Error('Unexpected Overpass reply');
  return body.elements;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readPoint(value: unknown): LatLon | null {
  if (!isRecord(value) || typeof value.lat !== 'number' || typeof value.lon !== 'number') {
    return null;
  }
  return [value.lat, value.lon];
}

function readTags(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

export function parsePlace(element: unknown): CollectedPlace | null {
  if (!isRecord(element) || typeof element.type !== 'string' || typeof element.id !== 'number') {
    return null;
  }
  const tags = readTags(element.tags);
  const point = readPoint(element) ?? readPoint(element.center);
  const category = categorize(tags);
  if (!point || !category || !tags.name) return null;
  return {
    id: `osm:${element.type}/${element.id}`,
    name: tags.name,
    latitude: point[0],
    longitude: point[1],
    category,
  };
}

export function parseCommune(element: unknown): BigCity | null {
  if (!isRecord(element) || element.type !== 'relation' || typeof element.id !== 'number') {
    return null;
  }
  const name = readTags(element.tags).name;
  return name ? { name, osmRelation: element.id } : null;
}

// OSM writes populations as free text, sometimes with spaces ("252 040").
export function parseBigCity(element: unknown, minPopulation: number): BigCity | null {
  const commune = parseCommune(element);
  const population = Number(
    (readTags(isRecord(element) ? element.tags : {}).population ?? '').replace(/\s/g, ''),
  );
  return commune && population >= minPopulation ? commune : null;
}

export async function fetchBigCities(
  osmRelation: number,
  minPopulation: number,
): Promise<BigCity[]> {
  const elements = await runQuery(communesQuery(osmRelation));
  return elements
    .map((element) => parseBigCity(element, minPopulation))
    .filter((city) => city !== null);
}

// A commune looked up by its exact OSM name, for tourist sites (no population threshold).
export async function fetchCommuneByName(
  osmRelation: number,
  name: string,
): Promise<BigCity | null> {
  const elements = await runQuery(communeByNameQuery(osmRelation, name));
  return elements.map(parseCommune).find((city) => city !== null) ?? null;
}

export async function fetchPlaces(osmRelation: number): Promise<CollectedPlace[]> {
  const elements = await runQuery(placesQuery(osmRelation));
  return elements.map(parsePlace).filter((place) => place !== null);
}

// The boundary ways, as lines; PostGIS assembles them into an area.
export async function fetchBoundaryLines(osmRelation: number): Promise<LatLon[][]> {
  const elements = await runQuery(boundaryQuery(osmRelation));
  return elements.flatMap((element) => {
    if (!isRecord(element) || !Array.isArray(element.geometry)) return [];
    const line = element.geometry.map(readPoint).filter((point) => point !== null);
    return line.length >= 2 ? [line] : [];
  });
}
