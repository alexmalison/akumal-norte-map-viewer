-- Run once in the Supabase SQL Editor. Add approved editor emails separately.
create table public.editors (
  email text primary key check (email = lower(email) and length(email) <= 320)
);

create table public.lot_names (
  lot_id text primary key check (length(lot_id) between 1 and 64),
  name text not null check (length(name) between 1 and 120)
);

alter table public.editors enable row level security;
alter table public.lot_names enable row level security;

revoke all on public.editors from anon, authenticated;
revoke all on public.lot_names from anon, authenticated;
grant select on public.editors to authenticated;
grant select on public.lot_names to anon, authenticated;
grant insert, update, delete on public.lot_names to authenticated;

create policy "Editors can see their own approval"
  on public.editors for select to authenticated
  using (email = lower(auth.jwt() ->> 'email'));

create policy "Anyone can read lot names"
  on public.lot_names for select to anon, authenticated
  using (true);

create policy "Approved editors can add lot names"
  on public.lot_names for insert to authenticated
  with check (exists (
    select 1 from public.editors
    where email = lower(auth.jwt() ->> 'email')
  ));

create policy "Approved editors can change lot names"
  on public.lot_names for update to authenticated
  using (exists (
    select 1 from public.editors
    where email = lower(auth.jwt() ->> 'email')
  ))
  with check (exists (
    select 1 from public.editors
    where email = lower(auth.jwt() ->> 'email')
  ));

create policy "Approved editors can clear lot names"
  on public.lot_names for delete to authenticated
  using (exists (
    select 1 from public.editors
    where email = lower(auth.jwt() ->> 'email')
  ));

alter publication supabase_realtime add table public.lot_names;
