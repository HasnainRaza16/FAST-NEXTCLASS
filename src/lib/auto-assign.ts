"use server";

import { createClient } from "@/lib/supabase/server";
import { findCatalogSection, getUsableClassesForSection } from "@/lib/timetable-catalog";
import { COLOR_TAGS } from "@/lib/types";

export type AutoAssignResult =
  | { status: "ok"; courseCount: number; classCount: number }
  | { status: "no_section" }
  | { status: "not_found"; section: string }
  | { status: "unchanged" }
  | { status: "error"; message: string };

/**
 * Loads the current user's profile (semester + section), matches it against
 * the existing timetable catalog (data/timetable_data.json), and makes sure
 * the student's `courses` + `timetable` rows reflect it — without ever
 * touching rows the student added manually (`is_auto_assigned = false`).
 *
 * Idempotent: calling this repeatedly for the same section is a no-op after
 * the first successful run. If the student's section has changed, the old
 * auto-assigned timetable rows are replaced; their manual entries, notes,
 * assignments, and attendance history are never deleted.
 *
 * Uses the authenticated user's own session (RLS-scoped) — no service-role
 * key involved.
 */
export async function autoAssignTimetable(): Promise<AutoAssignResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not signed in." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("section, semester")
    .eq("id", user.id)
    .single();
  if (profileError) return { status: "error", message: profileError.message };

  const section = profile?.section?.trim();
  if (!section) return { status: "no_section" };

  const catalogSection = findCatalogSection(section);
  if (!catalogSection) return { status: "not_found", section };

  const classes = getUsableClassesForSection(section);
  if (classes.length === 0) return { status: "not_found", section };

  // Idempotency check: if every auto-assigned timetable row this student
  // already has belongs to this exact section, there's nothing to do.
  const { data: existingAuto, error: existingAutoError } = await supabase
    .from("timetable")
    .select("id, section")
    .eq("user_id", user.id)
    .eq("is_auto_assigned", true);
  if (existingAutoError) return { status: "error", message: existingAutoError.message };

  const alreadyOnThisSection =
    (existingAuto?.length ?? 0) > 0 && existingAuto!.every((r) => r.section === section);
  if (alreadyOnThisSection) return { status: "unchanged" };

  // Section changed (or first run with stray auto rows from an old
  // section): drop the stale auto-assigned timetable rows only. This never
  // touches manual entries, and it does not delete the underlying course
  // rows (attendance/notes/assignments reference courses, not timetable
  // rows, so this preserves the student's history).
  const staleIds = (existingAuto ?? []).filter((r) => r.section !== section).map((r) => r.id);
  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase.from("timetable").delete().in("id", staleIds);
    if (deleteError) return { status: "error", message: deleteError.message };
  }

  // Ensure a course row exists per unique course name (reusing this
  // student's existing auto-assigned course rows instead of duplicating).
  const uniqueCourseNames = [...new Set(classes.map((c) => c.course_name))];

  const { data: existingCourses, error: existingCoursesError } = await supabase
    .from("courses")
    .select("id, course_name")
    .eq("user_id", user.id)
    .eq("is_auto_assigned", true);
  if (existingCoursesError) return { status: "error", message: existingCoursesError.message };

  const courseIdByName = new Map<string, string>();
  for (const row of existingCourses ?? []) courseIdByName.set(row.course_name, row.id);

  let colorIdx = courseIdByName.size;
  for (const name of uniqueCourseNames) {
    if (courseIdByName.has(name)) continue;
    const sample = classes.find((c) => c.course_name === name);
    const { data: inserted, error: courseInsertError } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        course_name: name,
        teacher_name: sample?.teacher_name ?? null,
        color_tag: COLOR_TAGS[colorIdx % COLOR_TAGS.length],
        is_auto_assigned: true,
      })
      .select("id")
      .single();
    colorIdx++;
    if (courseInsertError || !inserted) {
      return { status: "error", message: courseInsertError?.message ?? "Failed to create course" };
    }
    courseIdByName.set(name, inserted.id);
  }

  // Only insert timetable rows that don't already exist for this student
  // (covers re-running on the same section, and partial re-runs after an
  // earlier failure).
  const { data: currentSectionRows, error: currentSectionRowsError } = await supabase
    .from("timetable")
    .select("course_id, day, start_time")
    .eq("user_id", user.id)
    .eq("is_auto_assigned", true)
    .eq("section", section);
  if (currentSectionRowsError) return { status: "error", message: currentSectionRowsError.message };

  const existingSlotKeys = new Set(
    (currentSectionRows ?? []).map((r) => `${r.course_id}|${r.day}|${r.start_time}`)
  );

  const rowsToInsert = classes
    .map((c) => ({
      user_id: user.id,
      course_id: courseIdByName.get(c.course_name)!,
      day: c.day,
      start_time: c.start_time,
      end_time: c.end_time,
      room_number: c.room_number,
      section,
      semester: profile?.semester ?? null,
      is_auto_assigned: true,
    }))
    .filter((r) => !existingSlotKeys.has(`${r.course_id}|${r.day}|${r.start_time}`));

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase.from("timetable").insert(rowsToInsert);
    if (insertError) return { status: "error", message: insertError.message };
  }

  return { status: "ok", courseCount: uniqueCourseNames.length, classCount: classes.length };
}
