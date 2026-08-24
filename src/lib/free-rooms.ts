import { Day, DAYS } from "./types";
import { normalizeTime } from "./timetable-catalog";
import rawCatalog from "../../data/timetable_data.json";

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

const catalog = rawCatalog as RawSection[];

export interface Period {
  /** "HH:MM:SS" 24-hour, for sorting/matching. */
  start_time: string;
  end_time: string;
  /** e.g. "8:00 AM – 8:50 AM", for display. */
  label: string;
}

export interface RoomBooking {
  room: string;
  section: string;
  course: string;
  teacher: string | null;
}

export interface PeriodAvailability {
  period: Period;
  freeRooms: string[];
  freeLabs: string[];
  occupied: RoomBooking[];
}

function to12Hour(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

/** Every room mentioned anywhere in the catalog, sorted. Computed once per server process. */
let roomsCache: { all: string[]; labs: Set<string>; regular: Set<string> } | null = null;
function getAllRoomsInternal() {
  if (roomsCache) return roomsCache;
  const labs = new Set<string>();
  const regular = new Set<string>();
  for (const s of catalog) {
    for (const c of s.classes) {
      if (!c.room) continue;
      const room = c.room.trim();
      if (!room) continue;
      if (room.toLowerCase().includes("lab")) labs.add(room);
      else regular.add(room);
    }
  }
  roomsCache = {
    all: [...labs, ...regular].sort(),
    labs,
    regular,
  };
  return roomsCache;
}

export function getAllRooms(): string[] {
  return getAllRoomsInternal().all;
}

/** The fixed set of class periods used across the whole timetable, in order. */
let periodsCache: Period[] | null = null;
export function getPeriodGrid(): Period[] {
  if (periodsCache) return periodsCache;
  const seen = new Map<string, Period>();
  for (const s of catalog) {
    for (const c of s.classes) {
      const start = normalizeTime(c.start);
      const end = normalizeTime(c.end);
      if (!start || !end) continue;
      const key = `${start}-${end}`;
      if (!seen.has(key)) {
        seen.set(key, {
          start_time: start,
          end_time: end,
          label: `${to12Hour(start)} – ${to12Hour(end)}`,
        });
      }
    }
  }
  periodsCache = [...seen.values()].sort((a, b) => a.start_time.localeCompare(b.start_time));
  return periodsCache;
}

/** Which days actually have classes in the catalog (skips e.g. weekends with no data). */
export function getActiveDays(): Day[] {
  const found = new Set<string>();
  for (const s of catalog) {
    for (const c of s.classes) {
      if (c.day) found.add(c.day);
    }
  }
  return DAYS.filter((d) => found.has(d));
}

/**
 * For a given day, returns every period with the list of rooms/labs that
 * are free (i.e. not booked by ANY section at that exact period) and which
 * are occupied and by what. This is computed fresh from the static catalog
 * — no database involved, since room occupancy is the same for every
 * student and doesn't depend on anyone's personal timetable.
 */
export function getRoomAvailability(day: Day): PeriodAvailability[] {
  const { regular, labs } = getAllRoomsInternal();
  const periods = getPeriodGrid();

  return periods.map((period) => {
    const occupied: RoomBooking[] = [];
    const occupiedRoomNames = new Set<string>();

    for (const s of catalog) {
      for (const c of s.classes) {
        if (c.day !== day || !c.room || !c.course) continue;
        const start = normalizeTime(c.start);
        const end = normalizeTime(c.end);
        if (start !== period.start_time || end !== period.end_time) continue;
        const room = c.room.trim();
        occupiedRoomNames.add(room);
        occupied.push({
          room,
          section: s.section,
          course: c.course.trim(),
          teacher: c.teacher?.trim() || null,
        });
      }
    }

    const freeRooms = [...regular].filter((r) => !occupiedRoomNames.has(r)).sort();
    const freeLabs = [...labs].filter((r) => !occupiedRoomNames.has(r)).sort();

    return { period, freeRooms, freeLabs, occupied };
  });
}
