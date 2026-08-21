import { Day, DAYS, TimetableEntry } from "./types";

/** Parse "HH:MM:SS" or "HH:MM" into minutes since midnight. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map((n) => parseInt(n, 10));
  return h * 60 + (m || 0);
}

export function minutesToLabel(mins: number): string {
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const ampm = h24 < 12 ? "AM" : "PM";
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function dayName(date: Date): Day | null {
  const idx = date.getDay(); // 0 = Sunday
  const map: Record<number, Day> = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };
  return map[idx] ?? null;
}

export function entriesForDay(entries: TimetableEntry[], day: Day) {
  return entries
    .filter((e) => e.day === day)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
}

export interface ScheduleStatus {
  current: TimetableEntry | null;
  next: TimetableEntry | null;
  minutesUntilNext: number | null;
  todaysClasses: (TimetableEntry & { state: "done" | "current" | "upcoming" })[];
}

/** Compute current/next class and today's schedule with per-class state. */
export function computeScheduleStatus(
  entries: TimetableEntry[],
  now: Date = new Date()
): ScheduleStatus {
  const today = dayName(now);
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const todays = today ? entriesForDay(entries, today) : [];

  let current: TimetableEntry | null = null;
  let next: TimetableEntry | null = null;

  const withState = todays.map((e) => {
    const start = timeToMinutes(e.start_time);
    const end = timeToMinutes(e.end_time);
    let state: "done" | "current" | "upcoming";
    if (nowMins >= end) state = "done";
    else if (nowMins >= start && nowMins < end) {
      state = "current";
      current = e;
    } else state = "upcoming";
    return { ...e, state };
  });

  const upcoming = withState.filter((e) => e.state === "upcoming");
  if (upcoming.length > 0) {
    next = upcoming[0];
  } else if (!current) {
    // look ahead to the next day(s) with classes
    for (let i = 1; i <= 7; i++) {
      const idx = (DAYS.indexOf(today as Day) + i) % 7;
      const candidateDay = orderedDayFromIndex(today, i);
      if (!candidateDay) continue;
      const dayEntries = entriesForDay(entries, candidateDay);
      if (dayEntries.length > 0) {
        next = dayEntries[0];
        break;
      }
    }
  }

  let minutesUntilNext: number | null = null;
  if (next) {
    const isToday = todays.some((e) => e.id === next!.id);
    if (isToday) {
      minutesUntilNext = timeToMinutes(next.start_time) - nowMins;
    } else {
      minutesUntilNext = null; // different day — show date instead of countdown
    }
  }

  return { current, next, minutesUntilNext, todaysClasses: withState };
}

const FULL_WEEK: Day[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function orderedDayFromIndex(today: Day | null, offset: number): Day | null {
  if (!today) return null;
  const idx = FULL_WEEK.indexOf(today);
  return FULL_WEEK[(idx + offset) % 7];
}

export function tomorrowDay(now: Date = new Date()): Day | null {
  const today = dayName(now);
  return orderedDayFromIndex(today, 1);
}

export function formatCountdown(minutes: number): string {
  if (minutes < 0) return "00:00:00";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
}
