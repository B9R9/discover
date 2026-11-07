import { goingSentence } from './goingSentence';

const base = { eventId: 'e', me: false, friends: [] as string[], others: 0 };

describe('goingSentence', () => {
  it('says nothing when nobody goes', () => {
    expect(goingSentence(undefined)).toBeNull();
    expect(goingSentence(base)).toBeNull();
  });
  it('names the user and two friends, counts the rest', () => {
    expect(goingSentence({ ...base, me: true })).toBe('Tu y vas.');
    expect(goingSentence({ ...base, me: true, friends: ['maija'], others: 4 })).toBe(
      'Toi, maija et 4 autre(s) y vont',
    );
    expect(goingSentence({ ...base, friends: ['a', 'b', 'c'], others: 1 })).toBe(
      'a, b et 2 autre(s) y vont',
    );
    expect(goingSentence({ ...base, others: 3 })).toBe('3 personne(s) y vont');
  });
});
