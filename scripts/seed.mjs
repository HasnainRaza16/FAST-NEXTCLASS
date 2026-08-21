/**
 * Seed a user's account with demo timetable data from data/timetable_data.json.
 *
 * Usage:
 *   node scripts/seed.mjs --email you@example.com --password yourpassword --section BAI-1A
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in your environment (Project Settings → API
 * in Supabase) — never expose this key client-side.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith("--")) acc.push([arg.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment first.");
  process.exit(1);
}
if (!args.email || !args.password || !args.section) {
  console.error("Usage: node scripts/seed.mjs --email you@x.com --password pass --section BAI-1A");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const COLOR_TAGS = ["blue", "green", "purple", "orange", "pink", "teal", "red", "yellow"];

function normalizeTime(t) {
  // "1:30" -> "13:30:00" heuristic: PDF times before 8 are PM (8am-4:10pm day)
  if (!t) return "09:00:00";
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  if (h < 8) h += 12; // 1,2,3 -> 13,14,15 (afternoon slots)
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
}

async function main() {
  const dataPath = path.join(__dirname, "..", "data", "timetable_data.json");
  const allSections = JSON.parse(readFileSync(dataPath, "utf-8"));
  const section = allSections.find((s) => s.section === args.section);
  if (!section) {
    console.error(`Section ${args.section} not found. Available: ${allSections.map((s) => s.section).join(", ")}`);
    process.exit(1);
  }

  console.log(`Seeding ${section.classes.length} classes for section ${args.section}…`);

  // 1. Find or create the user
  let userId;
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users.find((u) => u.email === args.email);
  if (found) {
    userId = found.id;
    console.log("Using existing user:", userId);
  } else {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: args.email,
      password: args.password,
      email_confirm: true,
      user_metadata: { name: args.email.split("@")[0] },
    });
    if (error) throw error;
    userId = created.user.id;
    console.log("Created user:", userId);
  }

  await supabase.from("profiles").upsert({
    id: userId,
    name: args.email.split("@")[0],
    email: args.email,
    university: "FAST University",
    section: args.section,
    semester: "Fall 2026",
  });

  // 2. Create one course per unique course name, cycling color tags
  const uniqueCourses = [...new Set(section.classes.map((c) => c.course))];
  const courseMap = {};
  for (let i = 0; i < uniqueCourses.length; i++) {
    const name = uniqueCourses[i];
    const sample = section.classes.find((c) => c.course === name);
    const { data: courseRow, error } = await supabase
      .from("courses")
      .insert({
        user_id: userId,
        course_name: name,
        teacher_name: sample.teacher || null,
        color_tag: COLOR_TAGS[i % COLOR_TAGS.length],
      })
      .select()
      .single();
    if (error) throw error;
    courseMap[name] = courseRow.id;
  }

  // 3. Create timetable entries
  const rows = section.classes
    .filter((c) => c.start && c.end)
    .map((c) => ({
      user_id: userId,
      course_id: courseMap[c.course],
      room_number: c.room || null,
      day: c.day,
      start_time: normalizeTime(c.start),
      end_time: normalizeTime(c.end),
      section: args.section,
      semester: "Fall 2026",
    }));

  const { error: ttError } = await supabase.from("timetable").insert(rows);
  if (ttError) throw ttError;

  console.log(`Done. ${uniqueCourses.length} courses, ${rows.length} timetable entries.`);
  console.log(`Log in with ${args.email} / (the password you provided).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
