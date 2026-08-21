"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Profile } from "@/lib/types";
import { getReminderPrefs, setReminderPrefs, requestNotificationPermission } from "@/components/reminder-engine";
import { autoAssignTimetable } from "@/lib/auto-assign";

const REMINDER_OPTIONS = [5, 10, 15, 30];

export function ProfileForm({ initialProfile }: { initialProfile: Profile | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [savedSection, setSavedSection] = useState(initialProfile?.section ?? null);
  const [saving, setSaving] = useState(false);
  const [timetableNote, setTimetableNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState(getReminderPrefs());

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setTimetableNote(null);

    const sectionChanged = profile.section !== savedSection;

    const { error: saveError } = await supabase
      .from("profiles")
      .update({
        name: profile.name,
        university: profile.university,
        department: profile.department,
        semester: profile.semester,
        section: profile.section,
      })
      .eq("id", profile.id);

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    // The student's section changed — reload their timetable to match.
    // Their old auto-loaded classes are swapped out; anything they added
    // manually is left untouched.
    if (sectionChanged && profile.section) {
      const result = await autoAssignTimetable();
      if (result.status === "ok") {
        setTimetableNote(`Timetable updated for section ${profile.section}.`);
      } else if (result.status === "not_found") {
        setTimetableNote(
          `No timetable is available yet for section ${profile.section}. You can add classes manually from Schedule.`
        );
      } else if (result.status === "error") {
        setTimetableNote(result.message);
      }
      setSavedSection(profile.section);
    }

    setSaving(false);
    router.refresh();
  }

  function toggleReminders(enabled: boolean) {
    const next = { ...prefs, enabled };
    setPrefs(next);
    setReminderPrefs(next);
    if (enabled) requestNotificationPermission();
  }

  function toggleMinute(m: number) {
    const has = prefs.minutesBefore.includes(m);
    const next = {
      ...prefs,
      minutesBefore: has ? prefs.minutesBefore.filter((x) => x !== m) : [...prefs.minutesBefore, m].sort((a, b) => a - b),
    };
    setPrefs(next);
    setReminderPrefs(next);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!profile) {
    return (
      <p className="text-sm text-neutral-500">
        Please select your semester and section to load your timetable.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Info</CardTitle>
          <CardDescription>{profile.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input maxLength={120} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>University</Label>
              <Input maxLength={200} value={profile.university ?? ""} onChange={(e) => setProfile({ ...profile, university: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Department</Label>
              <Input maxLength={80} value={profile.department ?? ""} onChange={(e) => setProfile({ ...profile, department: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Semester</Label>
              <Input maxLength={40} value={profile.semester ?? ""} onChange={(e) => setProfile({ ...profile, semester: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Section</Label>
              <Input maxLength={40} value={profile.section ?? ""} onChange={(e) => setProfile({ ...profile, section: e.target.value })} />
              <p className="text-xs text-neutral-400">Changing this reloads your timetable automatically.</p>
            </div>
            {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
            {timetableNote && <p className="text-sm text-neutral-500 sm:col-span-2">{timetableNote}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminders</CardTitle>
          <CardDescription>Get notified before class starts.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Enable reminders</span>
            <Switch checked={prefs.enabled} onCheckedChange={toggleReminders} />
          </div>
          {prefs.enabled && (
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => toggleMinute(m)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    prefs.minutesBefore.includes(m)
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                      : "border-neutral-200 dark:border-neutral-800"
                  }`}
                >
                  {m} min before
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-fit" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  );
}
