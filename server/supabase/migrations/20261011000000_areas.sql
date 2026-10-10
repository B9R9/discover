-- Maps are sold per department, big cities (more than 100,000 people) apart.
-- Cities were communes: drop them, the next collection fills the departments.
delete from public.cities;

alter table public.cities rename to areas;
alter table public.areas
  add column department_id text references public.areas (id) on delete cascade;
alter table public.places rename column city_id to area_id;
alter index public.places_city_id rename to places_area_id;
