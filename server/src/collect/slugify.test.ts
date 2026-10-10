import assert from 'node:assert/strict';
import { test } from 'node:test';

import { slugify } from './slugify.ts';

test('slugify keeps only the characters of an area id', () => {
  assert.equal(slugify('Saint-Étienne'), 'saint-etienne');
  assert.equal(slugify("Villeneuve-d'Ascq"), 'villeneuve-d-ascq');
  assert.equal(slugify(' Bordeaux '), 'bordeaux');
});
