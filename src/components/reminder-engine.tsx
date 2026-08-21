"use client";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { TimetableEntry } from "@/lib/types";
import { dayName, timeToMinutes } from "@/lib/next-class-engine";

const PREFS_KEY = "nextclass-reminder-prefs";
const FIRED_KEY = "nextclass-reminders-fired";

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

/** Mounted once in the dashboard layout; polls every minute for classes about to start. */
export function ReminderEngine({ entries }: { entries: TimetableEntry[] }) {
  const supabase = useRef(createClient());

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
