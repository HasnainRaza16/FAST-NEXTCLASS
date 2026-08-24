import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { Course, TimetableEntry, AttendanceRecord, Notification, FeedbackItem, GradeEntry } from "@/lib/types";
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
  // No need to call auth.getUser() first to get an id to filter by: the
  // "profiles: owner read" RLS policy (auth.uid() = id) already restricts
  // this select to the caller's own row. Skipping the extra lookup removes
  // one full network round-trip to Supabase Auth from every page that
  // fetches the profile — which is nearly every dashboard navigation.
  const { data, error } = await supabase.from("profiles").select("*").single();
  if (error) {
    // PGRST116 = "no rows returned by .single()" — a genuinely new account
    // that hasn't finished onboarding yet. That's a normal state, not a
    // failure, so it's fine to return null and let the UI show its usual
    // "add your section" prompt.
    if (error.code === "PGRST116") return null;
    // Any other error (auth/session hiccup, network failure, RLS
    // misconfiguration, etc.) must NOT be silently treated as "no
    // profile" — that previously showed up to the user as an empty
    // dashboard or a blank-looking profile page with no explanation.
    // Throwing here lets the error.tsx boundary show a real "something
    // went wrong, try again" instead of a misleading empty state.
    throw new Error(`Failed to load profile: ${error.message}`);
  }
  return data;
}
export const getProfile = cache(fetchProfile);

async function fetchCourses(): Promise<Course[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("courses").select("*").order("created_at");
  if (error) throw new Error(`Failed to load courses: ${error.message}`);
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
  const { data, error } = await supabase
    .from("timetable")
    .select("*, course:courses(*)")
    .order("start_time");
  if (error) throw new Error(`Failed to load timetable: ${error.message}`);
  return (data as unknown as TimetableEntry[]) ?? [];
}
export const getTimetable = cache(fetchTimetable);
export const getTimetableFresh = fetchTimetable;

async function fetchAttendance(): Promise<AttendanceRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("attendance").select("*").order("date", { ascending: false });
  if (error) throw new Error(`Failed to load attendance: ${error.message}`);
  return (data as AttendanceRecord[]) ?? [];
}
export const getAttendance = cache(fetchAttendance);

async function fetchNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Failed to load notifications: ${error.message}`);
  return (data as Notification[]) ?? [];
}
export const getNotifications = cache(fetchNotifications);

async function fetchFeedback(): Promise<FeedbackItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load feedback: ${error.message}`);
  return (data as FeedbackItem[]) ?? [];
}
export const getFeedback = cache(fetchFeedback);

async function fetchGrades(): Promise<GradeEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("grades").select("*").order("created_at");
  if (error) throw new Error(`Failed to load grades: ${error.message}`);
  return (data as GradeEntry[]) ?? [];
}
export const getGrades = cache(fetchGrades);
export const getGradesFresh = fetchGrades;
