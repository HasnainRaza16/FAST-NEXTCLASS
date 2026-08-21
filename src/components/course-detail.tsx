"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Course, TimetableEntry, NoteItem, AssignmentItem, AttendanceRecord } from "@/lib/types";
import { summarizeAttendance } from "@/lib/attendance";
import { minutesToLabel, timeToMinutes } from "@/lib/next-class-engine";

export function CourseDetail({
  course,
  initialEntries,
  initialAttendance,
  initialNotes,
  initialAssignments,
}: {
  course: Course;
  initialEntries: TimetableEntry[];
  initialAttendance: AttendanceRecord[];
  initialNotes: NoteItem[];
  initialAssignments: AssignmentItem[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [notes, setNotes] = useState(initialNotes);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [noteText, setNoteText] = useState("");
  const [assignmentText, setAssignmentText] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Resync local editable copies whenever the server component refetches
  // (after router.refresh() following an add/toggle), same pattern as
  // WeeklyTimetableEditor.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotes(initialNotes);
  }, [initialNotes]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAssignments(initialAssignments);
  }, [initialAssignments]);

  async function addNote() {
    if (!noteText.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notes")
      .insert({ user_id: user.id, course_id: course.id, title: noteText.slice(0, 60), body: noteText });
    setNoteText("");
    router.refresh();
  }

  async function addAssignment() {
    if (!assignmentText.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("assignments").insert({
      user_id: user.id,
      course_id: course.id,
      title: assignmentText,
      due_date: dueDate || null,
    });
    setAssignmentText("");
    setDueDate("");
    router.refresh();
  }

  async function toggleAssignment(a: AssignmentItem) {
    await supabase.from("assignments").update({ is_done: !a.is_done }).eq("id", a.id);
    router.refresh();
  }

  const summary = summarizeAttendance([course], initialAttendance)[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{course.course_name}</h1>
        <p className="text-sm text-neutral-500">
          {course.course_code ? `${course.course_code} · ` : ""}
          {course.teacher_name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {initialEntries.map((e) => (
            <div key={e.id} className="flex justify-between text-sm">
              <span>{e.day}</span>
              <span className="text-neutral-500">
                {minutesToLabel(timeToMinutes(e.start_time))}–{minutesToLabel(timeToMinutes(e.end_time))}
                {e.room_number ? ` · ${e.room_number}` : ""}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {summary.attended}/{summary.total} classes attended —{" "}
            <span className="font-semibold">{summary.percentage}%</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignments &amp; Exams</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input placeholder="Assignment or exam title" value={assignmentText} onChange={(e) => setAssignmentText(e.target.value)} />
            <Input type="date" className="w-40" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <Button onClick={addAssignment} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ul className="flex flex-col gap-2">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={a.is_done} onChange={() => toggleAssignment(a)} />
                  <span className={a.is_done ? "text-neutral-400 line-through" : ""}>{a.title}</span>
                </label>
                {a.due_date && <Badge variant="outline">{a.due_date}</Badge>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input placeholder="Add a note…" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <Button onClick={addNote} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ul className="flex flex-col gap-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                {n.body}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
