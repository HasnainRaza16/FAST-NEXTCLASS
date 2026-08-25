"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, AlertTriangle, Trophy, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Course, GradeEntry, LetterGrade } from "@/lib/types";
import {
  computeSemesterGpas,
  computeCgpa,
  Program,
  PROGRAM_LABELS,
  PROGRAM_WARNING_THRESHOLD,
  PROGRAM_GRADE_OPTIONS,
} from "@/lib/gpa";
import { cn } from "@/lib/utils";

const PROGRAM_KEY = "nextclass-gpa-program";

function getStoredProgram(): Program {
  if (typeof window === "undefined") return "BS";
  const raw = localStorage.getItem(PROGRAM_KEY);
  return raw === "BS" || raw === "MBA" || raw === "MS" || raw === "PhD" ? raw : "BS";
}

interface GpaCalculatorProps {
  initialGrades: GradeEntry[];
  /** The student's own courses (auto-filled from their section's timetable on signup/login), offered as quick-pick suggestions so they don't have to retype a course name that's already on their schedule. */
  courses: Course[];
  /** Profile's semester field, used to prefill the "Semester" input — still freely editable, since GPA entries can belong to a past semester too. */
  defaultSemesterLabel: string;
}

export function GpaCalculator({ initialGrades, courses, defaultSemesterLabel }: GpaCalculatorProps) {
  const router = useRouter();
  const supabase = createClient();
  const [grades, setGrades] = useState(initialGrades);
  const [saving, setSaving] = useState(false);
  const [program, setProgram] = useState<Program>("BS");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgram(getStoredProgram());
  }, []);

  function changeProgram(p: Program) {
    setProgram(p);
    localStorage.setItem(PROGRAM_KEY, p);
    // Reset to a grade valid for the new program if the current pick no
    // longer applies (e.g. switching BS -> PhD while "D" is selected).
    if (!PROGRAM_GRADE_OPTIONS[p].includes(letterGrade)) {
      setLetterGrade(PROGRAM_GRADE_OPTIONS[p][0]);
    }
  }

  const [courseName, setCourseName] = useState("");
  const [creditHours, setCreditHours] = useState("3");
  const [letterGrade, setLetterGrade] = useState<LetterGrade>("A");
  const [semesterLabel, setSemesterLabel] = useState(defaultSemesterLabel);

  // Quick-pick list of the student's own timetable courses — deduped by
  // name (a course can appear once per weekly class slot in `courses`,
  // e.g. a lecture + a lab section sharing the same course_name).
  const uniqueCourses = useMemo(() => {
    const seen = new Set<string>();
    const result: Course[] = [];
    for (const c of courses) {
      const key = c.course_name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(c);
    }
    return result.sort((a, b) => a.course_name.localeCompare(b.course_name));
  }, [courses]);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const courseFieldRef = useRef<HTMLDivElement>(null);

  const filteredCourses = useMemo(() => {
    const q = courseName.trim().toLowerCase();
    const pool = q ? uniqueCourses.filter((c) => c.course_name.toLowerCase().includes(q)) : uniqueCourses;
    return pool.slice(0, 8);
  }, [uniqueCourses, courseName]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (courseFieldRef.current && !courseFieldRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function pickCourse(course: Course) {
    setCourseName(course.course_name);
    setShowSuggestions(false);
  }

  const semesters = computeSemesterGpas(grades).sort((a, b) =>
    a.semester_label.localeCompare(b.semester_label)
  );
  const cgpa = computeCgpa(grades);
  const threshold = PROGRAM_WARNING_THRESHOLD[program];
  const onWarning = cgpa !== null && cgpa < threshold;

  async function addGrade() {
    const credits = parseFloat(creditHours);
    if (!courseName.trim() || !semesterLabel.trim() || !credits || credits <= 0) return;

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("grades")
      .insert({
        user_id: user.id,
        course_name: courseName.trim(),
        credit_hours: credits,
        letter_grade: letterGrade,
        semester_label: semesterLabel.trim(),
      })
      .select()
      .single();

    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    setGrades((prev) => [...prev, data as GradeEntry]);
    setCourseName("");
    setCreditHours("3");
    setLetterGrade("A");
    router.refresh();
  }

  async function removeGrade(id: string) {
    setGrades((prev) => prev.filter((g) => g.id !== id));
    const { error } = await supabase.from("grades").delete().eq("id", id);
    if (error) {
      alert(error.message);
      router.refresh(); // resync — the optimistic removal above may be wrong
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card
        className={cn(
          "border-2",
          cgpa === null
            ? "border-neutral-200 dark:border-neutral-800"
            : onWarning
              ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
              : "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/40"
        )}
      >
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Cumulative GPA
            </p>
            <p className="mt-1 text-4xl font-bold">{cgpa !== null ? cgpa.toFixed(2) : "—"}</p>
            {cgpa !== null && (
              <p
                className={cn(
                  "mt-1 flex items-center gap-1.5 text-sm font-medium",
                  onWarning ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                )}
              >
                {onWarning ? (
                  <>
                    <AlertTriangle className="h-4 w-4" /> Below {threshold.toFixed(2)} — this is Warning
                    territory for {PROGRAM_LABELS[program]}.
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4" /> Above the {threshold.toFixed(2)} Warning threshold for{" "}
                    {PROGRAM_LABELS[program]}.
                  </>
                )}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <label className="text-xs font-medium text-neutral-500">Program</label>
            <select
              value={program}
              onChange={(e) => changeProgram(e.target.value as Program)}
              className="h-9 rounded-lg border border-neutral-200 bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-800"
            >
              {(Object.keys(PROGRAM_LABELS) as Program[]).map((p) => (
                <option key={p} value={p}>
                  {PROGRAM_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a course</CardTitle>
          {uniqueCourses.length > 0 && (
            <CardDescription>
              Tap the course field to pick from your {uniqueCourses.length} timetable courses — no retyping.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div ref={courseFieldRef} className="relative">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  className="pl-9"
                  placeholder={
                    uniqueCourses.length > 0 ? "Search your courses or type a name" : "Course name (e.g. Data Structures)"
                  }
                  value={courseName}
                  onChange={(e) => {
                    setCourseName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
              </div>
              {showSuggestions && filteredCourses.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                  {filteredCourses.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={(e) => {
                        // onMouseDown (not onClick) fires before the input's
                        // onBlur/click-outside handler, so the pick registers
                        // instead of the dropdown closing first.
                        e.preventDefault();
                        pickCourse(c);
                      }}
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <span className="font-medium">{c.course_name}</span>
                      {(c.course_code || c.teacher_name) && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {[c.course_code, c.teacher_name].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Input
              placeholder="Semester (e.g. Fall 2026)"
              value={semesterLabel}
              onChange={(e) => setSemesterLabel(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="number"
              step="0.5"
              min="0.5"
              max="6"
              placeholder="Credit hours"
              value={creditHours}
              onChange={(e) => setCreditHours(e.target.value)}
            />
            <select
              value={letterGrade}
              onChange={(e) => setLetterGrade(e.target.value as LetterGrade)}
              className="flex h-10 w-full rounded-xl border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-800"
            >
              {PROGRAM_GRADE_OPTIONS[program].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={addGrade} disabled={saving} className="self-start">
            <Plus className="h-4 w-4" /> Add course
          </Button>
        </CardContent>
      </Card>

      {semesters.length === 0 ? (
        <p className="text-sm text-neutral-500">Add your first course above to see your GPA.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {semesters.map((sem) => (
            <Card key={sem.semester_label}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{sem.semester_label}</CardTitle>
                  <span className="text-sm font-semibold">
                    SGPA: {sem.sgpa !== null ? sem.sgpa.toFixed(2) : "—"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {sem.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
                    >
                      <div>
                        <p className="font-medium">{entry.course_name}</p>
                        <p className="text-xs text-neutral-500">{entry.credit_hours} credit hours</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{entry.letter_grade}</span>
                        <button
                          onClick={() => removeGrade(entry.id)}
                          className="text-neutral-400 hover:text-red-600"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
