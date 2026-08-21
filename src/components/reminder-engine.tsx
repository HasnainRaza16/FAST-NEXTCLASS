"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TimetableEntry } from "@/lib/types";
import { dayName, timeToMinutes } from "@/lib/next-class-engine";

const PREFS_KEY = "nextclass-reminder-prefs";
const FIRED_KEY = "nextclass-reminders-fired";
const REFRESH_MS = 15 * 60_000; // re-pull the timetable every 15 min in case it changed

export interface ReminderPrefsLocal {
  enabled: boolean;
  minutesBefore: number[]; // e.g. [5, 15]
}

export function getReminderPrefs(): ReminderPrefsLocal {
  if (typeof window === "undefined") return { enabled: true, minutesBefore: [15] };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: true, minutesBefore: [15] };
}

export function setReminderPrefs(prefs: ReminderPrefsLocal) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/**
 * Mounted once in the dashboard layout; polls every minute for classes
 * about to start. Fetches its own timetable data client-side (rather than
 * receiving it as a server-fetched prop) so that loading it never blocks
 * page navigation — this component renders nothing, so there's no reason
 * for every single dashboard page to wait on a timetable query just to
 * satisfy it. It refreshes its own copy periodically to pick up schedule
 * changes without needing a full page reload.
 */
export function ReminderEngine() {
  const supabase = useRef(createClient());
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadEntries() {
      const { data } = await supabase.current
        .from("timetable")
        .select("*, course:courses(*)")
        .order("start_time");
      if (!cancelled) setEntries((data as unknown as TimetableEntry[]) ?? []);
    }

    loadEntries();
    const refreshId = setInterval(loadEntries, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(refreshId);
    };
  }, []);

  useEffect(() => {
    const prefs = getReminderPrefs();
    if (!prefs.enabled) return;

    async function check() {
      const now = new Date();
      const today = dayName(now);
      if (!today) return;
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const dateKey = now.toISOString().slice(0, 10);

      let fired: Record<string, boolean> = {};
      try {
        fired = JSON.parse(localStorage.getItem(FIRED_KEY) ?? "{}");
      } catch {}

      for (const entry of entries) {
        if (entry.day !== today) continue;
        const start = timeToMinutes(entry.start_time);
        const diff = start - nowMins;
        for (const m of prefs.minutesBefore) {
          const fireKey = `${dateKey}:${entry.id}:${m}`;
          if (diff === m && !fired[fireKey]) {
            fired[fireKey] = true;
            const title = `${entry.course?.course_name ?? "Class"} starts in ${m} minutes`;
            const message = entry.room_number
              ? `Room ${entry.room_number}${entry.building ? `, ${entry.building}` : ""}. Leave soon.`
              : "Leave soon.";

            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification(`🔔 ${title}`, { body: message });
            }

            await supabase.current.auth.getUser().then(({ data }) => {
              if (data.user) {
                supabase.current.from("notifications").insert({
                  user_id: data.user.id,
                  title,
                  message,
                  kind: "reminder",
                });
              }
            });
          }
        }
      }
      localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
    }

    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [entries]);

  return null;
}

export function requestNotificationPermission() {
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission();
  }
}
