import { getCourses, getAttendance } from "@/lib/data";
import { AttendanceTracker } from "@/components/attendance-tracker";

export default async function AttendancePage() {
  const [courses, records] = await Promise.all([getCourses(), getAttendance()]);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Attendance</h1>
      <AttendanceTracker courses={courses} records={records} />
    </div>
  );
}
