import { parsePlaceShares } from './placeSharesApi';

jest.mock('@/features/account/supabase', () => ({ supabase: {} }));

const place = {
  id: 'x',
  name: 'Banc',
  genre: null,
  latitude: 44.4,
  longitude: -1.2,
  comment: '',
  pseudo: 'lea',
  mine: false,
  to: [],
  createdAt: '2026-11-07T10:00:00Z',
};

describe('parsePlaceShares', () => {
  it('reads a list of places, private ones without genre', () => {
    expect(parsePlaceShares({ places: [place] })).toEqual([place]);
  });
  it('refuses a place with an unknown genre or a missing field', () => {
    expect(parsePlaceShares({ places: [{ ...place, genre: 'castle' }] })).toBeNull();
    expect(parsePlaceShares({ places: [{ ...place, latitude: '44' }] })).toBeNull();
    expect(parsePlaceShares({})).toBeNull();
  });
});
