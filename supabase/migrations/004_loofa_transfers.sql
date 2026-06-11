-- Loofa transfer requests (sender invites recipient by email to claim a loofa)
create table if not exists loofa_transfers (
  id uuid primary key default gen_random_uuid(),
  claim_token text not null unique,
  loofa_id text not null,
  loofa_data jsonb not null default '{}',
  sender_email text,
  recipient_email text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);

create index if not exists loofa_transfers_loofa_id_idx on loofa_transfers (loofa_id);
