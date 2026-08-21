# FAST NextClass

A personal academic assistant for university students — timetable, live "next class"
countdown, attendance tracking, reminders, and notifications. Built with Next.js 15,
TypeScript, Tailwind, and Supabase.

## What's built

- **Auth** — sign up, login, forgot password, profile (Supabase Auth)
- **Dashboard** — greeting, live next/current class card with countdown, today's
  schedule, tomorrow preview, low-attendance banner
- **Timetable** — weekly grid view, add/edit/delete classes with color tags
  (drag-and-drop is not implemented — click-to-edit only, see "Not included" below)
- **Next-class engine** — computes current class, next class, and remaining time
  client-side, refreshing every 30s
- **Reminders** — 5/10/15/30-min-before browser + in-app notifications, toggleable
  in Profile (uses the browser Notification API; preference stored in localStorage)
- **Attendance** — per-course present/absent marking, automatic percentage,
  warning under 75%
- **Course details** — schedule, attendance, notes, assignments per course
- **Search** — across course, teacher, room, day
- **Notifications center** — list + mark as read
- **Light/dark mode**
- **Demo data** — all 104 sections from your uploaded PDF, parsed into
  `data/timetable_data.json`, loadable via `scripts/seed.mjs`

## Not included (flagged, not silently skipped)

- Drag-and-drop rearranging on the weekly grid (spec asked for it; out of scope
  for this pass — edit dialog covers add/edit/delete)
- Push notifications while the app/tab is closed (only works while a tab is open,
  since there's no service worker / push subscription backend yet)
- The "future features" the spec explicitly said not to build (classroom finder,
  campus map, AI assistant, etc.) — architecture doesn't block adding them later

## Setup

1. **Create a Supabase project** at supabase.com.
2. **Run the schema**: open the SQL editor in your Supabase project and run the
   contents of `supabase/schema.sql`. This creates all tables, RLS policies, and
   the trigger that auto-creates a profile row on signup.
3. **Copy env vars**: `cp .env.example .env.local` and fill in your Supabase URL
   and anon key (Project Settings → API).
4. **Install & run**:
   ```bash
   npm install
   npm run dev
   ```
5. Visit `http://localhost:3000`, sign up, and you're in.

## Loading demo data (optional)

To seed a section's real timetable (from your PDF) into an account:

```bash
# also add SUPABASE_SERVICE_ROLE_KEY to your env first (Project Settings → API)
npm run seed -- --email demo@example.com --password demopass123 --section BAI-1A
```

Any of the 104 sections works — see `data/timetable_data.json` for the full list
of section codes (e.g. `BAI-1A`, `BCS-7J`, `BSE-9A`, ...).

Note: the source PDF's text layer had some rendering artifacts on a handful of
overlapping cells (mostly Wednesday/Ideology-and-Constitution entries across
sections) — course names came through slightly garbled in maybe 3-5% of entries.
Worth a quick skim of `data/timetable_data.json` before seeding a section you
care about, and fixing any oddities directly in the JSON (or just editing the
class afterward from the Schedule page once it's seeded).

## Deploying to Vercel

1. Push this project to a GitHub repo.
2. Import it in Vercel.
3. Add the two `NEXT_PUBLIC_SUPABASE_*` env vars in Vercel's project settings
   (Environment Variables) — same values as your `.env.local`.
4. Deploy. No other config needed — `next.config.ts` is untouched from defaults.

## Project structure

```
src/app/                  routes (App Router)
  page.tsx                landing page
  login, signup, forgot-password
  dashboard/              protected routes (middleware-gated)
    page.tsx              home
    schedule/              weekly timetable + CRUD
    attendance/            attendance tracker
    notifications/         notification center
    search/                cross-field search
    profile/               account + reminder settings
    courses/[id]/          course detail (schedule, attendance, notes, assignments)
src/components/           UI components (shadcn-style primitives + feature components)
src/lib/
  types.ts                shared TS types
  next-class-engine.ts    current/next class + countdown logic
  data.ts                 server-side Supabase queries
  supabase/               client/server/middleware Supabase setup
supabase/schema.sql        full DB schema + RLS policies
scripts/seed.mjs           loads a section from data/timetable_data.json
data/timetable_data.json   all 104 parsed sections from the uploaded PDF
```
