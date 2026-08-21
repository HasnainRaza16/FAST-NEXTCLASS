import { Course, AttendanceRecord, CourseAttendanceSummary } from "./types";

export function summarizeAttendance(
  courses: Course[],
  records: AttendanceRecord[]
): CourseAttendanceSummary[] {
  return courses.map((c) => {
    const forCourse = records.filter((r) => r.course_id === c.id);
    const total = forCourse.length;
    const attended = forCourse.filter((r) => r.status === "present").length;
    const missed = total - attended;
    const percentage = total > 0 ? Math.round((attended / total) * 1000) / 10 : 100;
    return { course_id: c.id, total, attended, missed, percentage };
  });
}
