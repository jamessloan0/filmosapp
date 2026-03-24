-- FilmOS Supabase Schema
-- Run this in the Supabase SQL editor to create all tables

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  full_name     text,
  role          text not null default 'user',   -- 'user' | 'tester' | 'admin'
  plan          text not null default 'free',   -- 'free' | 'pro'
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read their own record"
  on public.users for select
  using (auth.jwt() ->> 'email' = email);

create policy "Users can update their own record"
  on public.users for update
  using (auth.jwt() ->> 'email' = email);

-- Service role can do anything (needed by Netlify functions)
-- No extra policy needed — service role bypasses RLS automatically.

-- ─────────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────────
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  client_name   text,
  client_email  text,
  owner_email   text not null,
  status        text not null default 'proposal',
  access_token  text unique not null,
  archived      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Owners can manage their projects"
  on public.projects for all
  using (auth.jwt() ->> 'email' = owner_email);

-- ─────────────────────────────────────────────
-- PROJECT FILES
-- ─────────────────────────────────────────────
create table if not exists public.project_files (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  file_name     text not null,
  file_url      text,
  s3_key        text,
  category      text not null default 'proposal',  -- 'proposal'|'references'|'drafts'|'deliverables'
  uploaded_by   text,
  created_by    text,
  expires_at    timestamptz,
  proxy_status  text,
  proxy_url     text,
  version_note  text,
  created_at    timestamptz not null default now()
);

alter table public.project_files enable row level security;

create policy "Project owners can manage files"
  on public.project_files for all
  using (
    exists (
      select 1 from public.projects
      where id = project_files.project_id
      and owner_email = auth.jwt() ->> 'email'
    )
  );

-- ─────────────────────────────────────────────
-- MESSAGES
-- ─────────────────────────────────────────────
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  content       text not null,
  sender_name   text,
  sender_type   text not null default 'filmmaker',  -- 'filmmaker' | 'client'
  created_at    timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Project owners can manage messages"
  on public.messages for all
  using (
    exists (
      select 1 from public.projects
      where id = messages.project_id
      and owner_email = auth.jwt() ->> 'email'
    )
  );

-- ─────────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────────
create table if not exists public.invoices (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  invoice_number  text,
  amount          numeric(10,2),
  currency        text default 'USD',
  status          text not null default 'draft',  -- 'draft'|'sent'|'paid'
  due_date        date,
  line_items      jsonb,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.invoices enable row level security;

create policy "Project owners can manage invoices"
  on public.invoices for all
  using (
    exists (
      select 1 from public.projects
      where id = invoices.project_id
      and owner_email = auth.jwt() ->> 'email'
    )
  );

-- ─────────────────────────────────────────────
-- ACTIVITIES
-- ─────────────────────────────────────────────
create table if not exists public.activities (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  type          text not null,
  description   text,
  actor_name    text,
  created_at    timestamptz not null default now()
);

alter table public.activities enable row level security;

create policy "Project owners can manage activities"
  on public.activities for all
  using (
    exists (
      select 1 from public.projects
      where id = activities.project_id
      and owner_email = auth.jwt() ->> 'email'
    )
  );

-- ─────────────────────────────────────────────
-- FEEDBACK
-- ─────────────────────────────────────────────
create table if not exists public.feedback (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  title         text not null,
  description   text,
  file_url      text,
  s3_key        text,
  decision      text not null default 'pending',  -- 'pending'|'approved'|'changes_requested'
  client_name   text,
  client_note   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "Project owners can manage feedback"
  on public.feedback for all
  using (
    exists (
      select 1 from public.projects
      where id = feedback.project_id
      and owner_email = auth.jwt() ->> 'email'
    )
  );

-- ─────────────────────────────────────────────
-- PROPOSALS
-- ─────────────────────────────────────────────
create table if not exists public.proposals (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  title           text not null,
  status          text not null default 'draft',  -- 'draft'|'sent'|'approved'|'changes_requested'
  slides          jsonb,
  client_name     text,
  client_decision text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.proposals enable row level security;

create policy "Project owners can manage proposals"
  on public.proposals for all
  using (
    exists (
      select 1 from public.projects
      where id = proposals.project_id
      and owner_email = auth.jwt() ->> 'email'
    )
  );

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────
create table if not exists public.notifications (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid references public.projects(id) on delete cascade,
  project_name     text,
  type             text not null,
  title            text not null,
  body             text,
  read             boolean not null default false,
  recipient_email  text not null,
  created_at       timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can manage their own notifications"
  on public.notifications for all
  using (auth.jwt() ->> 'email' = recipient_email);

-- ─────────────────────────────────────────────
-- NOTIFICATION SETTINGS
-- ─────────────────────────────────────────────
create table if not exists public.notification_settings (
  id                    uuid primary key default gen_random_uuid(),
  project_id            uuid not null references public.projects(id) on delete cascade,
  user_email            text not null,
  notify_on_message     boolean not null default true,
  notify_on_feedback    boolean not null default true,
  notify_on_proposal    boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (project_id, user_email)
);

alter table public.notification_settings enable row level security;

create policy "Users can manage their own notification settings"
  on public.notification_settings for all
  using (auth.jwt() ->> 'email' = user_email);

-- ─────────────────────────────────────────────
-- PENDING TESTERS
-- ─────────────────────────────────────────────
create table if not exists public.pending_testers (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  created_at  timestamptz not null default now()
);

alter table public.pending_testers enable row level security;

-- Only admins can manage this table (enforced in Netlify function, not RLS)
-- Grant service role full access via the function layer.

-- ─────────────────────────────────────────────
-- REALTIME: enable for live messaging
-- ─────────────────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;

-- ─────────────────────────────────────────────
-- STORAGE BUCKET: proposal image uploads
-- ─────────────────────────────────────────────
-- Run in Supabase dashboard: Storage > New Bucket
-- Name: public-assets
-- Public: true
-- Or run:
-- insert into storage.buckets (id, name, public) values ('public-assets', 'public-assets', true);

-- ─────────────────────────────────────────────
-- INDEXES for common query patterns
-- ─────────────────────────────────────────────
create index if not exists idx_projects_owner_email     on public.projects(owner_email);
create index if not exists idx_projects_access_token    on public.projects(access_token);
create index if not exists idx_project_files_project_id on public.project_files(project_id);
create index if not exists idx_messages_project_id      on public.messages(project_id);
create index if not exists idx_invoices_project_id      on public.invoices(project_id);
create index if not exists idx_activities_project_id    on public.activities(project_id);
create index if not exists idx_feedback_project_id      on public.feedback(project_id);
create index if not exists idx_proposals_project_id     on public.proposals(project_id);
create index if not exists idx_notifications_recipient  on public.notifications(recipient_email);
create index if not exists idx_notifications_read       on public.notifications(read);
