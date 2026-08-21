"use client";
import { useState } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TimetableEntry } from "@/lib/types";
import { minutesToLabel, timeToMinutes } from "@/lib/next-class-engine";
import { DOT_CLASS } from "@/lib/color-tags";
import { cn } from "@/lib/utils";

export function SearchPanel({ initialEntries }: { initialEntries: TimetableEntry[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const results = q
    ? initialEntries.filter(
        (e) =>
          e.course?.course_name.toLowerCase().includes(q) ||
          e.course?.teacher_name?.toLowerCase().includes(q) ||
          e.room_number?.toLowerCase().includes(q) ||
          e.day.toLowerCase().includes(q)
      )
    : [];

  return (
    <>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          className="pl-9"
          placeholder="Search course, teacher, room, or day…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {q && (
        <p className="text-sm text-neutral-500">
          {results.length} result{results.length !== 1 ? "s" : ""}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {results.map((e) => (
          <Link key={e.id} href={`/dashboard/courses/${e.course_id}`}>
            <Card className="hover:border-neutral-400 dark:hover:border-neutral-600">
              <CardContent className="flex items-center gap-3 p-4">
                <span className={cn("h-2.5 w-2.5 rounded-full", DOT_CLASS[e.course?.color_tag ?? "blue"])} />
                <div>
                  <p className="font-medium">{e.course?.course_name}</p>
                  <p className="text-sm text-neutral-500">
                    {e.day} · {minutesToLabel(timeToMinutes(e.start_time))}–{minutesToLabel(timeToMinutes(e.end_time))}
                    {e.room_number ? ` · ${e.room_number}` : ""}
                    {e.course?.teacher_name ? ` · ${e.course.teacher_name}` : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
