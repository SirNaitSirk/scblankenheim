-- Per-admin dashboard metric selection.
-- Each admin chooses which metric cards appear on the dashboard (and their order).
-- Stored as an ordered JSON array of metric descriptors; empty ⇒ app-side defaults.
-- Additive column — no backfill needed.

alter table public.profiles
  add column dashboard_metrics jsonb not null default '[]'::jsonb;
