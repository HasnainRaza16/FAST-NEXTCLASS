import { createClient } from "@/lib/supabase/server";
import { CourseDetail } from "@/components/course-detail";
import type { Course, TimetableEntry, AttendanceRecord, NoteItem, AssignmentItem } from "@/lib/types";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: course }, { data: entries }, { data: attendance }, { data: notes }, { data: assignments }] =
    await Promise.all([
      supabase.from("courses").select("*").eq("id", id).single(),
      supabase.from("timetable").select("*").eq("course_id", id),
      supabase.from("attendance").select("*").eq("course_id", id),
      supabase.from("notes").select("*").eq("course_id", id).order("created_at", { ascending: false }),
      supabase.from("assignments").select("*").eq("course_id", id).order("due_date"),
    ]);

  if (!course) {
    return <p className="text-sm text-neutral-500">Course not found.</p>;
  }

  return (
    <CourseDetail
      course={course as Course}
      initialEntries={(entries as TimetableEntry[]) ?? []}
      initialAttendance={(attendance as AttendanceRecord[]) ?? []}
      initialNotes={(notes as NoteItem[]) ?? []}
      initialAssignments={(assignments as AssignmentItem[]) ?? []}
    />
  );
}
