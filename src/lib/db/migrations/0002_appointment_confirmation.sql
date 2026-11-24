-- ---------------------------------------------------------------------------
-- Confirmation messages to patients.
--
-- When the clinic confirms an appointment it can send the patient a message by
-- email, SMS or WhatsApp. These columns record that it went, how, and which
-- date and time it named, so the dashboard can say when an appointment has
-- been moved since the patient was told.
--
-- Only successful sends are recorded. Nothing here schedules anything: there
-- are no reminders.
-- ---------------------------------------------------------------------------

alter table appointment
  add column confirmation_sent_at  timestamptz,
  -- Every channel the confirmation has reached the patient on, e.g. {email,sms}.
  add column confirmation_channels text[] not null default '{}'
    check (confirmation_channels <@ array['email', 'sms', 'whatsapp']::text[]),
  -- The date and time the message named, as "YYYY-MM-DD HH:MM" (or just the
  -- date when no time was set).
  add column confirmation_for      text;
