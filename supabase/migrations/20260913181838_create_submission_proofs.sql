-- Migration: Create submission_proofs table
-- Tracks files/proof attachments uploaded for team sprint submissions.

create table if not exists public.submission_proofs (
  id uuid not null default gen_random_uuid (),
  submission_id uuid not null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  uploaded_at timestamp with time zone not null default now(),
  team_id uuid not null,
  constraint submission_proofs_pkey primary key (id),
  constraint submission_proofs_submission_id_fkey foreign key (submission_id) references public.submissions (id) on delete cascade,
  constraint submission_proofs_team_id_fkey foreign key (team_id) references public.teams (id) on delete cascade
) tablespace pg_default;

-- Indexes for fast lookup by submission and team
create index if not exists idx_submission_proofs_submission_id on public.submission_proofs (submission_id);
create index if not exists idx_submission_proofs_team_id on public.submission_proofs (team_id);

-- RLS Policies
alter table public.submission_proofs enable row level security;

-- Allow members of the team to view their proofs, and core/lead to view all
create policy "Team members and reviewers can read proofs"
  on public.submission_proofs
  for select
  to authenticated
  using (
    team_id in (select team_id from public.profiles where id = auth.uid())
    or (select public.authorize('submissions.verify'))
  );

-- Allow team members to insert proofs for their own submissions
create policy "Team members can insert submission proofs"
  on public.submission_proofs
  for insert
  to authenticated
  with check (
    team_id in (select team_id from public.profiles where id = auth.uid())
  );
