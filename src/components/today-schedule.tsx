"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimetableEntry } from "@/lib/types";
import { computeScheduleStatus, minutesToLabel, timeToMinutes } from "@/lib/next-class-engine";
import { cn } from "@/lib/utils";
import { DOT_CLASS } from "@/lib/color-tags";

export function TodaySchedule({ entries }: { entries: TimetableEntry[] }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // Deliberately null on server render to avoid a hydration mismatch on
    // wall-clock time; real Date is set once mounted on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <Card className="h-40 animate-pulse" />;

  const { todaysClasses } = computeScheduleStatus(entries, now);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        {todaysClasses.length === 0 ? (
          <p className="text-sm text-neutral-500">No classes today.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {todaysClasses.map((c) => (
              <li
                key={c.id}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 text-sm",
                  c.state === "current" && "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900",
                  c.state === "done" && "opacity-50",
                  c.state === "upcoming" && "border-neutral-200 dark:border-neutral-800"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("h-2 w-2 rounded-full", DOT_CLASS[c.course?.color_tag ?? "blue"])} />
                  <div>
                    <p className="font-medium">{c.course?.course_name}</p>
                    <p className="text-xs text-neutral-500">
                      {minutesToLabel(timeToMinutes(c.start_time))} – {minutesToLabel(timeToMinutes(c.end_time))}
                      {c.room_number ? ` · ${c.room_number}` : ""}
                    </p>
                  </div>
                </div>
                {c.state === "current" && <Badge variant="success">Now</Badge>}
                {c.state === "done" && <Badge variant="outline">Done</Badge>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
