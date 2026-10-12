import { connect } from '../db.ts';
import { dedupePlaces } from './dedupe.ts';
import { BIG_CITY_POPULATION, DEPARTMENT_SOURCES } from './departments.ts';
import { fetchBigCities, fetchCommuneByName, fetchBoundaryLines, fetchPlaces } from './overpass.ts';
import { saveDepartment, type CollectedCity } from './saveDepartment.ts';
import { slugify } from './slugify.ts';
import { TOURIST_SITES } from './touristSites.ts';

const departmentId = process.argv[2];
const department = DEPARTMENT_SOURCES.find((source) => source.id === departmentId);
if (!department) {
  console.error(`Usage: npm run collect -- <${DEPARTMENT_SOURCES.map((d) => d.id).join('|')}>`);
  process.exit(1);
}

const sql = connect(process.env.DATABASE_URL);
try {
  // One Overpass request after the other, as its usage policy asks.
  const boundaryLines = await fetchBoundaryLines(department.osmRelation);
  const cities: CollectedCity[] = [];
  // Paris is department and commune at once: cutting the city out would leave an empty map.
  const bigCities =
    department.id === 'paris'
      ? []
      : await fetchBigCities(department.osmRelation, BIG_CITY_POPULATION);
  for (const city of bigCities) {
    cities.push({
      ...city,
      // Prefixed: two departments may have a big city of the same name (Saint-Denis).
      id: `${department.id}-${slugify(city.name)}`,
      boundaryLines: await fetchBoundaryLines(city.osmRelation),
    });
  }
  for (const site of TOURIST_SITES.filter((s) => s.departmentId === department.id)) {
    const commune = await fetchCommuneByName(department.osmRelation, site.name);
    if (!commune) {
      console.warn(`  tourist site not found in OSM: ${site.name}`);
      continue;
    }
    cities.push({
      ...commune,
      id: `${department.id}-${slugify(commune.name)}`,
      boundaryLines: await fetchBoundaryLines(commune.osmRelation),
    });
  }
  const collected = await fetchPlaces(department.osmRelation);
  const places = dedupePlaces(collected);
  await saveDepartment(sql, department, boundaryLines, cities, places);

  console.log(
    `${department.id}: ${places.length} places (${collected.length - places.length} duplicates)`,
  );
  console.log(`  big cities: ${cities.map((city) => city.id).join(', ') || 'none'}`);
  const counts = await sql<{ id: string; places: number }[]>`
    select a.id, count(p.id)::int as places from areas a left join places p on p.area_id = a.id
    where a.id = ${department.id} or a.department_id = ${department.id} group by a.id order by a.id`;
  for (const { id, places: count } of counts) console.log(`  ${id}: ${count}`);
} finally {
  await sql.end();
}
