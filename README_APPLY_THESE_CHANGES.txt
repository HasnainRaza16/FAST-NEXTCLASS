EXAM PREP FEATURE — WHAT'S IN THIS ZIP
=========================================

Unzip and copy everything INTO your FAST-NEXTCLASS project root, overwriting
when prompted for the files that already exist. Mirrors your project's
folder structure exactly.

*** STEP 0 — DATABASE MIGRATION (do this FIRST, before deploying code) ***
------------------------------------------------------------------------
supabase/schema.sql has a new block appended at the end (search for
"prep_sessions" to find it) that creates the table this feature needs to
track timed sessions per student.

Open your Supabase project -> SQL Editor -> paste and run just the NEW
block at the bottom of schema.sql (the "Exam prep sessions" section).
Running the whole file again is also safe — every statement in it uses
"create table if not exists" / "create or replace" / "drop policy if
exists", so nothing gets duplicated or wiped.

If you deploy the code before running this migration, the feature will
error when someone tries to start a session (no table to write to) — so
do this step first.

MODIFIED FILES (10):
  data/materials/semester-1.json      \
  data/materials/semester-2.json       | re-categorized: Past Papers is now
  data/materials/semester-3.json       | split into "Midterm Papers" and
  data/materials/semester-4.json       | "Final Papers" specifically, so
  data/materials/semester-5.json       | Mid Prep and Final Prep can each
  data/materials/summary.json         /  pull the RIGHT papers
  src/lib/materials-types.ts          added "Midterm Papers" / "Final Papers"
                                       to the MaterialCategory type + display order
  src/lib/types.ts                    added PrepType / PrepSession types
  src/app/dashboard/materials/page.tsx   added an "Exam Prep" section (3 cards)
                                       above the existing semester browser
  supabase/schema.sql                 added the prep_sessions table (see Step 0)

NEW FILES (7):
  src/lib/prep.ts                             config for the 3 prep modes:
                                               durations, which material
                                               category feeds each one
  src/components/prep-picker.tsx              semester/subject picker +
                                               "Start Timed Session" button
  src/components/prep-session-runner.tsx      the live locked timer view
  src/app/dashboard/prep/[type]/page.tsx      /dashboard/prep/quiz|mid|final
  src/app/dashboard/prep/[type]/session/[id]/page.tsx   the active session page
  src/app/api/prep/materials/route.ts         returns the right papers for
                                               a subject + prep mode
  src/app/api/prep/cancel/route.ts            marks a session cancelled —
                                               called when a student leaves
                                               mid-session

HOW IT ACTUALLY WORKS
------------------------
This is a real exam-simulation tool, not a fake auto-graded quiz — I want
to be upfront about that distinction since it matters:

- The materials repos only contain PDFs of real past papers, not
  structured question banks (no "question 3, options A-D, correct
  answer B" data exists anywhere to extract). So building an
  auto-graded MCQ engine would mean either fabricating AI-generated
  questions (which are NOT real past exam questions, and could
  mislead a student studying from them) or someone manually
  transcribing thousands of real questions by hand. Neither was what
  you asked for.
- What this DOES do: pick a subject, hit "Start Timed Session", and
  the real past-paper PDFs for that subject open under an honest
  countdown (1hr for Quiz/Mid, 3hr for Final) — the actual exam
  experience, self-graded, same as sitting a real paper with a
  stopwatch.

THE "LOCK" MECHANIC
----------------------
- Leaving the session page — closing the tab, refreshing, or
  navigating to a different page in the app — marks the session
  "cancelled". Next time, they start a completely fresh session
  (no resume, matching what you asked for).
- Opening one of the past-paper PDFs in a NEW TAB during a session is
  fine and does NOT cancel it — the original tab stays put. This was
  a deliberate call: if merely switching tabs to look at the very
  paper you're supposed to be working through cancelled the session,
  the feature would be unusable. A clear on-page notice tells
  students this distinction so it's not a surprise.
- If the timer runs out while the student is still on the page, that's
  a normal completion (not a cancellation) — same for if they click
  "Finish early".
- Session state is saved to their account (via the new prep_sessions
  table), so it's consistent across devices/refresh — per what you
  asked for.

WHERE IT LIVES
-----------------
Added as an "Exam Prep" section at the top of the existing Materials
page (/dashboard/materials) rather than a new nav icon — it's really an
extension of Materials, and Materials is already one tap away from
every screen. No nav changes needed.

AFTER COPYING THE FILES IN
------------------------------
No new npm packages needed.

  1. Run the database migration in Supabase (see Step 0 above)
  2. npm install
  3. npm run build
  4. npm run lint

Then commit:

  git add .
  git commit -m "Add Exam Prep: timed sessions using real past papers, per subject"
  git push

WHAT WAS TESTED
------------------
- npx tsc --noEmit          -> clean
- npm run lint                -> clean (only 2 pre-existing unrelated warnings)
- npm run build                -> clean, all prep routes compiled
- Ran the built app locally and confirmed:
    - /dashboard/prep/quiz, /dashboard/prep/mid, /dashboard/materials all
      correctly redirect to /login when logged out (same middleware
      protection as every other dashboard page — no new auth code needed)
    - /api/prep/materials returns real, correctly filtered midterm papers
      (spot-checked Calculus) and rejects invalid parameters (400)
    - /api/prep/cancel correctly rejects unauthenticated requests (401)

STILL TO DO (needs a real logged-in account + the DB migration applied)
----------------------------------------------------------------------
- Start a real session, let it run, confirm "Finish early" and natural
  timeout both mark it completed
- Actually background/close the tab mid-session and confirm it shows as
  cancelled next time
- Confirm the "open a paper in a new tab doesn't cancel the session"
  behavior feels right in practice, on both desktop and mobile browsers
