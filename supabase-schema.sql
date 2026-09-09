-- Siddiqi 360 — Access Code Table
-- Run this once in your Supabase project's SQL Editor (Supabase dashboard → SQL Editor → New query → paste → Run).
--
-- Design note: this table intentionally stores NOTHING that identifies a patient.
-- No name, no date of birth, no contact info. Just the code itself, a status,
-- and an optional short internal note staff can use for their own reference
-- (e.g. "Hip cohort, Aug 2026") — never a patient's name.
-- The office keeps the actual "which code went to which patient" mapping in
-- its existing patient chart system, exactly as it does today.

create table if not exists access_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked')),
  note text,
  created_at timestamptz not null default now(),
  redemption_count integer not null default 0,
  last_used_at timestamptz
);

-- Speeds up the sign-in lookup (every patient sign-in queries by code)
create index if not exists idx_access_codes_code on access_codes (code);

-- Row Level Security: locked down by default. The Netlify functions use a
-- separate "service role" key (kept secret, never shipped to the app) that
-- bypasses RLS entirely, so patients and the public can never query this
-- table directly — only through the validate/generate/list/revoke functions.
alter table access_codes enable row level security;
