-- Mail settings per camp (specs/016-mail-settings).
--
-- camp_mail_info gains a switch for automatic payment reminders, seven timing
-- values, sender display name and reply address, and four short text blocks.
-- A null timing value means the default from lib/email/limits.ts, so existing
-- camps keep today's behaviour without a backfill. registrations gains a pause
-- flag for automatic payment reminders. email_deliveries.registration_id
-- becomes nullable for admin test sends (kind 'test'), so they count against
-- the same daily quota. Values are validated in the app, not by CHECK
-- constraints. Only the service role reads and writes.

alter table public.camp_mail_info
  add column reminders_enabled          boolean not null default true,
  add column teaser_days_before         integer,
  add column packing_days_before        integer,
  add column arrival_days_before        integer,
  add column thanks_days_after          integer,
  add column reminder_first_after_days  integer,
  add column reminder_before_due_days   integer,
  add column reminder_min_gap_days      integer,
  add column sender_name                text,
  add column reply_to                   text,
  add column text_greeting              text,
  add column text_closing               text,
  add column contact_name               text,
  add column contact_phone              text;

alter table public.registrations
  add column reminders_paused     boolean not null default false,
  add column reminders_paused_at  timestamptz;

alter table public.email_deliveries
  alter column registration_id drop not null;
