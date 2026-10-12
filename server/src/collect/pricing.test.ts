import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PRICES, priceOf } from './pricing.ts';

test('department, attractive city, other city, suburb, tourist site', () => {
  assert.equal(priceOf({ id: 'landes', departmentId: null }), PRICES.department);
  assert.equal(priceOf({ id: 'gironde-bordeaux', departmentId: 'gironde' }), PRICES.attractive);
  assert.equal(
    priceOf({ id: 'ille-et-vilaine-rennes', departmentId: 'ille-et-vilaine' }),
    PRICES.city,
  );
  assert.equal(
    priceOf({ id: 'seine-saint-denis-saint-denis', departmentId: 'seine-saint-denis' }),
    PRICES.suburb,
  );
  assert.equal(
    priceOf({ id: 'manche-le-mont-saint-michel', departmentId: 'manche' }),
    PRICES.attractive,
  );
});

test('Saint-Denis in Réunion is a normal city, Paris is one attractive map', () => {
  assert.equal(priceOf({ id: 'la-reunion-saint-denis', departmentId: 'la-reunion' }), PRICES.city);
  assert.equal(priceOf({ id: 'paris', departmentId: null }), PRICES.attractive);
});

test('the price grid keeps city < department < country', () => {
  assert.ok(PRICES.suburb < PRICES.city && PRICES.city < PRICES.attractive);
  assert.ok(PRICES.attractive < PRICES.department && PRICES.department < PRICES.country);
});
