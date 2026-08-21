"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Course, AttendanceRecord, ColorTag } from "@/lib/types";
import { summarizeAttendance } from "@/lib/attendance";
import { DOT_CLASS } from "@/lib/color-tags";
import { cn } from "@/lib/utils";

export function AttendanceTracker({
  courses,
  records,
}: {
  courses: Course[];
  records: AttendanceRecord[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState<string | null>(null);
  const summaries = summarizeAttendance(courses, records);

  async function mark(courseId: string, status: "present" | "absent") {
    setSaving(courseId);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(null);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from("attendance")
      .upsert(
        { user_id: user.id, course_id: courseId, date: today, status },
        { onConflict: "user_id,course_id,date" }
      );
    setSaving(null);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  }

  if (courses.length === 0) {
    return <p className="text-sm text-neutral-500">Add classes in your schedule first to track attendance.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {courses.map((course) => {
        const summary = summaries.find((s) => s.course_id === course.id)!;
        const low = summary.total > 0 && summary.percentage < 75;
        return (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", DOT_CLASS[course.color_tag as ColorTag])} />
                <CardTitle>{course.course_name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-lg font-semibold">{summary.total}</p>
                  <p className="text-neutral-500">Total</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{summary.attended}</p>
                  <p className="text-neutral-500">Attended</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{summary.missed}</p>
                  <p className="text-neutral-500">Missed</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Attendance</span>
                  <span className={cn("font-semibold", low ? "text-red-600" : "text-green-600")}>
                    {summary.percentage}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className={cn("h-full rounded-full", low ? "bg-red-500" : "bg-green-500")}
                    style={{ width: `${Math.min(100, summary.percentage)}%` }}
                  />
                </div>
                {low && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5" /> Attendance is low.
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saving === course.id}
                  onClick={() => mark(course.id, "present")}
                  className="flex-1"
                >
                  <Check className="h-4 w-4" /> Present today
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saving === course.id}
                  onClick={() => mark(course.id, "absent")}
                  className="flex-1"
                >
                  <X className="h-4 w-4" /> Absent today
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
