import type { DetourEvent } from '@discover/shared';

import type { Sql } from '../db.ts';

export interface EventsStore {
  // Events not over yet, soonest first.
  listUpcoming(): Promise<DetourEvent[]>;
}

const LIMIT = 200;
// An event without an end time counts as over three hours after it starts.
const DEFAULT_HOURS = 3;

export function postgresEventsStore(sql: Sql): EventsStore {
  return {
    listUpcoming() {
      return sql<DetourEvent[]>`
        select id, title, kind, theme, description, place_name as "placeName", area,
          latitude, longitude, starts_at as "startsAt", ends_at as "endsAt", free,
          price_note as "priceNote"
        from events
        where coalesce(ends_at, starts_at + make_interval(hours => ${DEFAULT_HOURS})) >= now()
        order by starts_at
        limit ${LIMIT}`;
    },
  };
}
