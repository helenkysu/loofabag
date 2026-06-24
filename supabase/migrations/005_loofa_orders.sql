-- Persisted Printful/Stripe orders, one row per checkout session
create table if not exists loofabag_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  slug text not null,
  product_id text not null,
  product_name text not null,
  product_image text,
  variant_id integer,
  stripe_session_id text not null unique,
  amount_total integer,
  currency text,
  shipping_label text,
  address jsonb not null default '{}',
  printful_order_id bigint,
  printful_order_number text,
  status text not null default 'draft',
  tracking jsonb,
  checkout_draft jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists loofabag_orders_user_id_idx on loofabag_orders (user_id, created_at desc);
create index if not exists loofabag_orders_slug_idx on loofabag_orders (slug);
