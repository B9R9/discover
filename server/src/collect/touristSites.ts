export interface TouristSite {
  // Department id: the slug of the department name, as in DEPARTMENT_SOURCES.
  departmentId: string;
  // Exact OSM name of the commune (admin_level 8). Not always the name visitors know.
  name: string;
}

// Communes under the big-city threshold that tourists come for. They get a map of their own,
// cut out of their department, like big cities.
export const TOURIST_SITES: readonly TouristSite[] = [
  { departmentId: 'manche', name: 'Le Mont-Saint-Michel' },
  { departmentId: 'seine-maritime', name: 'Étretat' },
  { departmentId: 'aude', name: 'Carcassonne' },
  { departmentId: 'haute-savoie', name: 'Chamonix-Mont-Blanc' },
  { departmentId: 'ille-et-vilaine', name: 'Saint-Malo' },
  { departmentId: 'haut-rhin', name: 'Colmar' },
  { departmentId: 'lot', name: 'Rocamadour' },
  { departmentId: 'vaucluse', name: 'Gordes' },
  { departmentId: 'gard', name: 'Vers-Pont-du-Gard' },
  { departmentId: 'pyrenees-atlantiques', name: 'Biarritz' },
  { departmentId: 'var', name: 'Saint-Tropez' },
  { departmentId: 'alpes-maritimes', name: 'Cannes' },
  { departmentId: 'yvelines', name: 'Versailles' },
  { departmentId: 'vaucluse', name: 'Avignon' },
  { departmentId: 'bouches-du-rhone', name: 'Arles' },
  { departmentId: 'calvados', name: 'Deauville' },
  { departmentId: 'calvados', name: 'Honfleur' },
  { departmentId: 'eure', name: 'Giverny' },
];
