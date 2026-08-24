import { GradeEntry, LetterGrade } from "./types";

// Official FAST-NUCES BS/BBA grade points — nu.edu.pk/Student/Grading.
// (MBA/MS and PhD use a different, shorter scale; this app targets
// undergraduate BS students.)
export const GRADE_POINTS: Record<LetterGrade, number> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.67,
  "B+": 3.33,
  B: 3.0,
  "B-": 2.67,
  "C+": 2.33,
  C: 2.0,
  "C-": 1.67,
  "D+": 1.33,
  D: 1.0,
  F: 0.0,
  FA: 0.0,
};

// BS programs go on Warning if CGPA falls below this (nu.edu.pk/Student/Grading).
export const WARNING_CGPA_THRESHOLD = 2.0;

// Minimum CGPA required to avoid Warning, per program — nu.edu.pk/Student/Grading.
// Grade POINT values are identical across programs (A+ = 4.00 everywhere, etc.);
// what differs is which grades count as "passing" and the warning threshold.
export type Program = "BS" | "MBA" | "MS" | "PhD";

export const PROGRAM_LABELS: Record<Program, string> = {
  BS: "BS / BBA",
  MBA: "MBA",
  MS: "MS",
  PhD: "PhD",
};

export const PROGRAM_WARNING_THRESHOLD: Record<Program, number> = {
  BS: 2.0,
  MBA: 2.5,
  MS: 2.5,
  PhD: 3.0,
};

// The lowest grade actually offered as "passing" per program — grades below
// this still show up if entered (e.g. a repeated course) but the university
// requires a repeat. BS/BBA go all the way to D; MBA/MS bottom out at C;
// PhD coursework bottoms out at B-.
export const PROGRAM_GRADE_OPTIONS: Record<Program, LetterGrade[]> = {
  BS: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F", "FA"],
  MBA: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "F", "FA"],
  MS: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "F", "FA"],
  PhD: ["A+", "A", "A-", "B+", "B", "B-", "F", "FA"],
};

export interface SemesterGpa {
  semester_label: string;
  entries: GradeEntry[];
  totalCredits: number;
  qualityPoints: number;
  sgpa: number | null; // null when the semester has no credit-bearing entries yet
}

function qualityPoints(entry: GradeEntry): number {
  return GRADE_POINTS[entry.letter_grade] * entry.credit_hours;
}

/** Groups grade entries by semester and computes each semester's SGPA. */
export function computeSemesterGpas(entries: GradeEntry[]): SemesterGpa[] {
  const bySemester = new Map<string, GradeEntry[]>();
  for (const e of entries) {
    const list = bySemester.get(e.semester_label) ?? [];
    list.push(e);
    bySemester.set(e.semester_label, list);
  }

  return Array.from(bySemester.entries()).map(([semester_label, semEntries]) => {
    const totalCredits = semEntries.reduce((sum, e) => sum + e.credit_hours, 0);
    const points = semEntries.reduce((sum, e) => sum + qualityPoints(e), 0);
    return {
      semester_label,
      entries: semEntries,
      totalCredits,
      qualityPoints: points,
      sgpa: totalCredits > 0 ? Math.round((points / totalCredits) * 100) / 100 : null,
    };
  });
}

/** Cumulative GPA across every entry, weighted by credit hours (FAST's CGPA formula). */
export function computeCgpa(entries: GradeEntry[]): number | null {
  const totalCredits = entries.reduce((sum, e) => sum + e.credit_hours, 0);
  if (totalCredits === 0) return null;
  const points = entries.reduce((sum, e) => sum + qualityPoints(e), 0);
  return Math.round((points / totalCredits) * 100) / 100;
}
