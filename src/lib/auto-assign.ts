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

// A content fingerprint for one class slot — day/time/course/teacher/room.
// Used to detect when the catalog's data for a section has changed even
// though the section name itself hasn't (e.g. a room or teacher swap, or a
// time correction), so already-onboarded students still pick it up.
function classSignature(c: {
  day: string;
  start_time: string;
  end_time: string;
  course_name: string;
  teacher_name: string | null;
  room_number: string | null;
}): string {
  return [c.day, c.start_time, c.end_time, c.course_name, c.teacher_name ?? "", c.room_number ?? ""].join("|");
}

/**
 * Loads the current user's profile (semester + section), matches it against
 * the existing timetable catalog (data/timetable_data.json), and makes sure
 * the student's `courses` + `timetable` rows reflect it — without ever
 * touching rows the student added manually (`is_auto_assigned = false`).
 *
 * Idempotent: calling this repeatedly is a no-op once the student's
 * auto-assigned rows already match what the catalog says today. If the
 * student's section changes, OR the catalog's data for their existing
 * section changes (a class's time/room/teacher gets corrected), the old
 * auto-assigned timetable rows are replaced; manual entries, notes,
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

  const targetSignatures = new Set(classes.map(classSignature));

  // Fetch this student's existing auto-assigned timetable rows with enough
  // joined course info (course_name, teacher_name) to compare content, not
  // just section name.
  const { data: existingAuto, error: existingAutoError } = await supabase
    .from("timetable")
    .select("id, section, day, start_time, end_time, room_number, course:courses(course_name, teacher_name)")
    .eq("user_id", user.id)
    .eq("is_auto_assigned", true);
  if (existingAutoError) return { status: "error", message: existingAutoError.message };

  type ExistingAutoRow = {
    id: string;
    section: string;
    day: string;
    start_time: string;
    end_time: string;
    room_number: string | null;
    course: { course_name: string; teacher_name: string | null } | { course_name: string; teacher_name: string | null }[] | null;
  };

  const existingSignatures = new Set(
    ((existingAuto ?? []) as ExistingAutoRow[]).map((r) => {
      const course = Array.isArray(r.course) ? r.course[0] : r.course;
      return classSignature({
        day: r.day,
        start_time: r.start_time,
        end_time: r.end_time,
        course_name: course?.course_name ?? "",
        teacher_name: course?.teacher_name ?? null,
        room_number: r.room_number,
      });
    })
  );

  // Idempotency check: skip the resync only if the student is already on
  // this exact section AND every class slot matches what the catalog says
  // today. This is what makes edits to data/timetable_data.json — a time,
  // room, or teacher correction for a section students are already on —
  // propagate to those students instead of only affecting brand-new
  // signups.
  const sameSection = (existingAuto?.length ?? 0) > 0 && existingAuto!.every((r) => r.section === section);
  const sameContent =
    sameSection &&
    targetSignatures.size === existingSignatures.size &&
    [...targetSignatures].every((sig) => existingSignatures.has(sig));
  if (sameContent) return { status: "unchanged" };

  // Section changed, or the section stayed the same but the catalog's data
  // for it changed: drop all of this student's auto-assigned timetable rows
  // and rebuild them fresh. This never touches manual entries
  // (is_auto_assigned = false), and it does not delete the underlying
  // course rows (attendance/notes/assignments reference courses, not
  // timetable rows, so this preserves the student's history).
  const staleIds = (existingAuto ?? []).map((r) => r.id);
  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase.from("timetable").delete().in("id", staleIds);
    if (deleteError) return { status: "error", message: deleteError.message };
  }

  // Ensure a course row exists per unique course name (reusing this
  // student's existing auto-assigned course rows instead of duplicating),
  // and keep teacher_name in sync if the catalog corrected it.
  const uniqueCourseNames = [...new Set(classes.map((c) => c.course_name))];

  const { data: existingCourses, error: existingCoursesError } = await supabase
    .from("courses")
    .select("id, course_name, teacher_name")
    .eq("user_id", user.id)
    .eq("is_auto_assigned", true);
  if (existingCoursesError) return { status: "error", message: existingCoursesError.message };

  const courseIdByName = new Map<string, string>();
  const courseTeacherByName = new Map<string, string | null>();
  for (const row of existingCourses ?? []) {
    courseIdByName.set(row.course_name, row.id);
    courseTeacherByName.set(row.course_name, row.teacher_name);
  }

  let colorIdx = courseIdByName.size;
  for (const name of uniqueCourseNames) {
    const sample = classes.find((c) => c.course_name === name);
    const targetTeacher = sample?.teacher_name ?? null;

    if (courseIdByName.has(name)) {
      if (courseTeacherByName.get(name) !== targetTeacher) {
        const { error: updateError } = await supabase
          .from("courses")
          .update({ teacher_name: targetTeacher })
          .eq("id", courseIdByName.get(name)!);
        if (updateError) return { status: "error", message: updateError.message };
      }
      continue;
    }

    const { data: inserted, error: courseInsertError } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        course_name: name,
        teacher_name: targetTeacher,
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

  const rowsToInsert = classes.map((c) => ({
    user_id: user.id,
    course_id: courseIdByName.get(c.course_name)!,
    day: c.day,
    start_time: c.start_time,
    end_time: c.end_time,
    room_number: c.room_number,
    section,
    semester: profile?.semester ?? null,
    is_auto_assigned: true,
  }));

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase.from("timetable").insert(rowsToInsert);
    if (insertError) return { status: "error", message: insertError.message };
  }

  return { status: "ok", courseCount: uniqueCourseNames.length, classCount: classes.length };
}
