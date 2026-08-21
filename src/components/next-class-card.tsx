"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, MapPin, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimetableEntry } from "@/lib/types";
import { computeScheduleStatus, minutesToLabel, timeToMinutes } from "@/lib/next-class-engine";

function Countdown({ minutesUntil }: { minutesUntil: number }) {
  const [seconds, setSeconds] = useState(() => Math.max(0, minutesUntil * 60 - new Date().getSeconds()));

  useEffect(() => {
    // Resync the countdown whenever the parent recomputes minutesUntil
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeconds(Math.max(0, minutesUntil * 60));
    const id = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [minutesUntil]);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <span className="font-mono text-3xl font-semibold tabular-nums">
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

export function NextClassCard({ entries, name }: { entries: TimetableEntry[]; name: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Deliberately null on server render to avoid a hydration mismatch on
    // wall-clock time; real Date is set once mounted on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const hour = now ? now.getHours() : 9;
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  if (!now) {
    return <Card className="h-48 animate-pulse" />;
  }

  const { current, next, minutesUntilNext, todaysClasses } = computeScheduleStatus(entries, now);
  const activeCard = current ?? next;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-700 text-white dark:from-neutral-100 dark:to-neutral-300 dark:text-neutral-900">
      <CardContent className="p-6">
        <p className="text-sm opacity-80">
          {greeting}, {name.split(" ")[0]} 👋
        </p>

        {!activeCard ? (
          <div className="mt-4">
            <p className="text-lg font-semibold">No more classes today 🎉</p>
            <p className="mt-1 text-sm opacity-80">Enjoy the rest of your day.</p>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">
              {current ? "Current Class" : "Your Next Class"}
            </p>
            <div className="mt-2 flex items-start gap-2">
              <BookOpen className="mt-0.5 h-5 w-5 shrink-0" />
              <h2 className="text-2xl font-bold">{activeCard.course?.course_name}</h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm opacity-90">
              {activeCard.course?.teacher_name && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> {activeCard.course.teacher_name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {minutesToLabel(timeToMinutes(activeCard.start_time))} –{" "}
                {minutesToLabel(timeToMinutes(activeCard.end_time))}
              </span>
              {activeCard.room_number && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {activeCard.room_number}
                  {activeCard.building ? `, ${activeCard.building}` : ""}
                </span>
              )}
            </div>

            {!current && minutesUntilNext !== null && (
              <div className="mt-5">
                <p className="text-xs opacity-70">Starts in</p>
                <Countdown minutesUntil={minutesUntilNext} />
              </div>
            )}
            {current && (
              <p className="mt-5 text-sm font-medium opacity-90">
                Ends at {minutesToLabel(timeToMinutes(current.end_time))}
              </p>
            )}
          </div>
        )}

        <Button
          asChild
          variant="outline"
          className="mt-6 border-white/30 bg-white/10 text-white hover:bg-white/20 dark:border-neutral-900/20 dark:bg-neutral-900/10 dark:text-neutral-900 dark:hover:bg-neutral-900/20"
        >
          <Link href="/dashboard/schedule">View Schedule</Link>
        </Button>

        {todaysClasses.length > 0 && (
          <p className="mt-4 text-xs opacity-70">
            {todaysClasses.filter((c) => c.state === "upcoming").length} classes left today
          </p>
        )}
      </CardContent>
    </Card>
  );
}
