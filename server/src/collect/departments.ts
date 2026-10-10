import type { AreaId } from '@discover/shared';

export interface DepartmentSource {
  id: AreaId;
  name: string;
  // Administrative boundary relation in OpenStreetMap (admin_level 6).
  osmRelation: number;
}

export const DEPARTMENT_SOURCES: readonly DepartmentSource[] = [
  { id: 'gironde', name: 'Gironde', osmRelation: 7405 },
  { id: 'landes', name: 'Landes', osmRelation: 7376 },
];

// Communes above this population (OSM `population` tag) get a map of their own.
export const BIG_CITY_POPULATION = 100_000;
