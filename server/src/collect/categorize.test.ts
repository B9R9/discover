import assert from 'node:assert/strict';
import { test } from 'node:test';

import { categorize } from './categorize.ts';

test('categorize maps known OSM tags', () => {
  assert.equal(categorize({ tourism: 'museum' }), 'culture');
  assert.equal(categorize({ natural: 'beach' }), 'beach');
  assert.equal(categorize({ leisure: 'park' }), 'nature');
});

test('categorize follows key priority', () => {
  assert.equal(categorize({ historic: 'castle', tourism: 'museum' }), 'culture');
});

test('categorize ignores unknown and private places', () => {
  assert.equal(categorize({ amenity: 'parking' }), null);
  assert.equal(categorize({ leisure: 'swimming_pool', access: 'private' }), null);
  assert.equal(categorize({}), null);
});
