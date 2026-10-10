import type { CityId } from '@discover/shared';

export interface CitySource {
  id: CityId;
  name: string;
  // Administrative boundary relation in OpenStreetMap.
  osmRelation: number;
}

export const CITY_SOURCES: readonly CitySource[] = [
  { id: 'biscarrosse', name: 'Biscarrosse', osmRelation: 76227 },
];
