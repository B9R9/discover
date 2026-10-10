import type { Place } from '@discover/shared';

import { replaceCachedPlaces } from '@/db/placesCache';
import type { Db } from '@/db/types';

// Development data until the server collects places (phase 5). Positions from OpenStreetMap (ODbL), October 2026.
const CITY = 'biscarrosse';

const place = (
  id: string,
  name: string,
  latitude: number,
  longitude: number,
  category: string,
): Place => ({ id: `osm:${id}`, cityId: CITY, name, latitude, longitude, category });

export const TEST_PLACES: readonly Place[] = [
  place('node/1508590127', "Musée de l'Hydraviation", 44.38939, -1.18242, 'museum'),
  place('way/127827869', 'Église Saint-Martin', 44.3941, -1.16756, 'church'),
  place('way/127833267', 'Mairie de Biscarrosse', 44.39581, -1.16696, 'townhall'),
  place('node/618273390', 'Cinéma Le Renoir', 44.39551, -1.16657, 'cinema'),
  place('way/472685520', 'Parc Marie-Blanche Campillo-Mercader', 44.39513, -1.16212, 'park'),
  place('node/8632219098', 'Médiathèque', 44.39497, -1.16488, 'library'),
  place('way/299437773', 'Stade Ducom', 44.39273, -1.15773, 'sports'),
  place('way/127816135', 'Piscine municipale', 44.39308, -1.15628, 'pool'),
  place('way/977618755', 'Aire de jeux', 44.39226, -1.15506, 'playground'),
  place('node/8431507165', 'Port de Maguide', 44.45757, -1.19966, 'marina'),
  place('node/677805622', 'Biscarrosse-Plage', 44.4444, -1.25109, 'beach'),
  place('node/8680293181', 'Navarrosse', 44.43042, -1.16381, 'hamlet'),
];

export function seedTestPlaces(db: Db): Promise<void> {
  return replaceCachedPlaces(db, CITY, [...TEST_PLACES], Date.now());
}
