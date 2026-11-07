import type { DetourEvent, EventAttendance } from '@discover/shared';

import type { Sql } from '../db.ts';

export interface EventsStore {
  // Events not over yet, soonest first.
  listUpcoming(): Promise<DetourEvent[]>;
  // False when the event does not exist. Going twice, or not going twice, changes nothing.
  setGoing(userId: string, eventId: string, going: boolean): Promise<boolean>;
  // For each upcoming event somebody goes to: whether I go, which friends, how many others.
  attendance(userId: string): Promise<EventAttendance[]>;
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

    async setGoing(userId, eventId, going) {
      const [event] = await sql`select 1 from events where id = ${eventId}`;
      if (!event) return false;
      if (going) {
        await sql`
          insert into event_attendees (event_id, user_id) values (${eventId}, ${userId})
          on conflict do nothing`;
      } else {
        await sql`delete from event_attendees where event_id = ${eventId} and user_id = ${userId}`;
      }
      return true;
    },

    attendance(userId) {
      return sql<EventAttendance[]>`
        with friends as (
          select case when f.requester = ${userId} then f.addressee else f.requester end as id
          from friendships f
          where f.accepted_at is not null and (f.requester = ${userId} or f.addressee = ${userId})
        ), visible as (
          select a.event_id, a.user_id, pr.pseudo,
            (a.user_id = ${userId}) as me,
            (a.user_id in (select id from friends)
              and not exists (
                select 1 from blocks b
                where (b.blocker = ${userId} and b.blocked = a.user_id)
                  or (b.blocker = a.user_id and b.blocked = ${userId}))) as friend
          from event_attendees a
          join events e on e.id = a.event_id
          left join profiles pr on pr.user_id = a.user_id
          where coalesce(e.ends_at, e.starts_at + make_interval(hours => ${DEFAULT_HOURS})) >= now()
        )
        select event_id as "eventId", bool_or(me) as me,
          coalesce(array_agg(pseudo order by pseudo) filter (where friend), '{}') as friends,
          (count(*) filter (where not me and not friend))::int as others
        from visible group by event_id`;
    },
  };
}
