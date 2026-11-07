import { parseComments } from './postCommentsApi';

jest.mock('@/features/account/supabase', () => ({ supabase: {} }));

const comment = {
  id: 'c1',
  pseudo: 'tom',
  text: 'avec plaisir',
  createdAt: '2026-11-07T10:00:00Z',
  mine: false,
  byPostAuthor: true,
};

describe('parseComments', () => {
  it('reads a list of comments', () => {
    expect(parseComments({ comments: [comment] })).toEqual([comment]);
  });
  it('refuses a missing field or a body without list', () => {
    expect(parseComments({ comments: [{ ...comment, mine: 'yes' }] })).toBeNull();
    expect(parseComments({})).toBeNull();
  });
});
