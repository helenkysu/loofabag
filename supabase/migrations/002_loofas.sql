create table loofas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  emoji text not null default '👜',
  template text not null default 'custom',
  fields jsonb not null default '[]',
  profile_fields jsonb not null default '[]',
  profile_data jsonb not null default '{}',
  is_active boolean not null default true,
  qr_token text,
  transfer_status text,
  transfer_recipient_email text,
  transfer_token text,
  transferred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index loofas_slug_idx on loofas (slug);
create index loofas_user_id_idx on loofas (user_id);
