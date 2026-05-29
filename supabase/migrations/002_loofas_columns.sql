-- Add columns missing from loofabag_loofas that the app needs
alter table loofabag_loofas
  add column if not exists emoji text not null default '👜',
  add column if not exists template_type text not null default 'custom',
  add column if not exists qr_token text,
  add column if not exists storage_id text,
  add column if not exists transfer_status text,
  add column if not exists transfer_recipient_email text,
  add column if not exists transfer_token text,
  add column if not exists transferred_at timestamptz;

-- Unique constraint so we can upsert profile data per loofa
alter table loofabag_profiles_data
  add constraint if not exists loofabag_profiles_data_loofa_id_key unique (loofa_id);

-- Notification settings per slug
create table if not exists loofa_notification_settings (
  slug text primary key,
  email text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Reports
create table if not exists loofa_reports (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  reason text not null,
  ip text,
  reported_at timestamptz not null default now()
);
