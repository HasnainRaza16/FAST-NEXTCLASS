"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Course, TimetableEntry, Day, DAYS, COLOR_TAGS, ColorTag } from "@/lib/types";
import { DOT_CLASS, TAG_CLASS } from "@/lib/color-tags";
import { cn } from "@/lib/utils";

interface FormState {
  id?: string;
  course_name: string;
  course_code: string;
  teacher_name: string;
  color_tag: ColorTag;
  room_number: string;
  building: string;
  day: Day;
  start_time: string;
  end_time: string;
  semester: string;
  section: string;
}

const EMPTY_FORM: FormState = {
  course_name: "",
  course_code: "",
  teacher_name: "",
  color_tag: "blue",
  room_number: "",
  building: "",
  day: "Monday",
  start_time: "09:00",
  end_time: "10:00",
  semester: "",
  section: "",
};

export function WeeklyTimetableEditor({
  initialEntries,
  initialCourses,
}: {
  initialEntries: TimetableEntry[];
  initialCourses: Course[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [entries, setEntries] = useState(initialEntries);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Resync local editable copy whenever the server component refetches
    // (after router.refresh() following an add/edit/delete).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(initialEntries);
  }, [initialEntries]);

  const byDay = useMemo(() => {
    const map: Record<Day, TimetableEntry[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };
    for (const e of entries) map[e.day]?.push(e);
    for (const d of Object.keys(map) as Day[]) {
      map[d].sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return map;
  }, [entries]);

  function openNew() {
    setForm(EMPTY_FORM);
    setError(null);
    setOpen(true);
  }

  function openEdit(entry: TimetableEntry) {
    setForm({
      id: entry.id,
      course_name: entry.course?.course_name ?? "",
      course_code: entry.course?.course_code ?? "",
      teacher_name: entry.course?.teacher_name ?? "",
      color_tag: (entry.course?.color_tag as ColorTag) ?? "blue",
      room_number: entry.room_number ?? "",
      building: entry.building ?? "",
      day: entry.day,
      start_time: entry.start_time.slice(0, 5),
      end_time: entry.end_time.slice(0, 5),
      semester: entry.semester ?? "",
      section: entry.section ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function handleDelete(entry: TimetableEntry) {
    if (!confirm(`Delete ${entry.course?.course_name}?`)) return;
    const { error } = await supabase.from("timetable").delete().eq("id", entry.id);
    if (error) {
      alert(error.message);
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in.");
      setSaving(false);
      return;
    }

    let courseId: string;
    if (form.id) {
      const existing = entries.find((e) => e.id === form.id);
      courseId = existing!.course_id;
      const { error: courseErr } = await supabase
        .from("courses")
        .update({
          course_name: form.course_name,
          course_code: form.course_code || null,
          teacher_name: form.teacher_name || null,
          color_tag: form.color_tag,
        })
        .eq("id", courseId);
      if (courseErr) {
        setError(courseErr.message);
        setSaving(false);
        return;
      }
    } else {
      const { data: newCourse, error: courseErr } = await supabase
        .from("courses")
        .insert({
          user_id: user.id,
          course_name: form.course_name,
          course_code: form.course_code || null,
          teacher_name: form.teacher_name || null,
          color_tag: form.color_tag,
        })
        .select()
        .single();
      if (courseErr || !newCourse) {
        setError(courseErr?.message ?? "Failed to create course");
        setSaving(false);
        return;
      }
      courseId = newCourse.id;
    }

    const payload = {
      user_id: user.id,
      course_id: courseId,
      room_number: form.room_number || null,
      building: form.building || null,
      day: form.day,
      start_time: form.start_time,
      end_time: form.end_time,
      semester: form.semester || null,
      section: form.section || null,
    };

    if (form.id) {
      const { error: ttErr } = await supabase.from("timetable").update(payload).eq("id", form.id);
      if (ttErr) {
        setError(ttErr.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: ttErr } = await supabase.from("timetable").insert(payload);
      if (ttErr) {
        setError(ttErr.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Weekly Timetable</h1>
          <p className="text-xs text-neutral-500">
            Loaded automatically from your section — add anything extra manually below.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> Add Class Manually
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit Class" : "Add Class"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
              <div className="flex flex-col gap-1.5">
                <Label>Course Name</Label>
                <Input required value={form.course_name} onChange={(e) => setForm({ ...form, course_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Course Code</Label>
                  <Input value={form.course_code} onChange={(e) => setForm({ ...form, course_code: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Teacher</Label>
                  <Input value={form.teacher_name} onChange={(e) => setForm({ ...form, teacher_name: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Room</Label>
                  <Input value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Building</Label>
                  <Input value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Day</Label>
                <select
                  className="h-10 rounded-xl border border-neutral-200 bg-transparent px-3 text-sm dark:border-neutral-800"
                  value={form.day}
                  onChange={(e) => setForm({ ...form, day: e.target.value as Day })}
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Start Time</Label>
                  <Input type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>End Time</Label>
                  <Input type="time" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Semester</Label>
                  <Input value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Section</Label>
                  <Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Color Tag</Label>
                <div className="flex gap-2">
                  {COLOR_TAGS.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setForm({ ...form, color_tag: tag })}
                      className={cn(
                        "h-7 w-7 rounded-full ring-offset-2",
                        DOT_CLASS[tag],
                        form.color_tag === tag && "ring-2 ring-neutral-900 dark:ring-white"
                      )}
                      aria-label={tag}
                    />
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="mt-2 flex justify-end gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {DAYS.map((day) => (
          <div key={day} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-neutral-500">{day}</h2>
            {byDay[day].length === 0 ? (
              <p className="text-xs text-neutral-400">No classes</p>
            ) : (
              byDay[day].map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "group flex flex-col gap-1 rounded-xl border p-3 text-sm",
                    TAG_CLASS[(entry.course?.color_tag as ColorTag) ?? "blue"]
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{entry.course?.course_name}</p>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => openEdit(entry)} aria-label="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(entry)} aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs opacity-80">
                    {entry.start_time.slice(0, 5)}–{entry.end_time.slice(0, 5)}
                  </p>
                  {entry.course?.teacher_name && <p className="text-xs opacity-80">{entry.course.teacher_name}</p>}
                  {entry.room_number && (
                    <p className="text-xs opacity-80">
                      {entry.room_number}
                      {entry.building ? `, ${entry.building}` : ""}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
