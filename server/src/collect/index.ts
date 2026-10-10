import { connect } from '../db.ts';
import { CITY_SOURCES } from './cities.ts';
import { dedupePlaces } from './dedupe.ts';
import { fetchBoundaryLines, fetchPlaces } from './overpass.ts';
import { saveCity } from './saveCity.ts';

const cityId = process.argv[2];
const city = CITY_SOURCES.find((source) => source.id === cityId);
if (!city) {
  console.error(`Usage: npm run collect -- <${CITY_SOURCES.map((c) => c.id).join('|')}>`);
  process.exit(1);
}

const sql = connect(process.env.DATABASE_URL);
try {
  const boundaryLines = await fetchBoundaryLines(city.osmRelation);
  const collected = await fetchPlaces(city.osmRelation);
  const places = dedupePlaces(collected);
  await saveCity(sql, city, boundaryLines, places);

  const byCategory = Object.groupBy(places, (place) => place.category);
  console.log(
    `${city.id}: ${places.length} places (${collected.length - places.length} duplicates)`,
  );
  for (const [category, list] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${list?.length ?? 0}`);
  }
} finally {
  await sql.end();
}
