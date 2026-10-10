import type { PlaceCategory } from '@discover/shared';

type OsmTags = Readonly<Record<string, string>>;

// OSM tag values kept as places, by category. Also drives the Overpass query (see overpassQuery.ts).
export const COLLECTED_TAGS: Readonly<Record<string, Readonly<Record<string, PlaceCategory>>>> = {
  tourism: {
    museum: 'culture',
    gallery: 'culture',
    viewpoint: 'viewpoint',
    attraction: 'leisure',
    theme_park: 'leisure',
    zoo: 'leisure',
    artwork: 'heritage',
  },
  amenity: {
    cinema: 'culture',
    theatre: 'culture',
    library: 'culture',
    arts_centre: 'culture',
    place_of_worship: 'heritage',
    townhall: 'heritage',
    marketplace: 'shop',
    restaurant: 'food',
    cafe: 'food',
    ice_cream: 'food',
  },
  historic: {
    monument: 'heritage',
    memorial: 'heritage',
    castle: 'heritage',
    ruins: 'heritage',
    archaeological_site: 'heritage',
    church: 'heritage',
    chapel: 'heritage',
  },
  leisure: {
    park: 'nature',
    garden: 'nature',
    nature_reserve: 'nature',
    playground: 'leisure',
    sports_centre: 'leisure',
    stadium: 'leisure',
    swimming_pool: 'leisure',
    water_park: 'leisure',
    marina: 'leisure',
    golf_course: 'leisure',
  },
  natural: {
    beach: 'beach',
    peak: 'viewpoint',
  },
  shop: {
    books: 'shop',
    art: 'shop',
    craft: 'shop',
    antiques: 'shop',
    gift: 'shop',
    farm: 'shop',
  },
};

// First matching key in COLLECTED_TAGS order wins: a museum in a castle is culture.
export function categorize(tags: OsmTags): PlaceCategory | null {
  if (tags.access === 'private') return null;
  for (const [key, values] of Object.entries(COLLECTED_TAGS)) {
    const value = tags[key];
    const category = value === undefined ? undefined : values[value];
    if (category) return category;
  }
  return null;
}
