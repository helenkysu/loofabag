create table loofabag_submissions (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  submitted_at timestamptz not null default now(),
  responses   jsonb not null default '{}',
  file_paths  text[] not null default '{}'
);

create index loofabag_submissions_slug_idx on loofabag_submissions (slug);
