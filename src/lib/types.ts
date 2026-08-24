export type Day =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export const DAYS: Day[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export const COLOR_TAGS = [
  "blue",
  "green",
  "purple",
  "orange",
  "pink",
  "teal",
  "red",
  "yellow",
] as const;
export type ColorTag = (typeof COLOR_TAGS)[number];

export interface Profile {
  id: string;
  name: string;
  email: string;
  university: string | null;
  department: string | null;
  semester: string | null;
  section: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  course_name: string;
  course_code: string | null;
  teacher_name: string | null;
  color_tag: ColorTag;
  created_at: string;
}

export interface TimetableEntry {
  id: string;
  user_id: string;
  course_id: string;
  room_number: string | null;
  building: string | null;
  day: Day;
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  semester: string | null;
  section: string | null;
  created_at: string;
  // joined
  course?: Course;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  course_id: string;
  date: string; // ISO date
  status: "present" | "absent";
  created_at: string;
}

export interface CourseAttendanceSummary {
  course_id: string;
  total: number;
  attended: number;
  missed: number;
  percentage: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  kind: "reminder" | "assignment" | "attendance" | "general";
  is_read: boolean;
  created_at: string;
}

export interface NoteItem {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  body: string | null;
  created_at: string;
}

export interface AssignmentItem {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  due_date: string | null;
  is_done: boolean;
  created_at: string;
}

export interface ReminderPrefs {
  minutes_before: number[]; // e.g. [5, 15]
  enabled: boolean;
}

export interface FeedbackItem {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
}

// FAST-NUCES official BS/BBA letter grades (nu.edu.pk/Student/Grading).
// CR, I, and W are excluded — they don't carry grade points and aren't
// used in SGPA/CGPA at FAST.
export const LETTER_GRADES = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "F",
  "FA",
] as const;
export type LetterGrade = (typeof LETTER_GRADES)[number];

export interface GradeEntry {
  id: string;
  user_id: string;
  course_name: string;
  credit_hours: number;
  letter_grade: LetterGrade;
  semester_label: string;
  created_at: string;
}
