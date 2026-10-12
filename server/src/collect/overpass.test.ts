import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseBigCity, parsePlace, placesQuery } from './overpass.ts';

test('parsePlace reads a node and a way center', () => {
  assert.deepEqual(
    parsePlace({
      type: 'node',
      id: 1,
      lat: 44.4,
      lon: -1.2,
      tags: { name: 'Plage', natural: 'beach' },
    }),
    { id: 'osm:node/1', name: 'Plage', latitude: 44.4, longitude: -1.2, category: 'beach' },
  );
  assert.equal(
    parsePlace({
      type: 'way',
      id: 2,
      center: { lat: 44.3, lon: -1.1 },
      tags: { name: 'Parc', leisure: 'park' },
    })?.id,
    'osm:way/2',
  );
});

test('parsePlace skips unnamed, uncategorized or malformed elements', () => {
  assert.equal(
    parsePlace({ type: 'node', id: 1, lat: 1, lon: 1, tags: { natural: 'beach' } }),
    null,
  );
  assert.equal(parsePlace({ type: 'node', id: 1, lat: 1, lon: 1, tags: { name: 'X' } }), null);
  assert.equal(parsePlace({ type: 'way', id: 1, tags: { name: 'X', natural: 'beach' } }), null);
  assert.equal(parsePlace('nope'), null);
});

test('placesQuery targets the area and every collected key', () => {
  const query = placesQuery(76227);
  assert.match(query, /area\(3600076227\)/);
  assert.match(query, /nwr\["natural"~"\^\(beach\|peak\)\$"\]\["name"\]/);
});

test('parseBigCity keeps communes above the population threshold', () => {
  const commune = (population: string) => ({
    type: 'relation',
    id: 105270,
    tags: { name: 'Bordeaux', population },
  });
  assert.deepEqual(parseBigCity(commune('252 040'), 100_000), {
    name: 'Bordeaux',
    osmRelation: 105270,
  });
  assert.equal(parseBigCity(commune('99999'), 100_000), null);
  assert.equal(parseBigCity(commune('environ 3000'), 100_000), null);
  assert.equal(
    parseBigCity({ type: 'node', id: 1, tags: { name: 'X', population: '1e6' } }, 1),
    null,
  );
});

test('communeByNameQuery looks a commune up by exact name inside the department', async () => {
  const { communeByNameQuery, parseCommune } = await import('./overpass.ts');
  assert.match(communeByNameQuery(7405, 'Étretat'), /\["name"="Étretat"\]\(area\.zone\)/);
  assert.deepEqual(parseCommune({ type: 'relation', id: 1, tags: { name: 'Étretat' } }), {
    name: 'Étretat',
    osmRelation: 1,
  });
  assert.equal(parseCommune({ type: 'relation', id: 1, tags: {} }), null);
});
