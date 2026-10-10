import { connect } from '../db.ts';
import { dedupePlaces } from './dedupe.ts';
import { BIG_CITY_POPULATION, DEPARTMENT_SOURCES } from './departments.ts';
import { fetchBigCities, fetchBoundaryLines, fetchPlaces } from './overpass.ts';
import { saveDepartment, type CollectedCity } from './saveDepartment.ts';
import { slugify } from './slugify.ts';

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
  for (const city of await fetchBigCities(department.osmRelation, BIG_CITY_POPULATION)) {
    cities.push({
      ...city,
      // Prefixed: two departments may have a big city of the same name (Saint-Denis).
      id: `${department.id}-${slugify(city.name)}`,
      boundaryLines: await fetchBoundaryLines(city.osmRelation),
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
