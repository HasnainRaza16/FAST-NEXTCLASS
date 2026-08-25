COURSE MATERIALS FEATURE — WHAT'S IN THIS ZIP
================================================

This zip mirrors your project's folder structure exactly. Unzip it and
copy everything INTO your FAST-NEXTCLASS project root, overwriting when
prompted for the 2 files that already exist. Nothing else in your repo
is touched.

NEW FILES (14):
  data/materials/semester-1.json          course material index, sem 1
  data/materials/semester-2.json          course material index, sem 2
  data/materials/semester-3.json          course material index, sem 3
  data/materials/semester-4.json          course material index, sem 4
  data/materials/semester-5.json          course material index, sem 5
  data/materials/summary.json             counts used by the overview page
  src/lib/materials.ts                    server-side data loaders (reads the JSON above)
  src/lib/materials-types.ts              shared types + category ordering (client-safe)
  src/lib/materials-links.ts              View/Download/Share URL builders
  src/lib/material-icons.ts               file-type -> icon map
  src/app/api/materials/download/route.ts proxies a file so it actually downloads (not just opens)
  src/app/api/materials/search/route.ts   cross-semester search endpoint
  src/app/dashboard/materials/page.tsx    Materials overview (semester picker + search)
  src/app/dashboard/materials/[semester]/page.tsx   one semester's browser page
  src/components/materials-search.tsx     global search bar (used on overview page)
  src/components/materials-browser.tsx    subject/category picker + file list (used on semester page)
  src/components/material-file-row.tsx    one file row: View / Download / Share buttons

MODIFIED FILES (2 — these already exist in your repo, this REPLACES them):
  src/app/page.tsx              added a 4th feature card ("Course materials") to the
                                 landing page, same Card style/colors as the existing 3
  src/components/dashboard-nav.tsx   added "Materials" as a primary nav item (desktop
                                 sidebar + mobile bottom bar); moved "Alerts" into the
                                 existing mobile "More" menu to keep the bottom bar at
                                 the same number of icons as before

WHERE THIS DATA CAME FROM
--------------------------
The five FAST-KHI-Semester-N GitHub repos (~10-15GB combined) are NOT
duplicated into your project — that would break GitHub/Vercel limits.
Instead, each JSON file above is a categorized INDEX (subject, category,
filename, and a link) pointing at the files still hosted on GitHub. Your
app fetches/downloads them live from there. This also means your app
stays current automatically whenever those source repos get new papers
— you don't need to regenerate anything for that.

HOW EACH FILE ACTION WORKS
----------------------------
- View     -> opens the file's GitHub page in a new tab
- Download -> goes through your own /api/materials/download route, which
              streams the file back with a Content-Disposition header so
              phones/browsers actually download it instead of just
              opening it (cross-origin links normally can't force this)
- Share    -> uses the native share sheet (Web Share API) on
              phones/supported browsers; falls back to copying the
              GitHub link to the clipboard on browsers that don't
              support it

AFTER COPYING THE FILES IN
----------------------------
No new npm packages are needed — everything uses dependencies already
in your package.json.

  npm install
  npm run build
  npm run lint

Then commit:

  git add .
  git commit -m "Add Course Materials: slides, past papers & more, semester-wise"
  git push

WHAT WAS TESTED
-----------------
- npx tsc --noEmit        -> clean
- npm run lint             -> clean (only 2 pre-existing unrelated warnings)
- npm run build             -> clean, all 5 semester pages statically prerendered
- Ran the built app locally and confirmed:
    - /dashboard/materials and /dashboard/materials/3 are correctly
      protected by your existing auth middleware (redirect to /login
      when logged out, same as every other dashboard page)
    - the search API returns real, correctly matched results
    - the download proxy returns real files with correct
      Content-Disposition headers, and rejects any URL outside the
      5 known GitHub repos (can't be used as an open proxy)

STILL TO DO (can't be tested outside a real browser/device)
--------------------------------------------------------------
- Actual tap-through on a phone: View opening GitHub, Download saving
  to the device, Share opening the native share sheet
- Visual check on a few different screen sizes (should match your
  existing Card/Badge/Input styling exactly — nothing was restyled)
