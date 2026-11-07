import type { DetourEvent } from '@discover/shared';

import { filterOutings } from './filterOutings';

const base: DetourEvent = {
  id: '1',
  title: 'x',
  kind: 'k',
  theme: '',
  description: '',
  placeName: 'p',
  area: '',
  latitude: 60.18,
  longitude: 24.95,
  startsAt: '',
  endsAt: null,
  free: false,
  priceNote: '',
};
const at = (id: string, iso: string, extra: Partial<DetourEvent> = {}): DetourEvent => ({
  ...base,
  id,
  startsAt: iso,
  ...extra,
});
const off = { evening: false, weekend: false, free: false };
// Saturday 7 November 2026, 14:00 local.
const now = new Date(2026, 10, 7, 14, 0);
const local = (day: number, hour: number) => new Date(2026, 10, day, hour, 0).toISOString();

describe('filterOutings', () => {
  const events = [
    at('past', local(7, 9)),
    at('tonight', local(7, 19)),
    at('sunday', local(8, 11), { free: true }),
    at('next-week', local(14, 11)),
    at('midweek', local(11, 19)),
  ];
  const ids = (list: ReturnType<typeof filterOutings>) => list.map((o) => o.event.id);

  it('drops what is over and sorts by start', () => {
    expect(ids(filterOutings(events, off, now, null))).toEqual([
      'tonight',
      'sunday',
      'midweek',
      'next-week',
    ]);
  });
  it('"ce soir" keeps tonight and what is on now', () => {
    const running = at('running', local(7, 13), { endsAt: local(7, 16) });
    expect(ids(filterOutings([...events, running], { ...off, evening: true }, now, null))).toEqual([
      'running',
      'tonight',
    ]);
  });
  it('"week-end" keeps Saturdays and Sundays within a week', () => {
    expect(ids(filterOutings(events, { ...off, weekend: true }, now, null))).toEqual([
      'tonight',
      'sunday',
    ]);
  });
  it('"gratuit" keeps free ones, and filters stack', () => {
    expect(ids(filterOutings(events, { ...off, free: true }, now, null))).toEqual(['sunday']);
    expect(
      ids(filterOutings(events, { evening: true, weekend: true, free: true }, now, null)),
    ).toEqual([]);
  });
  it('drops what is out of the radius and measures the distance', () => {
    const far = at('far', local(8, 11), { latitude: 61.5 });
    const list = filterOutings([far, events[2]!], off, now, { latitude: 60.18, longitude: 24.95 });
    expect(ids(list)).toEqual(['sunday']);
    expect(list[0]?.distance).toBeCloseTo(0, 0);
  });
});
