-- Migration: Make Central Dashboard RPCs public
-- Removes the role check and grants anon access so the central dashboard requires no sign-in.
-- Also seeds the remaining teams into the database.

insert into public.teams (id, name, slug)
values
  ('54a0575b-8f20-4882-9d4f-391c94ffd560', 'NEXUS', 'nexus'),
  ('6f1d2404-636c-4b6b-b19d-40dae4018c92', 'CIPHER', 'cipher'),
  ('8f7af888-7dca-467c-86a0-f4500bc1c0ed', 'ASCEND', 'ascend'),
  ('f0ab9a4a-2e4b-4568-99ef-5b4736cc33c5', 'ECHO', 'echo'),
  ('f876de5d-4ada-4e24-bc97-bba3408d82f2', 'BYTE BRIGADE', 'byte-brigade')
on conflict (id) do nothing;

create or replace function public.get_central_totals()
returns table (
  team_id uuid,
  team_name text,
  total_points int
)
language plpgsql stable security definer set search_path = public
as $$
begin
  return query
    select t.id,
           t.name,
           coalesce(sum(s.net_points), 0)::int as total_points
      from public.teams t
      left join public.submissions s on s.team_id = t.id and s.status in ('verified', 'revoked')
     group by t.id, t.name
     order by total_points desc;
end;
$$;

grant execute on function public.get_central_totals() to anon, authenticated, public;


create or replace function public.get_central_team_detail(p_team_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_team record;
  v_total_points int;
  v_members jsonb;
  v_feed jsonb;
begin
  -- 1. Team Info
  select id, name, slug into v_team
    from public.teams
   where id = p_team_id;

  if not found then
    raise exception 'team not found' using errcode = 'P0002';
  end if;

  -- 2. Team Total Points
  select coalesce(sum(net_points), 0)::int into v_total_points
    from public.submissions
   where team_id = p_team_id
     and status in ('verified', 'revoked');

  -- 3. Members + Individual Points
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'full_name', m.full_name,
      'sprint_track', m.sprint_track,
      'net_points', coalesce((
        select sum(s.net_points)::int
        from public.submissions s
        where s.member_id = m.id
          and s.status in ('verified', 'revoked')
      ), 0)
    ) order by m.full_name
  ), '[]'::jsonb) into v_members
  from public.profiles m
  where m.team_id = p_team_id;

  -- 4. Activity/Submission Log
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'member_name', p.full_name,
      'activity_name', a.label,
      'activity_level', a.level,
      'points', s.net_points,
      'status', s.status,
      'date', coalesce(s.decided_at, s.submitted_at)
    ) order by coalesce(s.decided_at, s.submitted_at) desc
  ), '[]'::jsonb) into v_feed
  from public.submissions s
  join public.profiles p on p.id = s.member_id
  join public.activity_catalog a on a.id = s.activity_id
  where s.team_id = p_team_id;

  return jsonb_build_object(
    'team', jsonb_build_object(
      'id', v_team.id,
      'name', v_team.name,
      'slug', v_team.slug,
      'total_points', v_total_points
    ),
    'members', v_members,
    'feed', v_feed
  );
end;
$$;

grant execute on function public.get_central_team_detail(uuid) to anon, authenticated, public;
