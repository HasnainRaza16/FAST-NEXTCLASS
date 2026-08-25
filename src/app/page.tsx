import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock, BellRing, TrendingUp, BookOpen } from "lucide-react";
import { LinkedinIcon } from "@/components/linkedin-icon";

const DEVELOPER_LINKEDIN_URL = "https://www.linkedin.com/in/hasnain-raza-15a7872b7";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-black">
      <a
        href={DEVELOPER_LINKEDIN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur transition-colors hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-white"
      >
        <LinkedinIcon className="h-4 w-4 text-[#0A66C2]" />
        About the developer
      </a>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <CalendarClock className="h-5 w-5" />
          FAST NextClass
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Your personal academic assistant
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-neutral-500 dark:text-neutral-400">
          Enter your timetable once. FAST NextClass tells you what&apos;s next, where to go,
          how much time you have, and keeps your attendance on track.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">Get started free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">I already have an account</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-left">
              <CalendarClock className="mb-3 h-6 w-6" />
              <h3 className="font-semibold">Always know what&apos;s next</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Live countdown to your next class, room, and teacher.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-left">
              <BellRing className="mb-3 h-6 w-6" />
              <h3 className="font-semibold">Smart reminders</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Get nudged 5–30 minutes before class starts.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-left">
              <TrendingUp className="mb-3 h-6 w-6" />
              <h3 className="font-semibold">Attendance tracking</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Automatic percentages with low-attendance warnings.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-left">
              <BookOpen className="mb-3 h-6 w-6" />
              <h3 className="font-semibold">Course materials</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Slides, past papers, and quizzes for every subject, semester-wise.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="mx-auto mt-16 max-w-6xl border-t border-neutral-200 px-6 py-8 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p>© {new Date().getFullYear()} FAST NextClass. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
