import { readFileSync } from "fs";
import path from "path";
import { Day } from "./types";

/**
 * Reads the existing `data/timetable_data.json` (the 104 sections already
 * parsed from the FALL 2026 timetable PDF — see scripts/seed.mjs and
 * README.md). This is the single source of truth for section timetables;
 * nothing here duplicates that data into a new table or file.
 */

interface RawClass {
  day: string;
  start: string;
  end: string;
  course: string | null;
  teacher: string | null;
  room: string | null;
}

interface RawSection {
  section: string;
  classes: RawClass[];
}

let cache: RawSection[] | null = null;

function loadCatalog(): RawSection[] {
  if (cache) return cache;
  const filePath = path.join(process.cwd(), "data", "timetable_data.json");
  cache = JSON.parse(readFileSync(filePath, "utf-8")) as RawSection[];
  return cache;
}

export function listCatalogSections(): string[] {
  return loadCatalog().map((s) => s.section);
}

export function findCatalogSection(section: string): RawSection | null {
  const target = section.trim().toLowerCase();
  if (!target) return null;
  return loadCatalog().find((s) => s.section.trim().toLowerCase() === target) ?? null;
}

const VALID_DAYS: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * Same heuristic used by scripts/seed.mjs: the PDF's text layer renders
 * afternoon times as "1:30", "2:25", etc. without an AM/PM marker, so hours
 * below 8 are treated as PM (13:xx-15:xx).
 */
export function normalizeTime(t: string | null | undefined): string | null {
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length < 2) return null;
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  if (h < 8) h += 12;
  if (h > 23) return null;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
}

export interface CatalogClass {
  day: Day;
  start_time: string;
  end_time: string;
  course_name: string;
  teacher_name: string | null;
  room_number: string | null;
}

/**
 * Returns only the classes for a section that have enough data to safely
 * insert as a timetable row (valid day + parsable start/end time + a course
 * name). The source PDF has known rendering artifacts on ~3-5% of entries
 * (see README.md) — those rows are skipped here rather than inserted with
 * garbage day/time values.
 */
export function getUsableClassesForSection(section: string): CatalogClass[] {
  const found = findCatalogSection(section);
  if (!found) return [];

  const out: CatalogClass[] = [];
  for (const c of found.classes) {
    if (!c.course || !c.day || !c.start || !c.end) continue;
    if (!VALID_DAYS.includes(c.day as Day)) continue;
    const start_time = normalizeTime(c.start);
    const end_time = normalizeTime(c.end);
    if (!start_time || !end_time) continue;

    out.push({
      day: c.day as Day,
      start_time,
      end_time,
      course_name: c.course.trim(),
      teacher_name: c.teacher?.trim() || null,
      room_number: c.room?.trim() || null,
    });
  }
  return out;
}
