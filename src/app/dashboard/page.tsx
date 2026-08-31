import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { NextClassCard } from "@/components/next-class-card";
import { TodaySchedule } from "@/components/today-schedule";
import { TomorrowPreview } from "@/components/tomorrow-preview";
import { Card, CardContent } from "@/components/ui/card";
import {
  getProfile,
  getTimetable,
  getTimetableFresh,
  getCourses,
  getCoursesFresh,
  getAttendance,
  summarizeAttendance,
} from "@/lib/data";
import { autoAssignTimetable, type AutoAssignResult } from "@/lib/auto-assign";

export default async function DashboardHome() {
  const [profile, initialEntries, initialCourses, attendance] = await Promise.all([
    getProfile(),
    getTimetable(),
    getCourses(),
    getAttendance(),
  ]);

  let entries = initialEntries;
  let courses = initialCourses;
  let assignResult: AutoAssignResult | null = null;

  // Runs on every dashboard load, not just for brand-new accounts with no
  // classes yet. autoAssignTimetable() is idempotent — it returns
  // "unchanged" (a single cheap read, no writes) when the student's
  // auto-assigned rows already match the catalog — so this is safe to call
  // unconditionally. This is what lets a catalog correction (room/time/
  // teacher fix in data/timetable_data.json) or a section change reach a
  // student who already has a timetable, instead of only ever firing once
  // per account on their very first empty-timetable visit.
  if (profile?.section) {
    assignResult = await autoAssignTimetable();
    if (assignResult.status === "ok") {
      [entries, courses] = await Promise.all([getTimetableFresh(), getCoursesFresh()]);
    }
  }

  const summaries = summarizeAttendance(courses, attendance).filter((s) => s.total > 0);
  const lowAttendance = summaries.filter((s) => s.percentage < 75);

  return (
    <div className="flex flex-col gap-6">
      <NextClassCard entries={entries} name={profile?.name ?? "there"} />

      {lowAttendance.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              ⚠️ Attendance is low in {lowAttendance.length} course
              {lowAttendance.length > 1 ? "s" : ""}.{" "}
              <Link href="/dashboard/attendance" className="font-medium underline">
                Review attendance
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {entries.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            {!profile?.section ? (
              <p className="text-sm text-neutral-500">
                Please select your semester and section in{" "}
                <Link href="/dashboard/profile" className="font-medium text-neutral-900 underline dark:text-white">
                  your profile
                </Link>{" "}
                to load your timetable automatically.
              </p>
            ) : assignResult?.status === "not_found" ? (
              <p className="text-sm text-neutral-500">
                No timetable is currently available for section {assignResult.section}.{" "}
                <Link href="/dashboard/schedule" className="font-medium text-neutral-900 underline dark:text-white">
                  Add classes manually
                </Link>{" "}
                or contact your administrator.
              </p>
            ) : (
              <p className="text-sm text-neutral-500">
                You haven&apos;t added any classes yet.{" "}
                <Link href="/dashboard/schedule" className="font-medium text-neutral-900 underline dark:text-white">
                  Set up your timetable
                </Link>{" "}
                to get started.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <TodaySchedule entries={entries} />
        <TomorrowPreview entries={entries} />
      </div>
    </div>
  );
}
