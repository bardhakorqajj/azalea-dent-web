-- ---------------------------------------------------------------------------
-- Azalea Dent — initial schema.
--
-- One database serves both the public website and the admin dashboard, so
-- every table here is the single source of truth for what patients see.
--
-- Text that appears on the public, bilingual website is stored as jsonb in the
-- shape {"sq": "...", "en": "..."} — the same `Localised` type the site's
-- components already take. Clinic-internal text (notes, statuses) is plain
-- text, because only the clinic reads it.
-- ---------------------------------------------------------------------------

-- === Uploaded media ========================================================
-- Files live in the database rather than on disk: serverless hosts give every
-- request a fresh, read-only filesystem, so an uploaded photo written to disk
-- disappears. Rows are served by /api/media/[id] and resized on the way out by
-- Next's image optimiser.
create table media (
  id          uuid primary key default gen_random_uuid(),
  filename    text        not null,
  mime_type   text        not null,
  byte_size   integer     not null check (byte_size > 0),
  width       integer,
  height      integer,
  -- sha256 of the bytes, so re-uploading the same photo reuses one row.
  checksum    text        not null unique,
  data        bytea       not null,
  created_at  timestamptz not null default now()
);

-- === Admin account and sessions ===========================================
-- Exactly one row, enforced by the primary key check: this is a private
-- dashboard for the clinic owner, not a multi-user system.
create table admin_account (
  id            smallint    primary key default 1 check (id = 1),
  email         text        not null,
  -- scrypt, as "scrypt$N$r$p$salt$hash". Never a plaintext password.
  password_hash text        not null,
  name          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table admin_session (
  id           uuid        primary key default gen_random_uuid(),
  -- sha256 of the cookie token. A stolen database cannot be replayed as a login.
  token_hash   text        not null unique,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at   timestamptz not null,
  ip           text,
  user_agent   text
);

create index admin_session_expires_idx on admin_session (expires_at);

-- Brute-force protection. In the database rather than in memory because
-- serverless instances are short-lived and do not share memory, so an
-- in-process counter resets itself for an attacker every few requests.
create table auth_attempt (
  id         bigserial   primary key,
  -- The throttled subject: "ip:1.2.3.4" or "email:owner@example.org".
  scope      text        not null,
  successful boolean     not null default false,
  created_at timestamptz not null default now()
);

create index auth_attempt_scope_idx on auth_attempt (scope, created_at desc);

-- === Services =============================================================
create table service (
  id               uuid        primary key default gen_random_uuid(),
  slug             text        not null unique,
  title            jsonb       not null default '{}'::jsonb,
  summary          jsonb       not null default '{}'::jsonb,
  -- Body copy, paragraphs separated by a blank line, per language.
  body             jsonb       not null default '{}'::jsonb,
  -- [{"sq": "...", "en": "..."}] — the practical points on a service page.
  highlights       jsonb       not null default '[]'::jsonb,
  -- Free text, so "from 250 €" and "250–400 €" are both expressible.
  price_text       jsonb       not null default '{}'::jsonb,
  duration_minutes integer     check (duration_minutes is null or duration_minutes > 0),
  image_id         uuid        references media (id) on delete set null,
  seo_title        jsonb       not null default '{}'::jsonb,
  seo_description  jsonb       not null default '{}'::jsonb,
  is_active        boolean     not null default true,
  is_featured      boolean     not null default false,
  position         integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index service_active_idx on service (is_active, position);

-- === Team =================================================================
create table team_member (
  id             uuid        primary key default gen_random_uuid(),
  name           text        not null,
  slug           text        not null unique,
  role           jsonb       not null default '{}'::jsonb,
  bio            jsonb       not null default '{}'::jsonb,
  qualifications jsonb       not null default '[]'::jsonb,
  specialties    jsonb       not null default '[]'::jsonb,
  photo_id       uuid        references media (id) on delete set null,
  -- {"instagram": "https://…", "facebook": "…", "linkedin": "…"}
  socials        jsonb       not null default '{}'::jsonb,
  is_active      boolean     not null default true,
  position       integer     not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index team_member_active_idx on team_member (is_active, position);

-- === Treatments ===========================================================
-- A treatment is a specific procedure; a service is the area of care it sits
-- under. Nullable service_id keeps a treatment usable before it is filed.
create table treatment (
  id               uuid        primary key default gen_random_uuid(),
  slug             text        not null unique,
  service_id       uuid        references service (id) on delete set null,
  title            jsonb       not null default '{}'::jsonb,
  summary          jsonb       not null default '{}'::jsonb,
  body             jsonb       not null default '{}'::jsonb,
  price_text       jsonb       not null default '{}'::jsonb,
  duration_minutes integer     check (duration_minutes is null or duration_minutes > 0),
  image_id         uuid        references media (id) on delete set null,
  is_active        boolean     not null default true,
  is_featured      boolean     not null default false,
  position         integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index treatment_service_idx on treatment (service_id, position);

-- === Patients =============================================================
-- Deliberately minimal. The clinic's own records live in its clinical system;
-- this holds only what the dashboard needs to recognise a returning patient
-- and reach them about an appointment.
create table patient (
  id            uuid        primary key default gen_random_uuid(),
  full_name     text        not null,
  phone         text,
  email         text,
  date_of_birth date,
  address       text,
  -- Clinic-internal. Never rendered on the public website.
  notes         text,
  is_archived   boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index patient_name_idx on patient (lower(full_name));
create index patient_phone_idx on patient (phone);
create index patient_email_idx on patient (lower(email));
create index patient_created_idx on patient (created_at desc);

-- === Appointments =========================================================
-- The date and the time of day are stored separately, not as one timestamp:
-- the clinic works in a single timezone and reads "14:30 on the 4th", and a
-- timestamptz would silently shift that for whoever opens the dashboard from
-- another timezone.
create table appointment (
  id               uuid        primary key default gen_random_uuid(),
  patient_id       uuid        references patient (id) on delete set null,
  -- Contact details as given at the time of the request. A website request
  -- has no patient row yet, and a patient may since have changed their number.
  patient_name     text        not null,
  phone            text,
  email            text,
  service_id       uuid        references service (id) on delete set null,
  -- Used when the request names no known service ("not sure yet").
  service_label    text,
  team_member_id   uuid        references team_member (id) on delete set null,
  scheduled_date   date        not null,
  -- Null while only a rough preference is known.
  scheduled_time   time,
  time_slot        text        check (time_slot is null or time_slot in ('morning', 'afternoon', 'evening')),
  duration_minutes integer     check (duration_minutes is null or duration_minutes > 0),
  status           text        not null default 'pending'
                     check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  -- Where the request came from, so website requests are recognisable.
  source           text        not null default 'admin'
                     check (source in ('admin', 'website', 'phone', 'walk_in')),
  -- What the patient wrote.
  notes            text,
  -- What the clinic wrote. Kept apart so the two are never confused.
  internal_notes   text,
  locale           text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index appointment_date_idx on appointment (scheduled_date, scheduled_time);
create index appointment_status_idx on appointment (status, scheduled_date);
create index appointment_patient_idx on appointment (patient_id, scheduled_date desc);
create index appointment_created_idx on appointment (created_at desc);

-- === Treatment history ====================================================
create table patient_treatment (
  id             uuid        primary key default gen_random_uuid(),
  patient_id     uuid        not null references patient (id) on delete cascade,
  treatment_id   uuid        references treatment (id) on delete set null,
  appointment_id uuid        references appointment (id) on delete set null,
  -- Kept as text as well, so history survives a treatment being renamed.
  label          text        not null,
  performed_on   date        not null,
  cost_text      text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index patient_treatment_patient_idx on patient_treatment (patient_id, performed_on desc);

-- === Social media =========================================================
-- Posts are prepared and approved here. Publishing to Instagram or Facebook
-- needs an authorised API connection that does not exist yet, so 'published'
-- is only ever set by a real integration or by the admin recording that a post
-- went out — nothing in this application pretends to publish.
create table social_post (
  id               uuid        primary key default gen_random_uuid(),
  platform         text        not null default 'instagram'
                     check (platform in ('instagram', 'facebook', 'tiktok', 'other')),
  headline         text,
  caption          text        not null,
  -- ["#implantedentare", "#prishtine"]
  hashtags         jsonb       not null default '[]'::jsonb,
  media_id         uuid        references media (id) on delete set null,
  -- A note about the photo or video to shoot, when there is no file yet.
  media_suggestion text,
  language         text        not null default 'sq',
  status           text        not null default 'draft'
                     check (status in ('draft', 'ready_for_approval', 'approved', 'scheduled', 'published', 'failed')),
  scheduled_for    timestamptz,
  approved_at      timestamptz,
  published_at     timestamptz,
  -- Filled in by a future integration, or pasted in by hand.
  external_url     text,
  failure_reason   text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index social_post_status_idx on social_post (status, scheduled_for);
create index social_post_scheduled_idx on social_post (scheduled_for);

-- === Website content ======================================================
-- Editable pieces of the public website. The set of keys is declared in code
-- (src/lib/cms/registry.ts) together with the text the site ships with, so a
-- key with no row here simply renders that default: the website cannot be
-- emptied by an unset field.
create table content_block (
  key        text        primary key,
  -- {"sq": "...", "en": "..."} for text, {"mediaId": "…"} for an image.
  value      jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table faq_item (
  id         uuid        primary key default gen_random_uuid(),
  question   jsonb       not null default '{}'::jsonb,
  answer     jsonb       not null default '{}'::jsonb,
  is_active  boolean     not null default true,
  position   integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- === Promotions ===========================================================
create table promotion (
  id            uuid        primary key default gen_random_uuid(),
  slug          text        not null unique,
  title         jsonb       not null default '{}'::jsonb,
  description   jsonb       not null default '{}'::jsonb,
  discount_text jsonb       not null default '{}'::jsonb,
  cta_label     jsonb       not null default '{}'::jsonb,
  cta_href      text,
  image_id      uuid        references media (id) on delete set null,
  starts_on     date,
  ends_on       date,
  is_active     boolean     not null default false,
  position      integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- A promotion cannot end before it starts.
  constraint promotion_dates_ordered check (starts_on is null or ends_on is null or ends_on >= starts_on)
);

create index promotion_window_idx on promotion (is_active, starts_on, ends_on);

-- === Reviews ==============================================================
-- `source` is what separates a review the clinic typed in from one a future
-- integration imported: 'manual' is hand-entered, anything else arrived from
-- that platform and carries `imported_at`.
create table review (
  id            uuid        primary key default gen_random_uuid(),
  author_name   text        not null,
  body          jsonb       not null default '{}'::jsonb,
  rating        smallint    check (rating is null or rating between 1 and 5),
  source        text        not null default 'manual'
                  check (source in ('manual', 'google', 'facebook', 'instagram', 'other')),
  external_id   text,
  external_url  text,
  reviewed_on   date,
  imported_at   timestamptz,
  is_published  boolean     not null default false,
  is_featured   boolean     not null default false,
  position      integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- One row per imported review, so a re-run of an import updates instead of duplicating.
create unique index review_external_idx on review (source, external_id)
  where external_id is not null;
create index review_published_idx on review (is_published, position);

-- === Gallery ==============================================================
create table gallery_category (
  id         uuid        primary key default gen_random_uuid(),
  slug       text        not null unique,
  name       jsonb       not null default '{}'::jsonb,
  position   integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table gallery_image (
  id              uuid        primary key default gen_random_uuid(),
  media_id        uuid        not null references media (id) on delete cascade,
  category_id     uuid        references gallery_category (id) on delete set null,
  alt             jsonb       not null default '{}'::jsonb,
  caption         jsonb       not null default '{}'::jsonb,
  kind            text        not null default 'clinic'
                    check (kind in ('clinic', 'work', 'team', 'other')),
  -- Treatment photographs are of a patient's mouth. Written consent has to be
  -- on file before one can be published; `is_published_guard` below enforces it.
  consent_on_file boolean     not null default false,
  is_published    boolean     not null default false,
  is_featured     boolean     not null default false,
  position        integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- The privacy rule, in the database rather than only in the form: a
  -- treatment photo cannot be published without recorded consent, however
  -- the row is written.
  constraint gallery_work_needs_consent
    check (kind <> 'work' or is_published = false or consent_on_file = true)
);

create index gallery_image_published_idx on gallery_image (is_published, position);
create index gallery_image_category_idx on gallery_image (category_id, position);

-- === Messages =============================================================
create table message (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  email      text,
  phone      text,
  subject    text,
  body       text        not null,
  source     text        not null default 'website'
               check (source in ('website', 'phone', 'instagram', 'facebook', 'walk_in', 'other')),
  locale     text,
  is_read    boolean     not null default false,
  status     text        not null default 'new'
               check (status in ('new', 'in_progress', 'replied', 'archived', 'spam')),
  -- Hashed, not stored raw: enough to spot a flood, not a record of who visited.
  ip_hash    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index message_status_idx on message (status, created_at desc);
create index message_unread_idx on message (is_read, created_at desc);

-- === Settings =============================================================
-- Clinic details, opening hours, social links and notification preferences.
-- Keys are declared in src/lib/settings/registry.ts alongside the values the
-- site already ships with, so an unset key falls back rather than blanking.
create table setting (
  key        text        primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

-- === Activity =============================================================
-- A real record of what happened, which is what the dashboard's notifications
-- and recent-activity panels read. Nothing here is generated or estimated.
create table activity (
  id         bigserial   primary key,
  kind       text        not null,
  entity     text,
  entity_id  uuid,
  summary    text        not null,
  meta       jsonb       not null default '{}'::jsonb,
  -- Set when the admin has seen it in the notifications panel.
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index activity_created_idx on activity (created_at desc);
create index activity_unread_idx on activity (read_at, created_at desc);
