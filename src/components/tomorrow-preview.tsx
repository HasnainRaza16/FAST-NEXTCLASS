import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimetableEntry } from "@/lib/types";
import { entriesForDay, minutesToLabel, timeToMinutes, tomorrowDay } from "@/lib/next-class-engine";

export function TomorrowPreview({ entries }: { entries: TimetableEntry[] }) {
  const day = tomorrowDay();
  const classes = day ? entriesForDay(entries, day) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tomorrow{day ? ` · ${day}` : ""}</CardTitle>
      </CardHeader>
      <CardContent>
        {classes.length === 0 ? (
          <p className="text-sm text-neutral-500">No classes scheduled.</p>
        ) : (
          <>
            <p className="text-sm text-neutral-500">
              You have <span className="font-medium text-neutral-900 dark:text-white">{classes.length} classes</span>
              , first at {minutesToLabel(timeToMinutes(classes[0].start_time))}, last ends at{" "}
              {minutesToLabel(timeToMinutes(classes[classes.length - 1].end_time))}.
            </p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {classes.map((c) => (
                <li key={c.id} className="flex justify-between text-neutral-600 dark:text-neutral-300">
                  <span>{c.course?.course_name}</span>
                  <span className="text-neutral-400">{minutesToLabel(timeToMinutes(c.start_time))}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
