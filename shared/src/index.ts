export type PlaceId = string;
export type CityId = string;

export interface Place {
  id: PlaceId;
  cityId: CityId;
  name: string;
  latitude: number;
  longitude: number;
  category: string | null;
}
