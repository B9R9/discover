import { cardinalKey } from './cardinal';

describe('cardinalKey', () => {
  it('maps bearings to the eight compass points', () => {
    expect(cardinalKey(0)).toBe('outings.cardinal.n');
    expect(cardinalKey(359)).toBe('outings.cardinal.n');
    expect(cardinalKey(50)).toBe('outings.cardinal.ne');
    expect(cardinalKey(180)).toBe('outings.cardinal.s');
    expect(cardinalKey(-90)).toBe('outings.cardinal.w');
  });
});
