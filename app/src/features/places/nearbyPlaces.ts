import type { PlaceId } from '@discover/shared';

import type { CachedPlace } from '@/db/placesCache';
import type { GeoPoint } from '@/db/types';
import { bearingDegrees, distanceMeters } from '@/lib/geo';

interface Bearing {
  id: PlaceId;
  category: string | null;
  distance: number;
  bearing: number;
}

// An undiscovered place carries no name and no position: the UI cannot leak what the fog hides.
export type NearbyPlace =
  | (Bearing & { discovered: false })
  | (Bearing & { discovered: true; name: string; position: GeoPoint });

export function nearbyPlaces(places: readonly CachedPlace[], from: GeoPoint): NearbyPlace[] {
  return places
    .map((place): NearbyPlace => {
      const base = {
        id: place.id,
        category: place.category,
        distance: distanceMeters(from, place),
        bearing: bearingDegrees(from, place),
      };
      return place.discovered
        ? {
            ...base,
            discovered: true,
            name: place.name,
            position: { latitude: place.latitude, longitude: place.longitude },
          }
        : { ...base, discovered: false };
    })
    .sort((a, b) => a.distance - b.distance);
}
