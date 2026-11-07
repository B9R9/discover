import { parseAttendance, parseEvents } from './outingsApi';

jest.mock('@/features/account/supabase', () => ({ supabase: {} }));

const event = {
  id: '1',
  title: 'Brocante',
  kind: 'Brocante',
  theme: '',
  description: '',
  placeName: 'Cour',
  area: 'Kallio',
  latitude: 60.18,
  longitude: 24.95,
  startsAt: '2026-11-14T11:00:00Z',
  endsAt: null,
  free: true,
  priceNote: '',
};

describe('parseEvents', () => {
  it('reads a list of events', () => {
    expect(parseEvents({ events: [event] })).toEqual([event]);
  });
  it('refuses a malformed event or date', () => {
    expect(parseEvents({ events: [{ ...event, free: 'yes' }] })).toBeNull();
    expect(parseEvents({ events: [{ ...event, startsAt: 'soon' }] })).toBeNull();
    expect(parseEvents({})).toBeNull();
  });
});

describe('parseAttendance', () => {
  it('reads who goes', () => {
    const row = { eventId: 'e', me: true, friends: ['tom'], others: 2 };
    expect(parseAttendance({ attendance: [row] })).toEqual([row]);
  });
  it('refuses a malformed row', () => {
    expect(
      parseAttendance({ attendance: [{ eventId: 'e', me: 1, friends: [], others: 0 }] }),
    ).toBeNull();
  });
});
