export type MaterialCategory =
  | "Slides"
  | "Midterm Papers"
  | "Final Papers"
  | "Past Papers"
  | "Quizzes"
  | "Assignments"
  | "Notes"
  | "Practice Questions"
  | "Projects"
  | "Books"
  | "Lab Resources"
  | "Course Outline"
  | "Formulas"
  | "Recordings"
  | "Resources"
  | "Other";

export type MaterialFileType =
  | "pdf"
  | "doc"
  | "slides"
  | "sheet"
  | "archive"
  | "image"
  | "code"
  | "video"
  | "text"
  | "other";

export interface MaterialEntry {
  semester: number;
  subject: string;
  category: MaterialCategory;
  filename: string;
  ext: string;
  type: MaterialFileType;
  path: string;
  githubUrl: string;
  rawUrl: string;
}

export interface SubjectSummary {
  name: string;
  fileCount: number;
  categories: { name: MaterialCategory; count: number }[];
}

export interface SemesterSummary {
  number: number;
  fileCount: number;
  subjectCount: number;
  subjects: SubjectSummary[];
}

export interface MaterialsSummary {
  semesters: SemesterSummary[];
}

// Display order for category chips — most exam-relevant first.
export const CATEGORY_ORDER: MaterialCategory[] = [
  "Slides",
  "Midterm Papers",
  "Final Papers",
  "Past Papers",
  "Quizzes",
  "Assignments",
  "Notes",
  "Practice Questions",
  "Projects",
  "Books",
  "Lab Resources",
  "Course Outline",
  "Formulas",
  "Recordings",
  "Resources",
  "Other",
];

export function sortByCategoryOrder<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.name as MaterialCategory);
    const bi = CATEGORY_ORDER.indexOf(b.name as MaterialCategory);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}
