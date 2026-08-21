"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { autoAssignTimetable } from "@/lib/auto-assign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("FAST University");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    // fill in the rest of the profile (the trigger already created name/email)
    if (data.user) {
      await supabase
        .from("profiles")
        .update({ university, department, semester, section })
        .eq("id", data.user.id);
    }
    // If the account is immediately signed in (no email confirmation
    // required), load this student's timetable from their section right
    // away so the dashboard shows it on first render instead of an empty
    // "add your classes" screen.
    if (data.session) {
      await autoAssignTimetable();
    }

    setLoading(false);
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Check your inbox</CardTitle>
            <CardDescription>
              We sent a confirmation link to {email}. Confirm it, then log in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10 dark:bg-neutral-950">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Set up your academic profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="university">University</Label>
              <Input id="university" maxLength={200} value={university} onChange={(e) => setUniversity(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="department">Department</Label>
                <Input id="department" placeholder="BAI" maxLength={80} value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="semester">Semester</Label>
                <Input id="semester" placeholder="Fall 2026" maxLength={40} value={semester} onChange={(e) => setSemester(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="section">Section</Label>
              <Input id="section" placeholder="BAI-1A" maxLength={40} value={section} onChange={(e) => setSection(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-center text-xs text-neutral-400">
              By signing up you agree to the{" "}
              <Link href="/terms" className="underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Creating account…" : "Sign up"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-neutral-900 hover:underline dark:text-white">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
