import { categorize, COLLECTED_TAGS } from './categorize.ts';
import type { CollectedPlace } from './dedupe.ts';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
// Overpass usage policy: identify the app and send one request at a time.
const USER_AGENT = 'Detour/0.1 (+https://github.com/B9R9/discover)';
// Overpass areas are relation ids offset by this constant.
const AREA_OFFSET = 3_600_000_000;

type LatLon = [latitude: number, longitude: number];

export function placesQuery(osmRelation: number): string {
  const filters = Object.entries(COLLECTED_TAGS).map(
    ([key, values]) => `nwr["${key}"~"^(${Object.keys(values).join('|')})$"]["name"](area.city);`,
  );
  return `[out:json][timeout:90];area(${AREA_OFFSET + osmRelation})->.city;(${filters.join('')});out center tags;`;
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
