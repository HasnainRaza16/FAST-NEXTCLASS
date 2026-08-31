import { getProfile, getTimetable, getTimetableFresh, getCourses, getCoursesFresh } from "@/lib/data";
import { autoAssignTimetable } from "@/lib/auto-assign";
import { WeeklyTimetableEditor } from "@/components/weekly-timetable-editor";

export default async function SchedulePage() {
  const [profile, initialEntries, initialCourses] = await Promise.all([
    getProfile(),
    getTimetable(),
    getCourses(),
  ]);

  let entries = initialEntries;
  let courses = initialCourses;
  let noTimetableForSection: string | null = null;

  // Runs on every visit, not just before the student's timetable has ever
  // been auto-loaded. autoAssignTimetable() is idempotent (a single cheap
  // "unchanged" read when nothing's different), so this safely picks up
  // catalog corrections or a section change for students who already have
  // a timetable, not just brand-new ones landing on Schedule directly.
  if (profile?.section) {
    const result = await autoAssignTimetable();
    if (result.status === "ok") {
      [entries, courses] = await Promise.all([getTimetableFresh(), getCoursesFresh()]);
    } else if (result.status === "not_found" && entries.length === 0) {
      noTimetableForSection = result.section;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {noTimetableForSection && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          No timetable is available yet for section {noTimetableForSection}. Add your classes manually below.
        </div>
      )}
      <WeeklyTimetableEditor initialEntries={entries} initialCourses={courses} />
    </div>
  );
}
