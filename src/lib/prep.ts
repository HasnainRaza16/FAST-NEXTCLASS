import type { PrepType } from "@/lib/types";
import type { MaterialCategory, MaterialEntry } from "@/lib/materials-types";

export interface PrepModeConfig {
  type: PrepType;
  label: string;
  shortLabel: string;
  durationSeconds: number;
  durationLabel: string;
  /** The category this mode is really about — shown first, and what "has materials for this subject" is judged on. */
  primaryCategory: MaterialCategory;
  /** Extra categories worth reviewing alongside the primary one, shown in a collapsible "Also review" section. */
  supportingCategories: MaterialCategory[];
  description: string;
  sessionCopy: string;
}

export const PREP_CONFIG: Record<PrepType, PrepModeConfig> = {
  quiz: {
    type: "quiz",
    label: "Quiz Prep",
    shortLabel: "Quiz",
    durationSeconds: 60 * 60,
    durationLabel: "1 hour",
    primaryCategory: "Quizzes",
    supportingCategories: ["Notes", "Practice Questions", "Slides"],
    description: "Real past quizzes for every subject — work through them under a timed, focused session.",
    sessionCopy: "Treat this like a real quiz. Work through the papers below until the timer runs out.",
  },
  mid: {
    type: "mid",
    label: "Midterm Prep",
    shortLabel: "Midterm",
    durationSeconds: 60 * 60,
    durationLabel: "1 hour",
    primaryCategory: "Midterm Papers",
    supportingCategories: ["Notes", "Practice Questions", "Slides"],
    description: "Real past midterm papers — sit them under exam-length time pressure, no shortcuts.",
    sessionCopy: "Treat this like a real midterm. Work through the papers below until the timer runs out.",
  },
  final: {
    type: "final",
    label: "Final Prep",
    shortLabel: "Final",
    durationSeconds: 3 * 60 * 60,
    durationLabel: "3 hours",
    primaryCategory: "Final Papers",
    supportingCategories: ["Notes", "Books", "Slides"],
    description: "Real past final papers — the full 3-hour exam experience, subject by subject.",
    sessionCopy: "Treat this like a real final. Work through the papers below until the timer runs out.",
  },
};

export function isPrepType(value: string): value is PrepType {
  return value === "quiz" || value === "mid" || value === "final";
}

/** Splits a subject's materials into what this prep mode is really about vs. what's worth reviewing alongside it. Pure function — safe to import from both server and client code. */
export function filterMaterialsForPrep(entries: MaterialEntry[], type: PrepType, subject: string) {
  const config = PREP_CONFIG[type];
  const subjectEntries = entries.filter((e) => e.subject === subject);
  return {
    primary: subjectEntries.filter((e) => e.category === config.primaryCategory),
    supporting: subjectEntries.filter((e) => config.supportingCategories.includes(e.category)),
  };
}

export function formatCountdown(secondsRemaining: number): string {
  const clamped = Math.max(0, Math.floor(secondsRemaining));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
