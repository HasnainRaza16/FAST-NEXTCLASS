-- FAST NextClass — database schema
-- Run this in the Supabase SQL editor (or `supabase db push`).

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- Profiles (extends auth.users)
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  university text,
  department text,
  semester text,
  section text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Courses
-- ─────────────────────────────────────────────
create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_name text not null,
  course_code text,
  teacher_name text,
  color_tag text not null default 'blue',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Timetable entries
-- ─────────────────────────────────────────────
create table if not exists public.timetable (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  room_number text,
  building text,
  day text not null check (day in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  start_time time not null,
  end_time time not null,
  semester text,
  section text,
  created_at timestamptz not null default now()
);

create index if not exists timetable_user_day_idx on public.timetable (user_id, day);

-- ─────────────────────────────────────────────
-- Attendance
-- ─────────────────────────────────────────────
create table if not exists public.attendance (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present','absent')),
  created_at timestamptz not null default now(),
  unique (user_id, course_id, date)
);

-- ─────────────────────────────────────────────
-- Notifications
-- ─────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  kind text not null default 'general' check (kind in ('reminder','assignment','attendance','general')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Notes
-- ─────────────────────────────────────────────
create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Assignments
-- ─────────────────────────────────────────────
create table if not exists public.assignments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  due_date date,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Row Level Security — every table is private to its owner
-- ─────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.timetable enable row level security;
alter table public.attendance enable row level security;
alter table public.notifications enable row level security;
alter table public.notes enable row level security;
alter table public.assignments enable row level security;

drop policy if exists "profiles: owner read" on public.profiles;
create policy "profiles: owner read" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles: owner update" on public.profiles;
create policy "profiles: owner update" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles: owner insert" on public.profiles;
create policy "profiles: owner insert" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "courses: owner all" on public.courses;
create policy "courses: owner all" on public.courses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "timetable: owner all" on public.timetable;
create policy "timetable: owner all" on public.timetable for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "attendance: owner all" on public.attendance;
create policy "attendance: owner all" on public.attendance for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "notifications: owner all" on public.notifications;
create policy "notifications: owner all" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "notes: owner all" on public.notes;
create policy "notes: owner all" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "assignments: owner all" on public.assignments;
create policy "assignments: owner all" on public.assignments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Auto-assigned timetable support (additive migration)
--
-- Courses/timetable rows created automatically from a student's section
-- (via data/timetable_data.json) are flagged so they can be told apart
-- from rows the student added manually, and so re-running the assignment
-- on every login stays idempotent instead of creating duplicates.
-- Safe to re-run: every statement below is guarded with IF NOT EXISTS.
-- ─────────────────────────────────────────────
alter table public.courses add column if not exists is_auto_assigned boolean not null default false;
alter table public.timetable add column if not exists is_auto_assigned boolean not null default false;

-- Defensive safety nets (the app also checks for existing rows before
-- inserting, so these mainly guard against duplicate rows under
-- concurrent requests rather than being relied on for the main logic).
create unique index if not exists courses_user_autoname_idx
  on public.courses (user_id, course_name)
  where is_auto_assigned;

create unique index if not exists timetable_user_course_slot_idx
  on public.timetable (user_id, course_id, day, start_time);

-- Frequently-queried fields for section-based lookups.
create index if not exists profiles_semester_section_idx on public.profiles (semester, section);
create index if not exists timetable_user_section_idx on public.timetable (user_id, section);

-- ─────────────────────────────────────────────
-- Feedback (students -> developer)
-- No admin UI in the app on purpose: read submissions straight from the
-- Supabase Table Editor (Table Editor -> feedback), sorted by created_at.
-- ─────────────────────────────────────────────
create table if not exists public.feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

drop policy if exists "feedback: owner insert" on public.feedback;
create policy "feedback: owner insert" on public.feedback for insert with check (auth.uid() = user_id);
drop policy if exists "feedback: owner read own" on public.feedback;
create policy "feedback: owner read own" on public.feedback for select using (auth.uid() = user_id);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

-- Server-enforced anti-spam: RLS only checks *whose* row it is, not how
-- often — a signed-in user could otherwise script unlimited inserts
-- straight against the REST API. This trigger caps it at 5 submissions
-- per user per 15 minutes, regardless of how the insert is made.
create or replace function public.enforce_feedback_rate_limit()
returns trigger as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.feedback
  where user_id = new.user_id
    and created_at > now() - interval '15 minutes';

  if recent_count >= 5 then
    raise exception 'You are sending feedback too quickly. Please wait a few minutes and try again.';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists feedback_rate_limit on public.feedback;
create trigger feedback_rate_limit
  before insert on public.feedback
  for each row execute procedure public.enforce_feedback_rate_limit();

-- ─────────────────────────────────────────────
-- Input length caps (defensive migration — bounds previously-unbounded
-- text columns so a malformed/malicious client can't write unbounded
-- data). Existing rows are unaffected; only new writes are checked.
-- Uses drop-then-add so this file stays safe to re-run in full.
-- ─────────────────────────────────────────────
alter table public.profiles drop constraint if exists profiles_name_len;
alter table public.profiles add constraint profiles_name_len check (char_length(name) <= 120) not valid;
alter table public.profiles drop constraint if exists profiles_university_len;
alter table public.profiles add constraint profiles_university_len check (university is null or char_length(university) <= 200) not valid;
alter table public.profiles drop constraint if exists profiles_department_len;
alter table public.profiles add constraint profiles_department_len check (department is null or char_length(department) <= 80) not valid;
alter table public.profiles drop constraint if exists profiles_semester_len;
alter table public.profiles add constraint profiles_semester_len check (semester is null or char_length(semester) <= 40) not valid;
alter table public.profiles drop constraint if exists profiles_section_len;
alter table public.profiles add constraint profiles_section_len check (section is null or char_length(section) <= 40) not valid;

alter table public.courses drop constraint if exists courses_name_len;
alter table public.courses add constraint courses_name_len check (char_length(course_name) <= 200) not valid;
alter table public.courses drop constraint if exists courses_code_len;
alter table public.courses add constraint courses_code_len check (course_code is null or char_length(course_code) <= 40) not valid;
alter table public.courses drop constraint if exists courses_teacher_len;
alter table public.courses add constraint courses_teacher_len check (teacher_name is null or char_length(teacher_name) <= 120) not valid;

alter table public.notes drop constraint if exists notes_title_len;
alter table public.notes add constraint notes_title_len check (char_length(title) <= 120) not valid;
alter table public.notes drop constraint if exists notes_body_len;
alter table public.notes add constraint notes_body_len check (body is null or char_length(body) <= 5000) not valid;

alter table public.assignments drop constraint if exists assignments_title_len;
alter table public.assignments add constraint assignments_title_len check (char_length(title) <= 200) not valid;

-- feedback.message may already exist without this check if you ran an
-- earlier version of this file before the length cap was added — this
-- adds it retroactively, safely re-runnable.
alter table public.feedback drop constraint if exists feedback_message_len;
alter table public.feedback add constraint feedback_message_len check (char_length(message) between 1 and 2000) not valid;

-- ─────────────────────────────────────────────
-- Course-ownership check (found via manual security testing)
--
-- RLS's "owner all" policies on notes/assignments/attendance/timetable only
-- confirm the ROW belongs to the caller (auth.uid() = user_id) — they don't
-- confirm the course_id being referenced also belongs to that same caller.
-- Without this, a signed-in student could insert a note/assignment/
-- attendance/timetable row on their own account that points at someone
-- else's course_id. Verified this does NOT leak the other student's data
-- (RLS on `courses` still blocks reading it), but it's an unnecessary data
-- -integrity hole, so it's closed here.
-- ─────────────────────────────────────────────
create or replace function public.enforce_own_course()
returns trigger as $$
begin
  if not exists (
    select 1 from public.courses
    where id = new.course_id and user_id = new.user_id
  ) then
    raise exception 'course_id does not belong to this user';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists notes_enforce_own_course on public.notes;
create trigger notes_enforce_own_course
  before insert or update on public.notes
  for each row execute procedure public.enforce_own_course();

drop trigger if exists assignments_enforce_own_course on public.assignments;
create trigger assignments_enforce_own_course
  before insert or update on public.assignments
  for each row execute procedure public.enforce_own_course();

drop trigger if exists attendance_enforce_own_course on public.attendance;
create trigger attendance_enforce_own_course
  before insert or update on public.attendance
  for each row execute procedure public.enforce_own_course();

drop trigger if exists timetable_enforce_own_course on public.timetable;
create trigger timetable_enforce_own_course
  before insert or update on public.timetable
  for each row execute procedure public.enforce_own_course();

-- ─────────────────────────────────────────────
-- Auto-create a profile row when a user signs up
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
