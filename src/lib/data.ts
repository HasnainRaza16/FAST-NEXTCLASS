import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { Course, TimetableEntry, AttendanceRecord, Notification, FeedbackItem } from "@/lib/types";
export { summarizeAttendance } from "@/lib/attendance";

async function fetchCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
// Deduped per-request: several server components (layout + page) may ask
// for the current user; this collapses those into a single Supabase Auth
// call instead of one per caller.
export const getCurrentUser = cache(fetchCurrentUser);

async function fetchProfile() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}
export const getProfile = cache(fetchProfile);

async function fetchCourses(): Promise<Course[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("*").order("created_at");
  return (data as Course[]) ?? [];
}
// Cached for the common case (layout + page both need the same list in one
// request). Use `getCoursesFresh` instead when you need an up-to-date read
// right after a mutation within the same request (e.g. after
// autoAssignTimetable()) — the cached version would otherwise still return
// the pre-mutation result for the rest of that request.
export const getCourses = cache(fetchCourses);
export const getCoursesFresh = fetchCourses;

async function fetchTimetable(): Promise<TimetableEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("timetable")
    .select("*, course:courses(*)")
    .order("start_time");
  return (data as unknown as TimetableEntry[]) ?? [];
}
export const getTimetable = cache(fetchTimetable);
export const getTimetableFresh = fetchTimetable;

async function fetchAttendance(): Promise<AttendanceRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("attendance").select("*").order("date", { ascending: false });
  return (data as AttendanceRecord[]) ?? [];
}
export const getAttendance = cache(fetchAttendance);

async function fetchNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as Notification[]) ?? [];
}
export const getNotifications = cache(fetchNotifications);

async function fetchFeedback(): Promise<FeedbackItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as FeedbackItem[]) ?? [];
}
export const getFeedback = cache(fetchFeedback);
